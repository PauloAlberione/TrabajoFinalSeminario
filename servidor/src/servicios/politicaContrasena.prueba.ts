import assert from "node:assert/strict"
import test from "node:test"
import {
  REQUISITOS_CONTRASENA,
  validarContrasena,
} from "../../../src/servicios/politicaContrasena"
import { mensajeErrorFirebase } from "../../../src/servicios/erroresAutenticacion"

test("La contraseña exige ocho caracteres, mayúsculas y minúsculas", () => {
  for (const contrasena of [
    "",
    "Abcdefg",
    "abcdefgh",
    "ABCDEFGH",
    "12345678",
    "Ábcdefgh",
    "ABCDEFÉÑ",
  ]) {
    assert.equal(validarContrasena(contrasena), REQUISITOS_CONTRASENA)
  }
})

test("Los números y símbolos son opcionales y no se recorta la contraseña", () => {
  for (const contrasena of [
    "Abcdefgh",
    "Abcdefg1",
    "Abcdefg!",
    "Abcdefg ",
    "ÁrbolesA",
    "Aa" + "b".repeat(4094),
  ]) {
    assert.equal(validarContrasena(contrasena), null)
  }
  assert.equal(validarContrasena("Abcdef "), REQUISITOS_CONTRASENA)
  assert.equal(
    validarContrasena("Aa" + "b".repeat(4095)),
    "La contraseña no puede superar los 4096 caracteres.",
  )
})

test("Los rechazos de política de Firebase muestran los requisitos en español", () => {
  for (const code of [
    "auth/weak-password",
    "auth/password-does-not-meet-requirements",
  ]) {
    assert.equal(mensajeErrorFirebase({ code }), REQUISITOS_CONTRASENA)
  }
  assert.equal(
    mensajeErrorFirebase({ code: "auth/invalid-credential" }),
    "El correo o la contraseña no son correctos.",
  )
})
