import test from "node:test"
import assert from "node:assert/strict"
import { Timestamp } from "firebase-admin/firestore"
import { validarCambiosPerfil } from "../../../compartido/perfil"
import {
  paisesDisponibles,
  requiereRegion,
  zonasDelPais,
} from "../../../compartido/ubicacion"
import { TONOS_AVATAR, representarAvatar } from "../../../compartido/avatar"
import {
  PREDETERMINADO_RECORDATORIOS,
  type ConfiguracionRecordatorios,
} from "../../../compartido/recordatorios"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import { buscarPerfil, modificarPerfil } from "./usuario.servicio"
import {
  modificarRecordatorioPreferencias,
  obtenerRecordatorioPreferencias,
} from "./recordatorio.servicio"
import {
  guardarRecordatorioAjustes,
  reservaRecordatorio,
  prepararRecordatorioCorreo,
} from "../repositorios/recordatorio.repositorio"
import {
  crearRecordatorioCorreo,
  recordatorioConfiguracion,
} from "./recordatorioCorreo"
import { recordatorioLocalFecha } from "./programacionRecordatorios"

const cuenta = async () => ({
  email: "owner@example.invalid",
  emailVerified: true,
  disabled: false,
  metadata: {},
})

function preparar() {
  const almacen = new AlmacenTransacciones()
  almacen.documents.set("users/owner", {
    firstName: "Ana",
    lastName: "Prueba",
    countryCode: "AR",
    timeZone: "America/Argentina/Cordoba",
    accessibilityPreferences: { altoContraste: true, sonidos: false },
    reminderPreferences: { ...PREDETERMINADO_RECORDATORIOS, enabled: true },
    reminderConsentId: "consentimiento-original",
    reminderVersion: "version-anterior",
  })
  almacen.documents.set("users/owner/progress/memory", {
    currentLevel: "hard",
    promotionStreak: 1,
  })
  almacen.documents.set("users/other", {
    firstName: "Otra persona",
    countryCode: "CO",
    timeZone: "America/Bogota",
  })
  return almacen
}

test("El país valida su región y los países con varios horarios no reciben una zona arbitraria", () => {
  assert.ok(paisesDisponibles.length > 200)
  assert.equal(
    paisesDisponibles.find((pais) => pais.codigo === "AR")?.nombre,
    "Argentina",
  )
  assert.equal(
    validarCambiosPerfil({ countryCode: "CO" }).timeZone,
    "America/Bogota",
  )
  assert.equal(requiereRegion("AR", new Date("2026-11-03")), false)
  assert.equal(requiereRegion("ES", new Date("2026-11-03")), true)
  assert.ok(zonasDelPais("ES").includes("Atlantic/Canary"))
  for (const entrada of [
    { countryCode: "ES" },
    { countryCode: "CO", timeZone: "Asia/Tokyo" },
    { countryCode: "__proto__" },
    { timeZone: "UTC" },
    { countryCode: "XX" },
  ])
    assert.throws(() => validarCambiosPerfil(entrada))
})

test("Los seis tonos de avatar son distintos y se validan sin modificar datos de acceso", () => {
  assert.equal(
    new Set(TONOS_AVATAR.map((tono) => representarAvatar("male", tono))).size,
    6,
  )
  assert.equal(representarAvatar("female", "oscuro"), "👵🏿")
  assert.equal(representarAvatar(undefined, "claro"), "🧓🏻")
  for (const tono of TONOS_AVATAR)
    assert.equal(validarCambiosPerfil({ avatarTone: tono }).avatarTone, tono)
  assert.throws(() => validarCambiosPerfil({ avatarTone: "inventado" }))
})

test("Cambiar país reprograma el mismo horario local y conserva consentimiento, progreso y otros usuarios", async () => {
  const almacen = preparar(),
    progreso = { ...almacen.documents.get("users/owner/progress/memory") }
  const perfil = await modificarPerfil(
    "owner",
    { countryCode: "CO", avatarTone: "medio" },
    almacen.database,
    cuenta,
  )
  const datos = almacen.documents.get("users/owner")!
  assert.equal(perfil?.countryCode, "CO")
  assert.equal(perfil?.timeZone, "America/Bogota")
  assert.equal(perfil?.avatarTone, "medio")
  assert.equal(
    (datos.reminderPreferences as ConfiguracionRecordatorios).time,
    "10:00",
  )
  assert.equal(
    (datos.reminderPreferences as ConfiguracionRecordatorios).timeZone,
    "America/Bogota",
  )
  assert.equal(datos.reminderConsentId, "consentimiento-original")
  assert.notEqual(datos.reminderVersion, "version-anterior")
  assert.ok(datos.reminderNextAt instanceof Timestamp)
  const hora = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(datos.reminderNextAt.toDate())
  assert.equal(hora, "10:00")
  assert.deepEqual(
    almacen.documents.get("users/owner/progress/memory"),
    progreso,
  )
  assert.equal(almacen.documents.get("users/other")!.countryCode, "CO")
  const recargado = await buscarPerfil("owner", almacen.database, cuenta)
  assert.equal(recargado?.avatarTone, "medio")
  assert.equal(recargado?.countryCode, "CO")
})

test("Cambiar ubicación junto con una baja mantiene los recordatorios desactivados", async () => {
  const almacen = preparar()
  await modificarPerfil(
    "owner",
    { countryCode: "CO", accessibilityPreferences: { recordatorios: false } },
    almacen.database,
    cuenta,
  )
  const perfil = almacen.documents.get("users/owner")!
  assert.equal(
    (perfil.reminderPreferences as ConfiguracionRecordatorios).enabled,
    false,
  )
  assert.equal(perfil.reminderNextAt, null)
  assert.equal(
    (perfil.accessibilityPreferences as Record<string, unknown>).altoContraste,
    true,
  )
})

test("La configuración del recordatorio usa la zona del perfil incluso ante cambios simultáneos o un formulario antiguo", async () => {
  const almacen = preparar()
  await Promise.all([
    modificarPerfil("owner", { countryCode: "CO" }, almacen.database, cuenta),
    modificarRecordatorioPreferencias(
      "owner",
      {
        ...PREDETERMINADO_RECORDATORIOS,
        enabled: true,
        time: "18:30",
        timeZone: "UTC",
      },
      almacen.database,
      cuenta,
    ),
  ])
  const perfil = almacen.documents.get("users/owner")!
  assert.equal(perfil.timeZone, "America/Bogota")
  assert.equal(
    (perfil.reminderPreferences as ConfiguracionRecordatorios).timeZone,
    perfil.timeZone,
  )
  assert.equal(
    (perfil.reminderPreferences as ConfiguracionRecordatorios).time,
    "18:30",
  )
  const estado = await obtenerRecordatorioPreferencias(
    "owner",
    almacen.database,
    cuenta,
  )
  assert.equal(estado.settings.timeZone, perfil.timeZone)
})

test("Cambiar país invalida una entrega reservada con la ubicación anterior", async () => {
  const almacen = preparar(),
    ahora = new Date()
  await guardarRecordatorioAjustes(
    "owner",
    { ...PREDETERMINADO_RECORDATORIOS, enabled: true },
    ahora,
    almacen.database,
  )
  const perfil = almacen.documents.get("users/owner")!
  perfil.reminderNextAt = Timestamp.fromDate(ahora)
  perfil.reminderOccurrenceAt = Timestamp.fromDate(ahora)
  const reserva = await reservaRecordatorio("owner", ahora, almacen.database)
  assert.ok(reserva)
  const configuracion = {
    ...recordatorioConfiguracion(),
    secret: "secreto-de-prueba".repeat(3),
    appUrl: "https://example.invalid",
    apiUrl: "https://api.example.invalid",
  }
  const correo = crearRecordatorioCorreo(
    "owner",
    reserva.consent,
    "owner@example.invalid",
    ahora,
    configuracion,
  )
  await modificarPerfil(
    "owner",
    { countryCode: "CO" },
    almacen.database,
    cuenta,
  )
  assert.equal(
    await prepararRecordatorioCorreo(reserva, correo, almacen.database),
    false,
  )
})

test("España conserva hora local al cambiar la fecha estacional usando Madrid o Canarias", async () => {
  const { siguienteRecordatorio } = await import("./programacionRecordatorios")
  for (const timeZone of ["Europe/Madrid", "Atlantic/Canary"]) {
    const ajustes = {
      ...PREDETERMINADO_RECORDATORIOS,
      enabled: true,
      time: "09:00",
      timeZone,
    }
    for (const fecha of ["2026-03-28T23:00:00Z", "2026-10-24T23:00:00Z"]) {
      const proximo = siguienteRecordatorio(ajustes, new Date(fecha))
      assert.equal(
        new Intl.DateTimeFormat("en-GB", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(proximo),
        "09:00",
      )
      assert.ok(recordatorioLocalFecha(proximo, timeZone))
    }
  }
})
