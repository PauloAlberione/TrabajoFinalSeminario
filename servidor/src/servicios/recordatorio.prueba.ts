import test from "node:test"
import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { aplicacion } from "../aplicacion"
import assert from "node:assert/strict"
import { Timestamp, type Firestore } from "firebase-admin/firestore"
import type { Request, Response } from "express"
import {
  PREDETERMINADO_RECORDATORIOS,
  validarRecordatorioAjustes,
} from "../../../compartido/recordatorios"
import {
  siguienteRecordatorio,
  recordatorioLocalFecha,
} from "./programacionRecordatorios"
import {
  crearRecordatorioCorreo,
  CorreoEntregaError,
  leerDarBajaToken,
  recordatorioConfiguracion,
  enviarRecordatorioCorreo,
  darBajaToken,
} from "./recordatorioCorreo"
import {
  entregarRecordatorio,
  obtenerRecordatorioPreferencias,
  modificarRecordatorioPreferencias,
  type RecordatorioEntregaDependencias,
} from "./recordatorio.servicio"
import {
  adquirirRecordatorioTarea,
  reservaRecordatorio,
  deshabilitarRecordatorios,
  buscarProgramadoRecordatorios,
  finalizarRecordatorio,
  prepararRecordatorioCorreo,
  liberarRecordatorioTarea,
  reservarRecordatorioCupo,
  guardarRecordatorioAjustes,
} from "../repositorios/recordatorio.repositorio"
import { modificarPerfil } from "./usuario.servicio"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import {
  obtenerRecordatorios,
  modificarRecordatorios,
  darBajaRecordatorios,
} from "../controladores/recordatorio.controlador"
import {
  exigirRecordatorioProgramador,
  recordatorioProgramadorProteccion,
} from "../intermediarios/programador.intermediario"

const ahora = new Date("2026-11-02T13:00:00Z")
const ajustes = { ...PREDETERMINADO_RECORDATORIOS, enabled: true }
const cuenta = async () => ({
  email: "ana@example.com",
  emailVerified: true,
  disabled: false,
})
const configuracion = {
  ...recordatorioConfiguracion(),
  configured: true,
  enabled: true,
  from: "recordatorios@example.com",
  apiKey: "test-key",
  secret: "a".repeat(40),
  apiUrl: "https://api.example.com",
  appUrl: "https://example.com",
  audience: "https://api.example.com",
  serviceAccount: "scheduler@example.com",
}

async function prepararPrueba() {
  const almacen = new AlmacenTransacciones()
  almacen.documents.set("users/owner", {
    firstName: "Ana",
    accessibilityPreferences: { altoContraste: true, sonidos: false },
    reminderPreferences: { ...PREDETERMINADO_RECORDATORIOS, enabled: false },
  })
  almacen.documents.set("users/other", { firstName: "Other" })
  await guardarRecordatorioAjustes(
    "owner",
    ajustes,
    new Date(ahora.getTime() - 60000),
    almacen.database,
  )
  return almacen
}

function dependencias(
  almacen: AlmacenTransacciones,
  enviar: RecordatorioEntregaDependencias["send"] = async () => "provider-id",
): RecordatorioEntregaDependencias {
  return {
    accountReader: cuenta,
    prepare: (
      reserva: NonNullable<Awaited<ReturnType<typeof reservaRecordatorio>>>,
      correo: ReturnType<typeof crearRecordatorioCorreo>,
    ) => prepararRecordatorioCorreo(reserva, correo, almacen.database),
    finish: (
      reserva: NonNullable<Awaited<ReturnType<typeof reservaRecordatorio>>>,
      estado: "accepted" | "skipped" | "failed" | "retry",
      motivo: string,
      tiempo: Date,
      reintentar?: number,
    ) =>
      finalizarRecordatorio(
        reserva,
        estado,
        motivo,
        tiempo,
        reintentar,
        almacen.database,
      ),
    quota: () => reservarRecordatorioCupo(ahora, 90, almacen.database),
    send: enviar,
    now: () => ahora,
  }
}

test("La programación diaria, semanal y por días respeta zonas horarias y ocurrencias futuras", () => {
  assert.equal(
    siguienteRecordatorio(ajustes, ahora).toISOString(),
    "2026-11-03T13:00:00.000Z",
  )
  assert.equal(
    siguienteRecordatorio(
      { ...ajustes, frequency: "weekly", weekdays: [1] },
      ahora,
    ).toISOString(),
    "2026-11-09T13:00:00.000Z",
  )
  assert.equal(
    siguienteRecordatorio(
      { ...ajustes, frequency: "weekdays", weekdays: [3, 5] },
      ahora,
    ).toISOString(),
    "2026-11-04T13:00:00.000Z",
  )
  assert.equal(
    siguienteRecordatorio(
      { ...ajustes, timeZone: "Asia/Kathmandu", time: "00:05" },
      new Date("2026-11-02T18:00Z"),
    ).toISOString(),
    "2026-11-02T18:20:00.000Z",
  )
  assert.equal(
    recordatorioLocalFecha(new Date("2026-11-03T00:01Z"), ajustes.timeZone),
    "2026-11-02",
  )
})

test("Los cambios horarios omiten horas inexistentes y eligen una sola ocurrencia de horas repetidas", () => {
  assert.equal(
    siguienteRecordatorio(
      { ...ajustes, timeZone: "America/New_York", time: "02:30" },
      new Date("2026-03-08T06:59Z"),
    ).toISOString(),
    "2026-03-09T06:30:00.000Z",
  )
  assert.equal(
    siguienteRecordatorio(
      {
        ...ajustes,
        frequency: "weekly",
        weekdays: [0],
        timeZone: "America/New_York",
        time: "02:30",
      },
      new Date("2026-03-01T08:00Z"),
    ).toISOString(),
    "2026-03-15T06:30:00.000Z",
  )
  const repetido = { ...ajustes, timeZone: "America/New_York", time: "01:30" }
  assert.equal(
    siguienteRecordatorio(
      repetido,
      new Date("2026-11-01T04:00Z"),
    ).toISOString(),
    "2026-11-01T05:30:00.000Z",
  )
  assert.equal(
    siguienteRecordatorio(
      repetido,
      new Date("2026-11-01T05:45Z"),
    ).toISOString(),
    "2026-11-02T06:30:00.000Z",
  )
})

test("La configuración rechaza UID arbitrario, horas, zonas, días y frecuencias inválidos", () => {
  for (const invalido of [
    { ...ajustes, uid: "other" },
    { ...ajustes, time: "24:00" },
    { ...ajustes, timeZone: "invalid/zone" },
    { ...ajustes, enabled: "yes" },
    { ...ajustes, weekdays: [] },
    { ...ajustes, weekdays: [8] },
    { ...ajustes, weekdays: [1, 1] },
    { ...ajustes, frequency: "weekly", weekdays: [1, 2] },
    { ...ajustes, frequency: "monthly" },
  ])
    assert.throws(() => validarRecordatorioAjustes(invalido))
  assert.deepEqual(validarRecordatorioAjustes(ajustes), ajustes)
})

test("Los cambios parciales conservan otras preferencias y exigen consentimiento y aislamiento", async () => {
  const almacen = await prepararPrueba()
  assert.equal(
    almacen.documents.get("users/owner")!.accessibilityPreferences &&
      (almacen.documents.get("users/owner")!
        .accessibilityPreferences as Record<string, unknown>).altoContraste,
    true,
  )
  assert.deepEqual(almacen.documents.get("users/other"), { firstName: "Other" })
  const respuesta = await obtenerRecordatorioPreferencias(
    "owner",
    almacen.database,
    cuenta,
    configuracion,
    ahora,
  )
  assert.equal(respuesta.status, "awaitingScheduler")
  almacen.documents.set("internalJobs/reminders", {
    lastRunAt: Timestamp.fromDate(ahora),
  })
  assert.equal(
    (
      await obtenerRecordatorioPreferencias(
        "owner",
        almacen.database,
        cuenta,
        configuracion,
        ahora,
      )
    ).status,
    "ready",
  )
  assert.equal(
    (
      await obtenerRecordatorioPreferencias(
        "owner",
        almacen.database,
        cuenta,
        { ...configuracion, configured: false },
        ahora,
      )
    ).status,
    "notConfigured",
  )
  assert.equal(
    (
      await obtenerRecordatorioPreferencias(
        "owner",
        almacen.database,
        async () => ({ ...(await cuenta()), emailVerified: false }),
        configuracion,
        ahora,
      )
    ).status,
    "unverified",
  )
  await modificarRecordatorioPreferencias(
    "owner",
    { ...ajustes, enabled: false },
    almacen.database,
    cuenta,
    configuracion,
  )
  assert.equal(
    (
      await obtenerRecordatorioPreferencias(
        "owner",
        almacen.database,
        cuenta,
        configuracion,
        ahora,
      )
    ).status,
    "disabled",
  )
  assert.equal(almacen.documents.get("users/owner")!.reminderNextAt, null)
  almacen.documents.set("users/legacy", {
    accessibilityPreferences: { recordatorios: true },
  })
  assert.equal(
    (
      await obtenerRecordatorioPreferencias(
        "legacy",
        almacen.database,
        cuenta,
        configuracion,
        ahora,
      )
    ).settings.enabled,
    false,
  )
})

test("El bloqueo global y la cuota diaria son transaccionales entre instancias simultáneas", async () => {
  const almacen = await prepararPrueba()
  const adquirido = await Promise.all(
    ["one", "two"].map((propietario) =>
      adquirirRecordatorioTarea(propietario, ahora, almacen.database),
    ),
  )
  assert.equal(adquirido.filter(Boolean).length, 1)
  await liberarRecordatorioTarea("not-owner", almacen.database)
  assert.equal(
    await adquirirRecordatorioTarea("three", ahora, almacen.database),
    false,
  )
  const ganador = adquirido[0] ? "one" : "two"
  await liberarRecordatorioTarea(ganador, almacen.database)
  assert.equal(
    await adquirirRecordatorioTarea("three", ahora, almacen.database),
    true,
  )
  const reservado = await Promise.all(
    Array.from({ length: 4 }, () =>
      reservarRecordatorioCupo(ahora, 2, almacen.database),
    ),
  )
  assert.equal(reservado.filter(Boolean).length, 2)
})

test("Las reservas simultáneas y ocurrencias ya completadas no envían dos veces", async () => {
  const almacen = await prepararPrueba()
  const reservas = await Promise.all([
    reservaRecordatorio("owner", ahora, almacen.database),
    reservaRecordatorio("owner", ahora, almacen.database),
  ])
  assert.equal(reservas.filter(Boolean).length, 1)
  let llamadas = 0
  const reserva = reservas.find(Boolean)!
  await entregarRecordatorio(
    reserva,
    dependencias(almacen, async () => {
      llamadas++
      return "id"
    }),
    configuracion,
  )
  assert.equal(llamadas, 1)
  assert.equal(
    await reservaRecordatorio("owner", ahora, almacen.database),
    null,
  )
  assert.equal(
    (almacen.documents.get("users/owner")!.reminderNextAt as Timestamp)
      .toDate()
      .toISOString(),
    "2026-11-03T13:00:00.000Z",
  )
  assert.equal(
    almacen.documents.get(`users/owner/reminderDeliveries/${reserva.id}`)!
      .status,
    "accepted",
  )
})

test("Las cuentas eliminadas, desactivadas, no verificadas o con correo inválido no llegan al proveedor", async () => {
  for (const cambiar of [
    { disabled: true },
    { emailVerified: false },
    { email: "bad\n@example.com" },
    { email: "" },
    { missing: true },
  ]) {
    const almacen = await prepararPrueba(),
      reserva = (await reservaRecordatorio("owner", ahora, almacen.database))!
    let llamadas = 0
    const dependenciasEnvio = dependencias(almacen, async () => {
      llamadas++
      return "id"
    })
    dependenciasEnvio.accountReader = async () => {
      if ("missing" in cambiar) throw { code: "auth/user-not-found" }
      return { ...(await cuenta()), ...cambiar }
    }
    await entregarRecordatorio(reserva, dependenciasEnvio, configuracion)
    assert.equal(llamadas, 0)
  }
})

test("La baja y los cambios de preferencias durante el envío lo cancelan sin alterar otros ajustes", async () => {
  for (const modo of ["off", "edited", "deleted", "inactive"]) {
    const almacen = await prepararPrueba(),
      reserva = (await reservaRecordatorio("owner", ahora, almacen.database))!
    if (modo === "deleted") almacen.documents.delete("users/owner")
    else if (modo === "inactive")
      almacen.documents.get("users/owner")!.active = false
    else
      await guardarRecordatorioAjustes(
        "owner",
        { ...ajustes, enabled: modo !== "off", time: "11:00" },
        ahora,
        almacen.database,
      )
    let llamadas = 0
    await entregarRecordatorio(
      reserva,
      dependencias(almacen, async () => {
        llamadas++
        return "id"
      }),
      configuracion,
    )
    assert.equal(llamadas, 0)
  }
})

test("El reintento conserva el contenido exacto y la clave de idempotencia ante respuestas inciertas", async () => {
  const almacen = await prepararPrueba(),
    reserva = (await reservaRecordatorio("owner", ahora, almacen.database))!
  const contenidos: string[] = [],
    claves: string[] = []
  const primero = dependencias(almacen)
  primero.send = async (correo, clave) => {
    contenidos.push(JSON.stringify(correo))
    claves.push(clave)
    throw new CorreoEntregaError(true, "network")
  }
  await entregarRecordatorio(reserva, primero, configuracion)
  assert.equal(
    await reservaRecordatorio(
      "owner",
      new Date(ahora.getTime() + 59000),
      almacen.database,
    ),
    null,
  )
  const despues = new Date(ahora.getTime() + 61000),
    segundo = (await reservaRecordatorio("owner", despues, almacen.database))!
  const reintentar = dependencias(almacen)
  reintentar.now = () => despues
  reintentar.send = async (correo, clave) => {
    contenidos.push(JSON.stringify(correo))
    claves.push(clave)
    return "id"
  }
  await entregarRecordatorio(segundo, reintentar, configuracion)
  assert.equal(contenidos[0], contenidos[1])
  assert.equal(claves[0], claves[1])
  const fallidoEstado = await obtenerRecordatorioPreferencias(
    "owner",
    almacen.database,
    cuenta,
    configuracion,
    despues,
  )
  assert.equal(fallidoEstado.settings.enabled, true)
})

test("Los cambios de correo, fallos permanentes y horarios vencidos se omiten con seguridad", async () => {
  const almacen = await prepararPrueba(),
    reserva = (await reservaRecordatorio("owner", ahora, almacen.database))!
  await entregarRecordatorio(
    reserva,
    {
      ...dependencias(almacen),
      send: async () => {
        throw new CorreoEntregaError(true, "http_429", 180)
      },
    },
    configuracion,
  )
  const despues = new Date(ahora.getTime() + 181000),
    segundo = (await reservaRecordatorio("owner", despues, almacen.database))!
  let llamadas = 0
  await entregarRecordatorio(
    segundo,
    {
      ...dependencias(almacen),
      now: () => despues,
      accountReader: async () => ({
        ...(await cuenta()),
        email: "new@example.com",
      }),
      send: async () => {
        llamadas++
        return "id"
      },
    },
    configuracion,
  )
  assert.equal(llamadas, 0)
  const omitido = await prepararPrueba()
  assert.equal(
    await reservaRecordatorio(
      "owner",
      new Date(ahora.getTime() + 31 * 60000),
      omitido.database,
    ),
    null,
  )
  const vencido = await prepararPrueba(),
    elemento = (await reservaRecordatorio("owner", ahora, vencido.database))!
  await finalizarRecordatorio(
    elemento,
    "retry",
    "network",
    ahora,
    60,
    vencido.database,
  )
  assert.equal(
    await reservaRecordatorio(
      "owner",
      new Date(ahora.getTime() + 18 * 3600000),
      vencido.database,
    ),
    null,
  )
  const permanente = await prepararPrueba(),
    permanenteReserva = (await reservaRecordatorio(
      "owner",
      ahora,
      permanente.database,
    ))!
  await entregarRecordatorio(
    permanenteReserva,
    {
      ...dependencias(permanente),
      send: async () => {
        throw new CorreoEntregaError(false, "http_400")
      },
    },
    configuracion,
  )
  assert.equal(
    permanente.documents.get(
      `users/owner/reminderDeliveries/${permanenteReserva.id}`,
    )!.status,
    "failed",
  )
})

test("La baja firmada es acotada, resiste modificaciones, vence y no invalida un consentimiento nuevo", async () => {
  const almacen = await prepararPrueba(),
    consentimiento = String(
      almacen.documents.get("users/owner")!.reminderConsentId,
    )
  const token = darBajaToken(
    "owner",
    consentimiento,
    configuracion.secret,
    ahora,
  )
  assert.deepEqual(leerDarBajaToken(token, configuracion.secret, ahora), {
    uid: "owner",
    consent: consentimiento,
  })
  assert.equal(leerDarBajaToken(token + "x", configuracion.secret, ahora), null)
  assert.equal(
    leerDarBajaToken(
      token,
      configuracion.secret,
      new Date(ahora.getTime() + 181 * 86400000),
    ),
    null,
  )
  await deshabilitarRecordatorios("owner", consentimiento, almacen.database)
  assert.equal(
    (almacen.documents.get("users/owner")!.reminderPreferences as {
      enabled: boolean
    }).enabled,
    false,
  )
  await guardarRecordatorioAjustes("owner", ajustes, ahora, almacen.database)
  await deshabilitarRecordatorios("owner", consentimiento, almacen.database)
  assert.equal(
    (almacen.documents.get("users/owner")!.reminderPreferences as {
      enabled: boolean
    }).enabled,
    true,
  )
  assert.deepEqual(almacen.documents.get("users/other"), { firstName: "Other" })
})

test("El adaptador HTTP usa credenciales solo en backend, contenido en español e idempotencia", async () => {
  const correo = crearRecordatorioCorreo(
    "owner",
    "consent",
    "ana@example.com",
    ahora,
    configuracion,
  )
  assert.match(correo.text, /MenteClear/)
  assert.match(correo.text, /desactivar/)
  assert.match(correo.text, /https:\/\/example.com/)
  assert.equal(
    await enviarRecordatorioCorreo(
      correo,
      "stable-key",
      "secret",
      async (url, opciones) => {
        assert.equal(url, "https://api.resend.com/emails")
        assert.equal(
          (opciones!.headers as Record<string, string>).Authorization,
          "Bearer secret",
        )
        assert.equal(
          (opciones!.headers as Record<string, string>)["Idempotency-Key"],
          "stable-key",
        )
        assert.deepEqual(JSON.parse(String(opciones!.body)), correo)
        return new Response(JSON.stringify({ id: "provider-id" }), {
          status: 200,
        })
      },
    ),
    "provider-id",
  )
  for (const [estado, reintentable] of [
    [429, true],
    [500, true],
    [401, false],
    [422, false],
  ] as const)
    await assert.rejects(
      enviarRecordatorioCorreo(
        correo,
        "key",
        "secret",
        async () => new Response("{}", { status: estado }),
      ),
      (error: unknown) =>
        error instanceof CorreoEntregaError && error.retryable === reintentable,
    )
  await assert.rejects(
    enviarRecordatorioCorreo(correo, "key", "secret", async () => {
      throw new Error("secret details")
    }),
    /No se pudo enviar/,
  )
})

test("La consulta de recordatorios filtra cuentas habilitadas y pendientes antes de limitar", async () => {
  const operaciones: unknown[][] = []
  const consulta = {
    where: (...argumentos: unknown[]) => {
      operaciones.push(["where", ...argumentos])
      return consulta
    },
    orderBy: (...argumentos: unknown[]) => {
      operaciones.push(["orderBy", ...argumentos])
      return consulta
    },
    limit: (valor: number) => {
      operaciones.push(["limit", valor])
      return consulta
    },
    get: async () => ({ docs: [{ id: "owner" }] }),
  }
  const baseDatos = {
    collection: (nombre: string) => {
      assert.equal(nombre, "users")
      return consulta
    },
  } as unknown as Firestore
  assert.deepEqual(await buscarProgramadoRecordatorios(ahora, 20, baseDatos), [
    "owner",
  ])
  assert.deepEqual(operaciones[0], [
    "where",
    "reminderPreferences.enabled",
    "==",
    true,
  ])
  assert.equal(operaciones[1][1], "reminderNextAt")
  assert.deepEqual(operaciones.at(-1), ["limit", 20])
})

test("Los endpoints de perfil exigen autenticación y el programador rechaza credenciales ausentes", async () => {
  for (const manejador of [obtenerRecordatorios, modificarRecordatorios]) {
    let estado = 0
    await manejador({} as Request, {
      setHeader() {},
      sendStatus(valor: number) {
        estado = valor
      },
    } as unknown as Response)
    assert.equal(estado, 401)
  }
  let estado = 0,
    siguiente = false
  await exigirRecordatorioProgramador(
    { header: () => undefined } as unknown as Request,
    {
      status(valor: number) {
        estado = valor
        return this
      },
      json() {},
      sendStatus(valor: number) {
        estado = valor
      },
    } as unknown as Response,
    () => {
      siguiente = true
    },
  )
  assert.ok(estado === 401 || estado === 503)
  assert.equal(siguiente, false)
})

test("El programador OIDC verifica audiencia, correo y cuenta de servicio y rechaza tokens inválidos", async () => {
  for (const modo of [
    "valid",
    "wrongAccount",
    "unverified",
    "invalid",
    "missing",
  ]) {
    let estado = 0,
      siguiente = false,
      verificado = false
    const proteccion = recordatorioProgramadorProteccion(
      async (token, audiencia) => {
        verificado = true
        assert.equal(token, "google-token")
        assert.equal(audiencia, configuracion.audience)
        if (modo === "invalid") throw new Error("invalid signature")
        return {
          iss: "https://accounts.google.com",
          aud: audiencia,
          sub: "123",
          iat: 1,
          exp: 9999999999,
          email:
            modo === "wrongAccount"
              ? "attacker@example.com"
              : configuracion.serviceAccount,
          email_verified: modo !== "unverified",
        }
      },
      () => configuracion,
    )
    await proteccion(
      {
        header: () => (modo === "missing" ? undefined : "Bearer google-token"),
      } as unknown as Request,
      {
        sendStatus(valor: number) {
          estado = valor
        },
      } as unknown as Response,
      () => {
        siguiente = true
      },
    )
    assert.equal(siguiente, modo === "valid")
    if (modo !== "valid") assert.ok(estado === 401 || estado === 403)
    assert.equal(verificado, modo !== "missing")
  }
})

test("Los reintentos se limitan a cinco y respetan la retención de idempotencia del proveedor", async () => {
  const almacen = await prepararPrueba()
  let instante = ahora
  for (let intento = 1; intento <= 5; intento++) {
    const reserva = (await reservaRecordatorio(
      "owner",
      instante,
      almacen.database,
    ))!
    assert.equal(reserva.attempts, intento)
    await finalizarRecordatorio(
      reserva,
      "retry",
      "network",
      instante,
      60,
      almacen.database,
    )
    instante = (almacen.documents.get("users/owner")!
      .reminderNextAt as Timestamp).toDate()
  }
  assert.equal(instante.toISOString(), "2026-11-03T13:00:00.000Z")
})

test("La baja desde preferencias anteriores también desactiva recordatorios sin cambiar otros ajustes", async () => {
  const almacen = await prepararPrueba()
  await modificarPerfil(
    "owner",
    { accessibilityPreferences: { recordatorios: false } },
    almacen.database,
    async () => ({ email: "ana@example.com", metadata: {} }),
  )
  assert.equal(
    (almacen.documents.get("users/owner")!.reminderPreferences as {
      enabled: boolean
    }).enabled,
    false,
  )
  assert.equal(almacen.documents.get("users/owner")!.reminderNextAt, null)
  assert.equal(
    await reservaRecordatorio("owner", ahora, almacen.database),
    null,
  )
})

test("Los endpoints HTTP rechazan accesos no autenticados sin exportar ajustes ni enviar correos", async () => {
  const servidor = aplicacion.listen(0, "127.0.0.1")
  await once(servidor, "listening")
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`
  try {
    for (const metodo of ["GET", "PATCH"]) {
      const respuesta = await fetch(`${base}/api/reminders/me`, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        ...(metodo === "PATCH"
          ? { body: JSON.stringify({ ...ajustes, uid: "other" }) }
          : {}),
      })
      assert.equal(respuesta.status, 401)
    }
    const tarea = await fetch(`${base}/api/reminders/dispatch`, {
      method: "POST",
    })
    assert.ok(tarea.status === 401 || tarea.status === 503)
    const darBaja = await fetch(
      `${base}/api/reminders/unsubscribe?token=forged`,
    )
    assert.equal(darBaja.status, 400)
    assert.equal(darBaja.headers.get("referrer-policy"), "no-referrer")
    assert.match(await darBaja.text(), /Enlace inválido o vencido/)
  } finally {
    await new Promise<void>((resolver) => servidor.close(() => resolver()))
  }
})

test("GET de baja solo muestra confirmación sin acceder a Firestore ni modificar preferencias", async () => {
  const anterior = process.env.REMINDER_UNSUBSCRIBE_SECRET
  process.env.REMINDER_UNSUBSCRIBE_SECRET = configuracion.secret
  try {
    let cuerpo = ""
    const token = darBajaToken(
      "owner",
      "consent",
      configuracion.secret,
      new Date(),
    )
    await darBajaRecordatorios(
      { method: "GET", query: { token } } as unknown as Request,
      {
        setHeader() {},
        type() {
          return this
        },
        send(valor: string) {
          cuerpo = valor
        },
      } as unknown as Response,
    )
    assert.match(cuerpo, /form method="post"/)
    assert.match(cuerpo, /Desactivar recordatorios/)
    assert.doesNotMatch(cuerpo, /Recordatorios desactivados/)
  } finally {
    if (anterior === undefined) delete process.env.REMINDER_UNSUBSCRIBE_SECRET
    else process.env.REMINDER_UNSUBSCRIBE_SECRET = anterior
  }
})
