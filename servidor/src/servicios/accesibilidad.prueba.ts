import test from "node:test"
import assert from "node:assert/strict"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import { crearPerfil, buscarPerfil, modificarPerfil } from "./usuario.servicio"
import {
  ErrorValidacionPerfil,
  leerPreferenciasAccesibilidad,
} from "../../../compartido/perfil"

const cuenta = async () => ({
  email: "owner@example.invalid",
  metadata: { creationTime: "2020-01-01T00:00:00Z" },
})

test("Cada tamaño de letra y opción de accesibilidad se guarda y restaura sin modificar otras preferencias", async () => {
  const almacen = new AlmacenTransacciones()
  await crearPerfil(
    "owner",
    { firstName: "Ana", lastName: "Prueba" },
    almacen.database,
    cuenta,
  )
  for (const tamanoTexto of ["normal", "grande", "extra"] as const) {
    await modificarPerfil(
      "owner",
      { accessibilityPreferences: { tamanoTexto } },
      almacen.database,
      cuenta,
    )
    assert.equal(
      (await buscarPerfil("owner", almacen.database, cuenta))!
        .accessibilityPreferences.tamanoTexto,
      tamanoTexto,
    )
  }
  await modificarPerfil(
    "owner",
    { accessibilityPreferences: { altoContraste: true } },
    almacen.database,
    cuenta,
  )
  await modificarPerfil(
    "owner",
    { accessibilityPreferences: { instruccionesAmpliadas: true } },
    almacen.database,
    cuenta,
  )
  const restaurado = (await buscarPerfil("owner", almacen.database, cuenta))!
    .accessibilityPreferences
  assert.equal(restaurado.tamanoTexto, "extra")
  assert.equal(restaurado.altoContraste, true)
  assert.equal(restaurado.instruccionesAmpliadas, true)
  assert.equal(restaurado.sonidos, true)
  await modificarPerfil(
    "owner",
    {
      accessibilityPreferences: {
        altoContraste: false,
        instruccionesAmpliadas: false,
      },
    },
    almacen.database,
    cuenta,
  )
  assert.equal(
    (await buscarPerfil("owner", almacen.database, cuenta))!
      .accessibilityPreferences.tamanoTexto,
    "extra",
  )
})

test("Los cambios simultáneos de accesibilidad conservan ajustes de otras pestañas, aislamiento y progreso", async () => {
  const almacen = new AlmacenTransacciones()
  await crearPerfil(
    "owner",
    { firstName: "Ana", lastName: "Prueba" },
    almacen.database,
    cuenta,
  )
  almacen.documents.set("users/owner/progress/speed", {
    currentLevel: "hard",
    totalExercises: 30,
  })
  almacen.documents.set("users/other", {
    accessibilityPreferences: { tamanoTexto: "normal" },
  })
  await Promise.all([
    modificarPerfil(
      "owner",
      { accessibilityPreferences: { tamanoTexto: "extra" } },
      almacen.database,
      cuenta,
    ),
    modificarPerfil(
      "owner",
      { accessibilityPreferences: { altoContraste: true } },
      almacen.database,
      cuenta,
    ),
    modificarPerfil(
      "owner",
      { accessibilityPreferences: { instruccionesAmpliadas: true } },
      almacen.database,
      cuenta,
    ),
  ])
  const preferencias = (await buscarPerfil("owner", almacen.database, cuenta))!
    .accessibilityPreferences
  assert.equal(preferencias.tamanoTexto, "extra")
  assert.equal(preferencias.altoContraste, true)
  assert.equal(preferencias.instruccionesAmpliadas, true)
  assert.deepEqual(almacen.documents.get("users/owner/progress/speed"), {
    currentLevel: "hard",
    totalExercises: 30,
  })
  assert.deepEqual(almacen.documents.get("users/other"), {
    accessibilityPreferences: { tamanoTexto: "normal" },
  })
})

test("Los campos o valores de accesibilidad inválidos se rechazan sin aplicar cambios parciales", async () => {
  const almacen = new AlmacenTransacciones()
  await crearPerfil(
    "owner",
    { firstName: "Ana", lastName: "Prueba" },
    almacen.database,
    cuenta,
  )
  const antes = almacen.documents.get("users/owner")
  for (const accesibilidadPreferencias of [
    { tamanoTexto: "extra", altoContraste: "true" },
    { instruccionesAmpliadas: 1 },
    { tamanoTexto: "invalid" },
    { altoContraste: true, unexpected: false },
  ]) {
    await assert.rejects(
      modificarPerfil(
        "owner",
        { accessibilityPreferences: accesibilidadPreferencias },
        almacen.database,
        cuenta,
      ),
      ErrorValidacionPerfil,
    )
    assert.equal(almacen.documents.get("users/owner"), antes)
  }
})

test("Las preferencias antiguas o dañadas conservan los campos válidos y completan los restantes", () => {
  assert.deepEqual(
    leerPreferenciasAccesibilidad({
      tamanoTexto: "extra",
      altoContraste: "false",
      instruccionesAmpliadas: true,
      sonidos: false,
      unknown: true,
    }),
    {
      tamanoTexto: "extra",
      altoContraste: false,
      instruccionesAmpliadas: true,
      sonidos: false,
      recordatorios: true,
      frecuenciaRecordatorio: "daily",
      volumenSonidos: 30,
    },
  )
  assert.equal(leerPreferenciasAccesibilidad(null).tamanoTexto, "normal")
  assert.equal(
    leerPreferenciasAccesibilidad({ tamanoTexto: "invalid" }).tamanoTexto,
    "normal",
  )
})

test("Las preferencias canónicas parciales conservan los ajustes del perfil anterior", async () => {
  const almacen = new AlmacenTransacciones()
  almacen.documents.set("users/owner", {
    firstName: "Ana",
    lastName: "Prueba",
    email: "owner@example.invalid",
    preferenciasAccesibilidad: { tamanoTexto: "extra", sonidos: false },
  })
  await modificarPerfil(
    "owner",
    { accessibilityPreferences: { altoContraste: true } },
    almacen.database,
    cuenta,
  )
  const preferencias = (await buscarPerfil("owner", almacen.database, cuenta))!
    .accessibilityPreferences
  assert.equal(preferencias.tamanoTexto, "extra")
  assert.equal(preferencias.sonidos, false)
  assert.equal(preferencias.altoContraste, true)
})
