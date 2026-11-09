import assert from "node:assert/strict"
import test from "node:test"
import {
  enlaceAccionFirebase,
  leerEnlaceRestablecimiento,
} from "../../../src/servicios/accionesCuenta"

const base = "https://menteclear.web.app/cuenta/accion"

test("El restablecimiento reconoce el código de Firebase y descarta enlaces incompletos", () => {
  assert.deepEqual(
    leerEnlaceRestablecimiento(`${base}?mode=resetPassword&oobCode=prueba`),
    {
      modo: "resetPassword",
      codigo: "prueba",
    },
  )
  for (const consulta of [
    "",
    "?mode=resetPassword",
    "?mode=resetPassword&oobCode=",
    "?mode=verifyEmail&oobCode=prueba",
    "?mode=resetPassword&mode=verifyEmail&oobCode=prueba",
    "?mode=resetPassword&oobCode=uno&oobCode=dos",
  ]) {
    assert.equal(leerEnlaceRestablecimiento(base + consulta).codigo, null)
  }
})

test("Los parámetros externos no cambian el proyecto ni el destino de otras acciones", () => {
  const enlace = enlaceAccionFirebase(
    `${base}?mode=verifyEmail&oobCode=prueba&apiKey=otra-clave&continueUrl=https://sitio-externo.example&lang=en`,
    "proyecto-prueba",
    "clave-del-proyecto",
  )
  const salida = new URL(enlace!)
  assert.equal(salida.origin, "https://proyecto-prueba.firebaseapp.com")
  assert.equal(salida.pathname, "/__/auth/action")
  assert.equal(salida.searchParams.get("apiKey"), "clave-del-proyecto")
  assert.equal(salida.searchParams.get("continueUrl"), null)
  assert.equal(salida.searchParams.get("lang"), "es")
})

test("La ruta personalizada conserva las acciones de correo compatibles con Firebase", () => {
  for (const modo of [
    "verifyEmail",
    "recoverEmail",
    "verifyAndChangeEmail",
    "revertSecondFactorAddition",
  ]) {
    assert.ok(
      enlaceAccionFirebase(
        `${base}?mode=${modo}&oobCode=prueba`,
        "proyecto-prueba",
        "clave",
      ),
    )
  }
  for (const modo of [
    "resetPassword",
    "desconocido",
    "",
    "https://otro.example",
  ]) {
    assert.equal(
      enlaceAccionFirebase(
        `${base}?mode=${encodeURIComponent(modo)}&oobCode=prueba`,
        "proyecto-prueba",
        "clave",
      ),
      null,
    )
  }
})

test("No se construyen redirecciones con proyectos o códigos inválidos", () => {
  for (const proyecto of [
    "",
    "otro.example",
    "proyecto/prueba",
    "proyecto@externo",
  ]) {
    assert.equal(
      enlaceAccionFirebase(
        `${base}?mode=verifyEmail&oobCode=prueba`,
        proyecto,
        "clave",
      ),
      null,
    )
  }
  assert.equal(
    enlaceAccionFirebase(
      `${base}?mode=verifyEmail`,
      "proyecto-prueba",
      "clave",
    ),
    null,
  )
  assert.equal(
    enlaceAccionFirebase(
      `${base}?mode=verifyEmail&oobCode=uno&oobCode=dos`,
      "proyecto-prueba",
      "clave",
    ),
    null,
  )
  assert.equal(
    leerEnlaceRestablecimiento(
      `${base}?mode=resetPassword&oobCode=${"a".repeat(4097)}`,
    ).codigo,
    null,
  )
})
