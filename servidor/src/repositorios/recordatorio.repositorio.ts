import {
  verificarCuentaModificable,
  eliminacionBloqueoId,
} from "./eliminacionCuenta.repositorio"
import { createHash, randomUUID } from "node:crypto"
import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import {
  leerRecordatorioAjustes,
  type ConfiguracionRecordatorios,
} from "../../../compartido/recordatorios"
import {
  siguienteRecordatorio,
  recordatorioLocalFecha,
} from "../servicios/programacionRecordatorios"
import type { RecordatorioCorreo } from "../servicios/recordatorioCorreo"

export async function guardarRecordatorioAjustes(
  uid: string,
  ajustes: ConfiguracionRecordatorios,
  ahora = new Date(),
  baseDatos = obtenerFirestoreAdmin(),
) {
  const referencia = baseDatos.doc(`users/${uid}`)
  await baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, uid, baseDatos)
    const instantanea = await transaccion.get(referencia)
    if (!instantanea.exists) throw new Error("Profile missing")
    const anterior = instantanea.data()!
    if (anterior.countryCode && typeof anterior.timeZone === "string")
      ajustes = { ...ajustes, timeZone: anterior.timeZone }
    const programado = ajustes.enabled
      ? Timestamp.fromDate(siguienteRecordatorio(ajustes, ahora))
      : null
    transaccion.update(referencia, {
      reminderPreferences: ajustes,
      reminderConsentId:
        ajustes.enabled &&
        leerRecordatorioAjustes(anterior.reminderPreferences).enabled
          ? (anterior.reminderConsentId ?? randomUUID())
          : randomUUID(),
      reminderVersion: randomUUID(),
      reminderNextAt: programado,
      reminderOccurrenceAt: programado,
      "accessibilityPreferences.recordatorios": ajustes.enabled,
      "accessibilityPreferences.frecuenciaRecordatorio":
        ajustes.frequency === "weekly" ? "weekly" : "daily",
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function obtenerRecordatorioEstado(
  uid: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  const [perfil, tarea] = await Promise.all([
    baseDatos.doc(`users/${uid}`).get(),
    baseDatos.doc("internalJobs/reminders").get(),
  ])
  return { profile: perfil.data(), job: tarea.data() }
}

export async function adquirirRecordatorioTarea(
  propietario: string,
  ahora: Date,
  baseDatos = obtenerFirestoreAdmin(),
) {
  return baseDatos.runTransaction(async (transaccion) => {
    const referencia = baseDatos.doc("internalJobs/reminders"),
      instantanea = await transaccion.get(referencia)
    if (
      (instantanea.data()?.leaseUntil as Timestamp | undefined)?.toMillis()! >
      ahora.getTime()
    )
      return false
    transaccion.set(
      referencia,
      {
        owner: propietario,
        leaseUntil: Timestamp.fromMillis(ahora.getTime() + 240000),
        lastStartedAt: Timestamp.fromDate(ahora),
      },
      { merge: true },
    )
    return true
  })
}

export async function liberarRecordatorioTarea(
  propietario: string,
  baseDatos = obtenerFirestoreAdmin(),
  completado = false,
) {
  await baseDatos.runTransaction(async (transaccion) => {
    const referencia = baseDatos.doc("internalJobs/reminders"),
      instantanea = await transaccion.get(referencia)
    if (instantanea.data()?.owner === propietario)
      transaccion.update(referencia, {
        leaseUntil: Timestamp.fromMillis(0),
        lastJobFailed: !completado,
        ...(completado ? { lastRunAt: Timestamp.fromDate(new Date()) } : {}),
      })
  })
}

export async function buscarProgramadoRecordatorios(
  ahora: Date,
  limite: number,
  baseDatos = obtenerFirestoreAdmin(),
) {
  const instantanea = await baseDatos
    .collection("users")
    .where("reminderPreferences.enabled", "==", true)
    .where("reminderNextAt", "<=", Timestamp.fromDate(ahora))
    .orderBy("reminderNextAt")
    .orderBy(FieldPath.documentId())
    .limit(limite)
    .get()
  return instantanea.docs.map((documento) => documento.id)
}

export interface ReservadoRecordatorio {
  uid: string
  id: string
  version: string
  consent: string
  settings: ConfiguracionRecordatorios
  occurrence: Date
  attempts: number
  firstAttemptAt: number
  email?: RecordatorioCorreo
}

export async function reservaRecordatorio(
  uid: string,
  ahora: Date,
  baseDatos = obtenerFirestoreAdmin(),
): Promise<ReservadoRecordatorio | null> {
  return baseDatos.runTransaction(async (transaccion) => {
    if (
      (
        await transaccion.get(
          baseDatos.doc(`accountDeletionLocks/${eliminacionBloqueoId(uid)}`),
        )
      ).exists
    )
      return null
    const referencia = baseDatos.doc(`users/${uid}`),
      instantanea = await transaccion.get(referencia),
      perfil = instantanea.data()
    if (!perfil) return null
    const ajustes = leerRecordatorioAjustes(perfil.reminderPreferences)
    const siguiente = perfil.reminderNextAt as Timestamp | undefined
    const ocurrencia = perfil.reminderOccurrenceAt as Timestamp | undefined
    if (
      !ajustes.enabled ||
      !siguiente ||
      !ocurrencia ||
      siguiente.toMillis() > ahora.getTime()
    )
      return null
    const id = createHash("sha256")
      .update(recordatorioLocalFecha(ocurrencia.toDate(), ajustes.timeZone))
      .digest("hex")
    const entregaReferencia = referencia
      .collection("reminderDeliveries")
      .doc(id)
    const entrega = (await transaccion.get(entregaReferencia)).data()
    const avanzar = () => {
      const programado = Timestamp.fromDate(
        siguienteRecordatorio(ajustes, ahora),
      )
      transaccion.update(referencia, {
        reminderNextAt: programado,
        reminderOccurrenceAt: programado,
      })
    }
    if (
      entrega?.status === "accepted" ||
      entrega?.status === "skipped" ||
      entrega?.status === "failed"
    ) {
      avanzar()
      return null
    }
    if (entrega && entrega.version !== perfil.reminderVersion) {
      transaccion.update(entregaReferencia, {
        status: "skipped",
        reason: "preferences_changed",
        email: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      avanzar()
      return null
    }
    if (
      (entrega?.leaseUntil as Timestamp | undefined)?.toMillis()! >
      ahora.getTime()
    )
      return null
    const primeroIntentoEjercicios =
      typeof entrega?.firstAttemptAt === "number"
        ? entrega.firstAttemptAt
        : ahora.getTime()
    const intentos = Number(entrega?.attempts ?? 0)
    if (
      intentos >= 5 ||
      ahora.getTime() - primeroIntentoEjercicios >= 18 * 3600000 ||
      (!entrega && ahora.getTime() - ocurrencia.toMillis() > 30 * 60000)
    ) {
      transaccion.set(
        entregaReferencia,
        {
          status: "skipped",
          reason: "expired",
          email: FieldValue.delete(),
          expiresAt: Timestamp.fromMillis(ahora.getTime() + 30 * 86400000),
          version: perfil.reminderVersion,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      avanzar()
      return null
    }
    transaccion.set(
      entregaReferencia,
      {
        status: "sending",
        version: perfil.reminderVersion,
        firstAttemptAt: primeroIntentoEjercicios,
        attempts: intentos + 1,
        expiresAt: Timestamp.fromMillis(ahora.getTime() + 30 * 86400000),
        leaseUntil: Timestamp.fromMillis(ahora.getTime() + 120000),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    return {
      uid,
      id,
      version: String(perfil.reminderVersion),
      consent: String(perfil.reminderConsentId),
      settings: ajustes,
      occurrence: ocurrencia.toDate(),
      attempts: intentos + 1,
      firstAttemptAt: primeroIntentoEjercicios,
      email: entrega?.email as RecordatorioCorreo | undefined,
    }
  })
}

export async function prepararRecordatorioCorreo(
  reserva: ReservadoRecordatorio,
  correo: RecordatorioCorreo,
  baseDatos = obtenerFirestoreAdmin(),
) {
  return baseDatos.runTransaction(async (transaccion) => {
    if (
      (
        await transaccion.get(
          baseDatos.doc(
            `accountDeletionLocks/${eliminacionBloqueoId(reserva.uid)}`,
          ),
        )
      ).exists
    )
      return false
    const perfilReferencia = baseDatos.doc(`users/${reserva.uid}`),
      perfil = (await transaccion.get(perfilReferencia)).data()
    if (
      !perfil ||
      perfil.reminderVersion !== reserva.version ||
      !leerRecordatorioAjustes(perfil.reminderPreferences).enabled ||
      perfil.active === false ||
      perfil.disabled === true ||
      perfil.deletedAt
    )
      return false
    const referencia = perfilReferencia
      .collection("reminderDeliveries")
      .doc(reserva.id)
    const entrega = (await transaccion.get(referencia)).data()
    if (
      !entrega ||
      entrega.status !== "sending" ||
      entrega.attempts !== reserva.attempts
    )
      return false
    transaccion.update(referencia, { email: correo })
    return true
  })
}

export async function finalizarRecordatorio(
  reserva: ReservadoRecordatorio,
  estado: "accepted" | "skipped" | "failed" | "retry",
  motivo: string,
  ahora: Date,
  reintentarDespuesSegundos = 60,
  baseDatos = obtenerFirestoreAdmin(),
) {
  await baseDatos.runTransaction(async (transaccion) => {
    if (
      (
        await transaccion.get(
          baseDatos.doc(
            `accountDeletionLocks/${eliminacionBloqueoId(reserva.uid)}`,
          ),
        )
      ).exists
    )
      return
    const perfilReferencia = baseDatos.doc(`users/${reserva.uid}`),
      referencia = perfilReferencia
        .collection("reminderDeliveries")
        .doc(reserva.id)
    const [instantanea, entregaInstantanea] = await Promise.all([
      transaccion.get(perfilReferencia),
      transaccion.get(referencia),
    ])
    const perfil = instantanea.data(),
      entrega = entregaInstantanea.data()
    if (
      !entrega ||
      entrega.attempts !== reserva.attempts ||
      entrega.status !== "sending"
    )
      return
    transaccion.update(referencia, {
      status: estado,
      reason: motivo,
      leaseUntil: Timestamp.fromMillis(0),
      ...(estado === "retry" && reserva.attempts < 5
        ? {}
        : { email: FieldValue.delete() }),
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (
      !perfil ||
      perfil.reminderVersion !== reserva.version ||
      !leerRecordatorioAjustes(perfil.reminderPreferences).enabled
    )
      return
    const reintentar =
      estado === "retry" &&
      reserva.attempts < 5 &&
      ahora.getTime() - reserva.firstAttemptAt < 18 * 3600000
    const programado = reintentar
      ? new Date(
          ahora.getTime() +
            Math.max(
              reintentarDespuesSegundos,
              60 * 2 ** (reserva.attempts - 1),
            ) *
              1000,
        )
      : siguienteRecordatorio(reserva.settings, ahora)
    transaccion.update(perfilReferencia, {
      reminderDeliveryError: estado === "retry" || estado === "failed",
      reminderNextAt: Timestamp.fromDate(programado),
      ...(reintentar
        ? {}
        : { reminderOccurrenceAt: Timestamp.fromDate(programado) }),
    })
  })
}

export async function deshabilitarRecordatorios(
  uid: string,
  consentimiento: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  await baseDatos.runTransaction(async (transaccion) => {
    if (
      (
        await transaccion.get(
          baseDatos.doc(`accountDeletionLocks/${eliminacionBloqueoId(uid)}`),
        )
      ).exists
    )
      return
    const referencia = baseDatos.doc(`users/${uid}`),
      instantanea = await transaccion.get(referencia),
      perfil = instantanea.data()
    if (!perfil || perfil.reminderConsentId !== consentimiento) return
    transaccion.update(referencia, {
      "reminderPreferences.enabled": false,
      "accessibilityPreferences.recordatorios": false,
      reminderVersion: randomUUID(),
      reminderNextAt: null,
      reminderOccurrenceAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function reservarRecordatorioCupo(
  ahora: Date,
  limite: number,
  baseDatos = obtenerFirestoreAdmin(),
) {
  return baseDatos.runTransaction(async (transaccion) => {
    const referencia = baseDatos.doc(
        `internalJobs/reminderQuota-${ahora.toISOString().slice(0, 10)}`,
      ),
      instantanea = await transaccion.get(referencia)
    const intentos = Number(instantanea.data()?.attempts ?? 0)
    if (intentos >= limite) return false
    transaccion.set(referencia, {
      attempts: intentos + 1,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return true
  })
}
