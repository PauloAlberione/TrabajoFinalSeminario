import assert from "node:assert/strict"
import test from "node:test"
import {
  leerControlSesion,
  sesionVigente,
  vencimientoSesion,
  type ControlSesion,
} from "../../../src/servicios/politicaSesion"

const inicio = Date.UTC(2026, 10, 8, 12)
const sesion: ControlSesion = {
  version: 1,
  uid: "usuario-prueba",
  inicio,
  mantener: false,
}

test("La sesión común vence exactamente a las cuatro horas", () => {
  const fin = inicio + 4 * 60 * 60 * 1000
  assert.equal(vencimientoSesion(sesion), fin)
  assert.equal(sesionVigente(sesion, fin - 1), true)
  assert.equal(sesionVigente(sesion, fin), false)
  assert.equal(sesionVigente(sesion, fin + 1), false)
})

test("Mantener sesión iniciada permite hasta siete días y conserva un vencimiento", () => {
  const recordada = { ...sesion, mantener: true }
  const fin = inicio + 7 * 24 * 60 * 60 * 1000
  assert.equal(vencimientoSesion(recordada), fin)
  assert.equal(sesionVigente(recordada, fin - 1), true)
  assert.equal(sesionVigente(recordada, fin), false)
})

test("Recargar conserva el inicio original y no extiende la sesión", () => {
  const recuperada = leerControlSesion(
    JSON.stringify(sesion),
    sesion.uid,
    inicio + 3 * 60 * 60 * 1000,
  )
  assert.deepEqual(recuperada, sesion)
  assert.equal(vencimientoSesion(recuperada!), vencimientoSesion(sesion))
  assert.equal(sesionVigente(recuperada!, inicio + 5 * 60 * 60 * 1000), false)
})

test("Un control no autoriza a otra cuenta ni recupera sesiones antiguas sin política", () => {
  assert.equal(
    leerControlSesion(JSON.stringify(sesion), "otra-cuenta", inicio),
    null,
  )
  for (const valor of [
    null,
    "",
    "null",
    "{}",
    "texto",
    JSON.stringify({ ...sesion, version: 0 }),
  ]) {
    assert.equal(leerControlSesion(valor, sesion.uid, inicio), null)
  }
})

test("Se rechazan fechas futuras, valores inválidos y preferencias mal formadas", () => {
  for (const cambios of [
    { inicio: inicio + 1 },
    { inicio: 0 },
    { inicio: -1 },
    { inicio: "hoy" },
    { inicio: null },
    { mantener: "true" },
  ]) {
    assert.equal(
      leerControlSesion(
        JSON.stringify({ ...sesion, ...cambios }),
        sesion.uid,
        inicio,
      ),
      null,
    )
  }
  assert.equal(sesionVigente(sesion, inicio - 1), false)
})
