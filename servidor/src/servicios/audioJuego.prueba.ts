import test from "node:test"
import assert from "node:assert/strict"
import { AudioJuego } from "../../../src/servicios/audioJuego"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import { crearPerfil, modificarPerfil, buscarPerfil } from "./usuario.servicio"
import {
  validarCambiosPerfil,
  leerPreferenciasAccesibilidad,
  ErrorValidacionPerfil,
} from "../../../compartido/perfil"

function audioDatosPrueba(inicial: AudioContextState = "suspended") {
  const notas: Array<{
    frequency?: number
    starts: number[]
    stops: number[]
    gains: number[]
    disconnected: boolean
  }> = []
  let reanudarCantidad = 0,
    cerrarCantidad = 0,
    estado = inicial
  const contexto = {
    get state() {
      return estado
    },
    currentTime: 10,
    destination: {},
    async resume() {
      reanudarCantidad++
      estado = "running"
    },
    async close() {
      cerrarCantidad++
      estado = "closed"
    },
    createOscillator() {
      const nota = {
        starts: [] as number[],
        stops: [] as number[],
        gains: [] as number[],
        disconnected: false,
        frequency: 0,
      }
      notas.push(nota)
      return {
        type: "sine",
        frequency: {
          setValueAtTime(valor: number) {
            nota.frequency = valor
          },
        },
        connect() {},
        disconnect() {
          nota.disconnected = true
        },
        start(valor: number) {
          nota.starts.push(valor)
        },
        stop(valor: number) {
          nota.stops.push(valor)
        },
        onended: null,
      }
    },
    createGain() {
      const nota = notas.at(-1)!
      return {
        gain: {
          setValueAtTime(valor: number) {
            nota.gains.push(valor)
          },
          linearRampToValueAtTime(valor: number) {
            nota.gains.push(valor)
          },
        },
        connect() {},
        disconnect() {},
      }
    },
  }
  return {
    context: contexto as unknown as AudioContext,
    notes: notas,
    get resumeCount() {
      return reanudarCantidad
    },
    get closeCount() {
      return cerrarCantidad
    },
    suspend() {
      estado = "suspended"
    },
  }
}

test("El audio solo se inicia tras una interacción permitida y la respuesta sonora es síncrona", async () => {
  const datosPrueba = audioDatosPrueba()
  let fabricas = 0
  const audio = new AudioJuego(
    () => {
      fabricas++
      return datosPrueba.context
    },
    () => true,
  )
  audio.configurar(true, 30)
  assert.equal(audio.reproducir("correct"), false)
  assert.equal(fabricas, 0)
  assert.equal(datosPrueba.resumeCount, 0)
  assert.equal(await audio.desbloquear(), true)
  assert.equal(fabricas, 1)
  assert.equal(audio.reproducir("correct"), true)
  assert.equal(datosPrueba.notes.length, 2)
  assert.equal(datosPrueba.notes[0].starts[0], 10)
  assert.equal(datosPrueba.resumeCount, 1)
  assert.equal(datosPrueba.notes[0].gains[1], 0.018)
  audio.restablecer()
})

test("La desactivación y los cambios de volumen detienen notas previas y mantienen amplitud baja", async () => {
  const datosPrueba = audioDatosPrueba("running"),
    audio = new AudioJuego(
      () => datosPrueba.context,
      () => true,
    )
  audio.configurar(false, 30)
  assert.equal(await audio.desbloquear(), false)
  assert.equal(audio.reproducir("incorrect"), false)
  audio.configurar(true, 100)
  await audio.desbloquear()
  audio.reproducir("complete")
  assert.equal(datosPrueba.notes.length, 3)
  assert.ok(datosPrueba.notes.every((nota) => Math.max(...nota.gains) <= 0.06))
  audio.configurar(true, 50)
  assert.ok(datosPrueba.notes.every((nota) => nota.disconnected))
  audio.reproducir("incorrect")
  assert.equal(datosPrueba.notes.at(-1)!.gains[1], 0.03)
  audio.configurar(true, 0)
  assert.equal(audio.reproducir("correct"), false)
  audio.configurar(false, 100)
  assert.equal(datosPrueba.closeCount, 1)
})

test("Los navegadores sin audio o con reproducción bloqueada permanecen silenciosos y no repiten respuestas", async () => {
  const ausente = new AudioJuego(
    () => null,
    () => true,
  )
  ausente.configurar(true, 30)
  assert.equal(await ausente.desbloquear(), false)
  assert.equal(ausente.reproducir("complete"), false)
  const datosPrueba = audioDatosPrueba(),
    bloqueado = new AudioJuego(
      () =>
        ({
          ...datosPrueba.context,
          resume: () => Promise.reject(new Error("NotAllowedError")),
        }) as AudioContext,
      () => true,
    )
  bloqueado.configurar(true, 30)
  assert.equal(await bloqueado.desbloquear(), false)
  assert.equal(bloqueado.reproducir("incorrect"), false)
  assert.equal(datosPrueba.notes.length, 0)
  bloqueado.restablecer()
})

test("Las pestañas ocultas y contextos suspendidos no reproducen ni acumulan sonidos", async () => {
  const datosPrueba = audioDatosPrueba("running")
  let visible = true
  const audio = new AudioJuego(
    () => datosPrueba.context,
    () => visible,
  )
  audio.configurar(true, 30)
  await audio.desbloquear()
  audio.reproducir("complete")
  audio.detener()
  assert.ok(datosPrueba.notes.every((nota) => nota.disconnected))
  visible = false
  assert.equal(audio.reproducir("correct"), false)
  visible = true
  datosPrueba.suspend()
  assert.equal(audio.reproducir("correct"), false)
  assert.equal(datosPrueba.notes.length, 3)
  await audio.desbloquear()
  assert.equal(datosPrueba.notes.length, 3)
  audio.restablecer()
})

test("El volumen se guarda parcialmente y rechaza valores inválidos sin reiniciar el progreso", async () => {
  const almacen = new AlmacenTransacciones(),
    cuenta = async () => ({ email: "owner@example.invalid", metadata: {} })
  await crearPerfil(
    "owner",
    { firstName: "Ana", lastName: "Prueba" },
    almacen.database,
    cuenta,
  )
  almacen.documents.set("users/owner/progress/speed", {
    currentLevel: "hard",
    totalExercises: 20,
  })
  await Promise.all([
    modificarPerfil(
      "owner",
      { accessibilityPreferences: { volumenSonidos: 72 } },
      almacen.database,
      cuenta,
    ),
    modificarPerfil(
      "owner",
      { accessibilityPreferences: { altoContraste: true } },
      almacen.database,
      cuenta,
    ),
  ])
  const restaurado = await buscarPerfil("owner", almacen.database, cuenta)
  assert.equal(restaurado!.accessibilityPreferences.volumenSonidos, 72)
  assert.equal(restaurado!.accessibilityPreferences.altoContraste, true)
  assert.deepEqual(almacen.documents.get("users/owner/progress/speed"), {
    currentLevel: "hard",
    totalExercises: 20,
  })
  for (const volumenSonidos of [-1, 101, 0.5, NaN, Infinity, "50", null])
    assert.throws(
      () =>
        validarCambiosPerfil({
          accessibilityPreferences: { volumenSonidos },
        }),
      ErrorValidacionPerfil,
    )
  assert.equal(
    leerPreferenciasAccesibilidad({ sonidos: false }).volumenSonidos,
    30,
  )
})
