import test from "node:test"
import assert from "node:assert/strict"
import { Timestamp } from "firebase-admin/firestore"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import { crearPerfil, buscarPerfil, modificarPerfil } from "./usuario.servicio"
import { PerfilNoEncontradoError } from "../repositorios/usuario.repositorio"
import {
  calcularEdad,
  fechaNacimientoValida,
  validarCambiosPerfil,
  ErrorValidacionPerfil,
} from "../../../compartido/perfil"
import {
  obtenerPerfilActual,
  modificarPerfilActual,
  crearPerfilActual,
} from "../controladores/usuario.controlador"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import type { Response } from "express"

const cuenta = async (uid: string) => ({
  email: `${uid}@example.invalid`,
  metadata: { creationTime: "2020-01-01T12:00:00Z" },
})
const entrada = {
  firstName: "María José",
  lastName: "O’Connor",
  birthDate: "1950-01-02",
  gender: "female",
  email: "owner@example.invalid",
}

function prepararPrueba() {
  const almacen = new AlmacenTransacciones()
  almacen.documents.set("users/owner", {
    ...entrada,
    createdAt: Timestamp.fromDate(new Date("2021-01-01T12:00:00Z")),
    accessibilityPreferences: {
      tamanoTexto: "normal",
      sonidos: true,
      altoContraste: true,
    },
    custom: "preserve",
  })
  almacen.documents.set("users/other", {
    firstName: "Other",
    email: "other@example.invalid",
  })
  almacen.documents.set("users/owner/progress/memory", {
    currentLevel: "veryHard",
    totalExercises: 53,
    promotionStreak: 1,
  })
  return almacen
}

test("La carga usa datos reales, fecha ISO y valores predeterminados sin exponer campos arbitrarios", async () => {
  const almacen = prepararPrueba()
  const perfil = await buscarPerfil("owner", almacen.database, cuenta)
  assert.equal(perfil!.firstName, "María José")
  assert.equal(perfil!.lastName, "O’Connor")
  assert.equal(perfil!.email, "owner@example.invalid")
  assert.equal(perfil!.createdAt, "2021-01-01T12:00:00.000Z")
  assert.equal(perfil!.birthDate, "1950-01-02")
  assert.equal(perfil!.accessibilityPreferences.altoContraste, true)
  assert.equal(perfil!.accessibilityPreferences.frecuenciaRecordatorio, "daily")
  assert.equal("custom" in perfil!, false)
})

test("Las ediciones válidas persisten tras recarga y conservan preferencias, fechas y progreso", async () => {
  const almacen = prepararPrueba(),
    progreso = { ...almacen.documents.get("users/owner/progress/memory") },
    creado = almacen.documents.get("users/owner")!.createdAt
  await modificarPerfil(
    "owner",
    { firstName: "  Ana  ", birthDate: "1955-02-28" },
    almacen.database,
    cuenta,
  )
  const cargado = await buscarPerfil("owner", almacen.database, cuenta)
  assert.equal(cargado!.firstName, "Ana")
  assert.equal(cargado!.lastName, entrada.lastName)
  assert.equal(cargado!.birthDate, "1955-02-28")
  assert.equal(almacen.documents.get("users/owner")!.custom, "preserve")
  assert.equal(almacen.documents.get("users/owner")!.createdAt, creado)
  assert.deepEqual(
    almacen.documents.get("users/owner/progress/memory"),
    progreso,
  )
  assert.equal(cargado!.accessibilityPreferences.altoContraste, true)
})

test("El backend rechaza nombres inválidos, fechas imposibles, campos desconocidos y preferencias inválidas", async () => {
  const almacen = prepararPrueba(),
    antes = almacen.documents.get("users/owner")
  for (const invalido of [
    null,
    [],
    {},
    { uid: "other" },
    { firstName: "" },
    { firstName: "   " },
    { lastName: "A".repeat(81) },
    { firstName: "<script>" },
    { firstName: 12 },
    { birthDate: "1950-02-30" },
    { birthDate: "1900-02-29" },
    { birthDate: "9999-01-01" },
    { birthDate: "01/02/1950" },
    { birthDate: "0000-01-01" },
    { gender: "unknown" },
    { createdAt: "2020" },
    { currentLevel: "easy" },
    { accessibilityPreferences: null },
    { accessibilityPreferences: [] },
    { accessibilityPreferences: {} },
    { accessibilityPreferences: { sonidos: "true" } },
    { accessibilityPreferences: { tamanoTexto: "huge" } },
    { accessibilityPreferences: { frecuenciaRecordatorio: 1 } },
    { accessibilityPreferences: { uid: "other" } },
    JSON.parse('{"__proto__":{"admin":true}}'),
  ]) {
    await assert.rejects(
      modificarPerfil("owner", invalido, almacen.database, cuenta),
      ErrorValidacionPerfil,
    )
  }
  assert.equal(almacen.documents.get("users/owner"), antes)
  assert.deepEqual(
    validarCambiosPerfil({
      firstName: "李",
      lastName: "De la Peña-Smith",
      birthDate: "",
    }),
    { firstName: "李", lastName: "De la Peña-Smith", birthDate: "" },
  )
})

test("El correo proviene de Authentication, corrige diferencias antiguas y no se modifica por PATCH", async () => {
  const almacen = prepararPrueba()
  almacen.documents.get("users/owner")!.email = "wrong@old.invalid"
  const cargado = await buscarPerfil("owner", almacen.database, cuenta)
  assert.equal(cargado!.email, "owner@example.invalid")
  assert.equal(
    almacen.documents.get("users/owner")!.email,
    "owner@example.invalid",
  )
  await assert.rejects(
    modificarPerfil(
      "owner",
      { email: "different@example.invalid" },
      almacen.database,
      cuenta,
    ),
    ErrorValidacionPerfil,
  )
  await assert.rejects(
    crearPerfil(
      "owner",
      { ...entrada, email: "other@example.invalid" },
      almacen.database,
      cuenta,
    ),
    ErrorValidacionPerfil,
  )
  assert.equal(
    almacen.documents.get("users/owner")!.email,
    "owner@example.invalid",
  )
})

test("La inicialización repetida o simultánea no sobrescribe información personal existente", async () => {
  const almacen = prepararPrueba(),
    creado = almacen.documents.get("users/owner")!.createdAt
  await Promise.all([
    crearPerfil(
      "owner",
      { ...entrada, firstName: "Replace" },
      almacen.database,
      cuenta,
    ),
    crearPerfil(
      "owner",
      { ...entrada, lastName: "Replace" },
      almacen.database,
      cuenta,
    ),
  ])
  assert.equal(
    almacen.documents.get("users/owner")!.firstName,
    entrada.firstName,
  )
  assert.equal(almacen.documents.get("users/owner")!.lastName, entrada.lastName)
  assert.equal(almacen.documents.get("users/owner")!.createdAt, creado)
  assert.equal(almacen.documents.get("users/owner")!.custom, "preserve")
  await Promise.all([
    crearPerfil(
      "new",
      { firstName: "First", lastName: "Person" },
      almacen.database,
      cuenta,
    ),
    crearPerfil(
      "new",
      { firstName: "Second", lastName: "Person" },
      almacen.database,
      cuenta,
    ),
  ])
  assert.equal(almacen.documents.get("users/new")!.firstName, "First")
  assert.equal(almacen.documents.get("users/new")!.email, "new@example.invalid")
})

test("Los cambios simultáneos conservan preferencias no modificadas y ediciones personales", async () => {
  const almacen = prepararPrueba()
  await Promise.all([
    modificarPerfil(
      "owner",
      { accessibilityPreferences: { sonidos: false } },
      almacen.database,
      cuenta,
    ),
    modificarPerfil(
      "owner",
      {
        accessibilityPreferences: {
          tamanoTexto: "extra",
          recordatorios: false,
        },
      },
      almacen.database,
      cuenta,
    ),
    modificarPerfil(
      "owner",
      { lastName: "Nuevo apellido" },
      almacen.database,
      cuenta,
    ),
  ])
  const cargado = await buscarPerfil("owner", almacen.database, cuenta)
  assert.equal(cargado!.accessibilityPreferences.sonidos, false)
  assert.equal(cargado!.accessibilityPreferences.tamanoTexto, "extra")
  assert.equal(cargado!.accessibilityPreferences.recordatorios, false)
  assert.equal(cargado!.accessibilityPreferences.altoContraste, true)
  assert.equal(cargado!.lastName, "Nuevo apellido")
})

test("Las modificaciones están acotadas al UID y PATCH no crea perfiles ausentes silenciosamente", async () => {
  const almacen = prepararPrueba(),
    otro = { ...almacen.documents.get("users/other") }
  await modificarPerfil(
    "owner",
    { firstName: "Changed" },
    almacen.database,
    cuenta,
  )
  assert.deepEqual(almacen.documents.get("users/other"), otro)
  assert.equal(await buscarPerfil("missing", almacen.database, cuenta), null)
  await assert.rejects(
    modificarPerfil(
      "missing",
      { firstName: "Missing" },
      almacen.database,
      cuenta,
    ),
    PerfilNoEncontradoError,
  )
  assert.equal(almacen.documents.has("users/missing"), false)
})

test("La edad usa fechas de calendario y las fechas ausentes o inválidas no producen edad cero", () => {
  const day = new Date(2026, 10, 2, 12)
  assert.equal(calcularEdad("1950-11-03", day), 75)
  assert.equal(calcularEdad("1950-11-02", day), 76)
  assert.equal(calcularEdad("", day), null)
  assert.equal(calcularEdad("1950-02-30", day), null)
  assert.equal(fechaNacimientoValida("2000-02-29", day), true)
  assert.equal(fechaNacimientoValida("1900-02-29", day), false)
})

test("Los controladores de perfil exigen UID autenticado antes de acceder a los datos", async () => {
  for (const controlador of [
    obtenerPerfilActual,
    crearPerfilActual,
    modificarPerfilActual,
  ]) {
    let codigo = 0
    const respuesta = {
      status(valor: number) {
        codigo = valor
        return this
      },
      json() {},
    } as unknown as Response
    await controlador(
      { body: { userId: "owner" } } as AutenticadoSolicitud,
      respuesta,
    )
    assert.equal(codigo, 401)
  }
})
