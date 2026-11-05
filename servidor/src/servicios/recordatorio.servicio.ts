import { randomUUID, createHash } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { Timestamp } from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import {
  leerRecordatorioAjustes,
  validarRecordatorioAjustes,
  type RecordatorioPreferenciasRespuesta,
} from "../../../compartido/recordatorios"
import {
  adquirirRecordatorioTarea,
  reservaRecordatorio,
  deshabilitarRecordatorios,
  buscarProgramadoRecordatorios,
  finalizarRecordatorio,
  obtenerRecordatorioEstado,
  prepararRecordatorioCorreo,
  liberarRecordatorioTarea,
  reservarRecordatorioCupo,
  guardarRecordatorioAjustes,
  type ReservadoRecordatorio,
} from "../repositorios/recordatorio.repositorio"
import {
  crearRecordatorioCorreo,
  CorreoEntregaError,
  leerDarBajaToken,
  recordatorioConfiguracion,
  enviarRecordatorioCorreo,
  validoCorreo,
  type RecordatorioCorreo,
} from "./recordatorioCorreo"

export interface RecordatorioCuenta {
  email?: string
  emailVerified: boolean
  disabled: boolean
}

const leerCuenta = (uid: string): Promise<RecordatorioCuenta> =>
  getAuth().getUser(uid)

export async function obtenerRecordatorioPreferencias(
  uid: string,
  baseDatos = obtenerFirestoreAdmin(),
  lectorCuenta = leerCuenta,
  configuracion = recordatorioConfiguracion(),
  ahora = new Date(),
): Promise<RecordatorioPreferenciasRespuesta> {
  const { profile: perfil, job: tarea } = await obtenerRecordatorioEstado(
    uid,
    baseDatos,
  )
  if (!perfil) throw new Error("Profile missing")
  const ajustes = leerRecordatorioAjustes(perfil.reminderPreferences)
  if (perfil.countryCode && typeof perfil.timeZone === "string")
    ajustes.timeZone = perfil.timeZone
  const cuenta = await lectorCuenta(uid)
  const ultimoEjecutar =
    tarea?.lastRunAt instanceof Timestamp ? tarea.lastRunAt.toMillis() : 0
  const estado = !configuracion.configured
    ? "notConfigured"
    : !ajustes.enabled
      ? "disabled"
      : !cuenta.emailVerified ||
          cuenta.disabled ||
          !validoCorreo(cuenta.email) ||
          perfil.active === false ||
          perfil.disabled === true ||
          perfil.deletedAt
        ? "unverified"
        : tarea?.lastJobFailed === true ||
            ahora.getTime() - ultimoEjecutar > 15 * 60000
          ? "awaitingScheduler"
          : perfil.reminderDeliveryError
            ? "deliveryError"
            : "ready"
  return { settings: ajustes, status: estado }
}

export async function modificarRecordatorioPreferencias(
  uid: string,
  entrada: unknown,
  baseDatos = obtenerFirestoreAdmin(),
  lectorCuenta = leerCuenta,
  configuracion = recordatorioConfiguracion(),
) {
  const ajustes = validarRecordatorioAjustes(entrada)
  await guardarRecordatorioAjustes(uid, ajustes, new Date(), baseDatos)
  return obtenerRecordatorioPreferencias(
    uid,
    baseDatos,
    lectorCuenta,
    configuracion,
  )
}

export async function darBajaRecordatorio(
  token: unknown,
  baseDatos = obtenerFirestoreAdmin(),
  configuracion = recordatorioConfiguracion(),
) {
  const identidad = leerDarBajaToken(token, configuracion.secret)
  if (!identidad) return false
  await deshabilitarRecordatorios(identidad.uid, identidad.consent, baseDatos)
  return true
}

export interface RecordatorioEntregaDependencias {
  accountReader: (uid: string) => Promise<RecordatorioCuenta>
  prepare: (
    reserva: ReservadoRecordatorio,
    correo: RecordatorioCorreo,
  ) => Promise<boolean>
  finish: (
    reserva: ReservadoRecordatorio,
    estado: "accepted" | "skipped" | "failed" | "retry",
    motivo: string,
    ahora: Date,
    reintentarDespues?: number,
  ) => Promise<void>
  quota: () => Promise<boolean>
  send: (correo: RecordatorioCorreo, clave: string) => Promise<string>
  now: () => Date
}

export async function entregarRecordatorio(
  reserva: ReservadoRecordatorio,
  dependencias: RecordatorioEntregaDependencias,
  configuracion = recordatorioConfiguracion(),
) {
  const finalizar = (
    estado: Parameters<RecordatorioEntregaDependencias["finish"]>[1],
    motivo: string,
    reintentarDespues?: number,
  ) =>
    dependencias.finish(
      reserva,
      estado,
      motivo,
      dependencias.now(),
      reintentarDespues,
    )
  let cuenta: RecordatorioCuenta
  try {
    cuenta = await dependencias.accountReader(reserva.uid)
  } catch (error) {
    const faltante =
      !!error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "auth/user-not-found"
    await finalizar(
      faltante ? "skipped" : "retry",
      faltante ? "account_missing" : "account_unavailable",
    )
    return
  }
  if (cuenta.disabled || !cuenta.emailVerified || !validoCorreo(cuenta.email)) {
    await finalizar("skipped", "account_ineligible")
    return
  }
  if (reserva.email && reserva.email.to !== cuenta.email) {
    await finalizar("skipped", "email_changed")
    return
  }
  const correo =
    reserva.email ??
    crearRecordatorioCorreo(
      reserva.uid,
      reserva.consent,
      cuenta.email,
      dependencias.now(),
      configuracion,
    )
  if (!(await dependencias.prepare(reserva, correo))) {
    await finalizar("skipped", "preferences_changed")
    return
  }
  if (!(await dependencias.quota())) {
    await finalizar("failed", "daily_limit")
    return
  }
  const clave = `menteclear-reminder/${createHash("sha256").update(reserva.uid).digest("hex")}/${reserva.id}`
  try {
    await dependencias.send(correo, clave)
    await finalizar("accepted", "provider_accepted")
  } catch (error) {
    const fallo =
      error instanceof CorreoEntregaError
        ? error
        : new CorreoEntregaError(true, "provider_unavailable")
    await finalizar(
      fallo.retryable ? "retry" : "failed",
      fallo.code,
      fallo.retryAfterSeconds,
    )
  }
}

export async function despacharRecordatorios(
  baseDatos = obtenerFirestoreAdmin(),
  configuracion = recordatorioConfiguracion(),
) {
  if (!configuracion.configured)
    throw new Error("Reminder infrastructure unavailable")
  const propietario = randomUUID(),
    iniciado = Date.now()
  if (!(await adquirirRecordatorioTarea(propietario, new Date(), baseDatos)))
    return { busy: true, processed: 0 }
  let procesado = 0,
    completado = false
  const configuradoLimite = Number(process.env.REMINDER_DAILY_LIMIT ?? 90)
  const diarioLimite =
    Number.isInteger(configuradoLimite) &&
    configuradoLimite > 0 &&
    configuradoLimite <= 10000
      ? configuradoLimite
      : 90
  try {
    // Limita cada ejecución; las cuentas pendientes se procesan en la siguiente invocación externa.
    for (let lote = 0; lote < 10 && Date.now() - iniciado < 190000; lote++) {
      const usuarios = await buscarProgramadoRecordatorios(
        new Date(),
        20,
        baseDatos,
      )
      if (!usuarios.length) break
      for (const uid of usuarios) {
        if (Date.now() - iniciado >= 190000) break
        const reserva = await reservaRecordatorio(uid, new Date(), baseDatos)
        if (!reserva) continue
        await entregarRecordatorio(
          reserva,
          {
            accountReader: leerCuenta,
            prepare: (elemento, correo) =>
              prepararRecordatorioCorreo(elemento, correo, baseDatos),
            finish: (elemento, estado, motivo, ahora, reintentarDespues) =>
              finalizarRecordatorio(
                elemento,
                estado,
                motivo,
                ahora,
                reintentarDespues,
                baseDatos,
              ),
            quota: () =>
              reservarRecordatorioCupo(new Date(), diarioLimite, baseDatos),
            send: (correo, clave) =>
              enviarRecordatorioCorreo(correo, clave, configuracion.apiKey),
            now: () => new Date(),
          },
          configuracion,
        )
        procesado++
        // Las solicitudes se realizan en serie bajo un bloqueo distribuido: como máximo una por segundo.
        await new Promise((resolver) => setTimeout(resolver, 1000))
      }
      if (usuarios.length < 20) break
    }
    completado = true
    console.info("reminders.job_completed", { processed: procesado })
    return { busy: false, processed: procesado }
  } finally {
    await liberarRecordatorioTarea(propietario, baseDatos, completado)
  }
}
