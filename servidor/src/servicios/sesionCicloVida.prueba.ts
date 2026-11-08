import type { Firestore } from "firebase-admin/firestore"
import test from "node:test"
import assert from "node:assert/strict"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import {
  crearEjercicioSesion,
  modificarEjercicioSesion,
  leerEjercicioSesion,
  listaRecuperableSesiones,
} from "../repositorios/sesion.repositorio"
import {
  sesionCambios,
  recuperacionCambios,
  guardandoCambios,
} from "./sesion.servicio"
import { validarPuntoControl } from "./sesionPuntoControl"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"
import { transaccionarEjercicioResultado } from "../repositorios/finalizacionEjercicio.repositorio"
import { ActivoTiempo } from "../../../compartido/tiempoActivo"
import {
  efectivoSesionEstado,
  type PuntoControlEjercicio,
} from "../../../compartido/sesionEjercicio"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
import { tiposMemoria } from "../../../compartido/memoria"
import { tiposLenguaje } from "../../../compartido/lenguaje"
import { tiposCalculo } from "../../../compartido/calculo"
import { tiposAtencion } from "../../../compartido/atencionReconocimiento"
import {
  tiposVelocidad,
  type VelocidadInstancia,
} from "../../../compartido/velocidad"

function puntoControl(
  ejercicio: InstanciaEjercicio,
  secuencia = 1,
): PuntoControlEjercicio {
  const comun = {
    feedback: "Respuesta parcial",
    locked: false,
    pending: null,
    answers: [],
  }
  const estado =
    ejercicio.cognitiveFunctionId === "memory"
      ? { ...comun, selected: [], matched: [], reveal: [], phaseElapsed: 500 }
      : ejercicio.cognitiveFunctionId === "language"
        ? { ...comun, selected: null, questionStart: 0, crossword: null }
        : ejercicio.cognitiveFunctionId === "calculation"
          ? {
              ...comun,
              numericValue: "12",
              selectedOption: null,
              selectedOrder: [],
              questionStart: 0,
            }
          : ejercicio.cognitiveFunctionId === "attentionRecognition"
            ? {
                ...comun,
                selected: [],
                choice: null,
                attempts: [],
                elapsed: 0,
                questionStart: 0,
              }
            : { ...comun, waiting: 0 }
  return {
    version: 1,
    sequence: secuencia,
    exerciseId: ejercicio.id,
    phase: ejercicio.cognitiveFunctionId === "memory" ? "response" : "question",
    step: 0,
    activeSeconds: 1.25,
    state: estado,
  }
}

async function prepararPrueba() {
  const almacen = new AlmacenTransacciones(),
    estrategia = obtenerEjercicioEstrategia("quickResponse")
  const sesion = await crearEjercicioSesion(
    "owner",
    "speed",
    (nivel) => estrategia.generateExercise(nivel),
    almacen.database,
    true,
  )
  const ruta = `users/owner/sessions/${sesion.id}`
  const actualizar = (estado: string, secuencia = 1) =>
    modificarEjercicioSesion(
      "owner",
      sesion.id,
      (actual) =>
        sesionCambios(
          actual,
          estado,
          puntoControl(sesion.exercise, secuencia),
          sesion.ownerToken,
        ),
      almacen.database,
    )
  await actualizar("active")
  const instancia = sesion.exercise.payload as VelocidadInstancia
  const respuesta = {
    answers: instancia.trials.map((ensayo) => ({
      trialId: ensayo.id,
      status: "answered",
      submittedAnswer: ensayo.expectedAnswer,
      responseTimeMs: 500,
    })),
    actualResponseTimeSeconds: instancia.trials.length / 2,
  }
  const resultado = {
    exerciseId: sesion.exercise.id,
    exerciseType: sesion.exercise.type,
    cognitiveFunctionId: "speed",
    response: respuesta,
  }
  return {
    store: almacen,
    session: sesion,
    path: ruta,
    update: actualizar,
    result: resultado,
  }
}

test("Los 20 juegos aceptan estados de recuperación acotados y conservan la instancia autorizada", () => {
  for (const tipo of [
    ...tiposMemoria,
    ...tiposLenguaje,
    ...tiposCalculo,
    ...tiposAtencion,
    ...tiposVelocidad,
  ]) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise("hard"),
      procesoHijo = puntoControl(ejercicio)
    assert.deepEqual(validarPuntoControl(ejercicio, procesoHijo), procesoHijo)
    assert.throws(() =>
      validarPuntoControl(ejercicio, {
        ...procesoHijo,
        exerciseId: "different",
      }),
    )
    assert.throws(() =>
      validarPuntoControl(ejercicio, { ...procesoHijo, step: 999 }),
    )
    assert.throws(() =>
      validarPuntoControl(ejercicio, { ...procesoHijo, phase: "completed" }),
    )
    assert.throws(() =>
      validarPuntoControl(ejercicio, { ...procesoHijo, state: {} }),
    )
    for (const tiempo of [-1, NaN, Infinity, 86401])
      assert.throws(() =>
        validarPuntoControl(ejercicio, {
          ...procesoHijo,
          activeSeconds: tiempo,
        }),
      )
  }
})

test("Los puntos de recuperación rechazan JSON inseguro, listas inválidas y escrituras antiguas", async () => {
  const {
    store: almacen,
    session: sesion,
    update: actualizar,
    path: ruta,
  } = await prepararPrueba()
  const procesoHijo = puntoControl(sesion.exercise)
  assert.throws(() =>
    validarPuntoControl(sesion.exercise, {
      ...procesoHijo,
      state: { ...procesoHijo.state, answers: "invalid" },
    }),
  )
  assert.throws(() =>
    validarPuntoControl(sesion.exercise, {
      ...procesoHijo,
      state: {
        ...procesoHijo.state,
        unsafe: JSON.parse('{"__proto__":{"changed":true}}'),
      },
    }),
  )
  await actualizar("paused", 3)
  await assert.rejects(actualizar("active", 2), /desactualizado/)
  assert.equal(almacen.documents.get(ruta)?.status, "paused")
})

test("Pausar y reanudar conservan el mismo estado, instancia original y tiempo acumulado", async () => {
  const {
    store: almacen,
    session: sesion,
    update: actualizar,
    path: ruta,
  } = await prepararPrueba()
  await actualizar("paused", 2)
  const pausado = await leerEjercicioSesion(
    "owner",
    sesion.id,
    almacen.database,
  )
  assert.equal(pausado.status, "paused")
  assert.deepEqual(pausado.exercise, sesion.exercise)
  assert.equal(
    (pausado.checkpoint as PuntoControlEjercicio).activeSeconds,
    1.25,
  )
  await actualizar("active", 3)
  assert.equal(almacen.documents.get(ruta)?.status, "active")
  assert.equal(almacen.documents.has("users/owner/progress/speed"), false)
  const reloj = new ActivoTiempo()
  reloj.restore(1250)
  reloj.resume(10000)
  assert.equal(reloj.pause(10250), 1500)
  assert.equal(reloj.read(99999), 1500)
})

test("Recuperar tras recarga cambia la propiedad, conserva el estado y bloquea la pestaña anterior", async () => {
  const {
    store: almacen,
    session: sesion,
    update: actualizar,
    path: ruta,
  } = await prepararPrueba()
  await actualizar("paused", 2)
  const antes = almacen.documents.get(ruta)!
  const recuperado = await modificarEjercicioSesion(
    "owner",
    sesion.id,
    recuperacionCambios,
    almacen.database,
  )
  assert.equal(recuperado.status, "paused")
  assert.notEqual(recuperado.ownerToken, sesion.ownerToken)
  assert.deepEqual(recuperado.exercise, antes.exercise)
  assert.deepEqual(recuperado.checkpoint, antes.checkpoint)
  await assert.rejects(actualizar("active", 3), /otra pestaña/)
  await assert.rejects(
    modificarEjercicioSesion(
      "another-user",
      sesion.id,
      recuperacionCambios,
      almacen.database,
    ),
    /inexistente/,
  )
  const siguiente = await modificarEjercicioSesion(
    "owner",
    sesion.id,
    (actual) =>
      sesionCambios(
        actual,
        "active",
        puntoControl(sesion.exercise, 4),
        recuperado.ownerToken,
      ),
    almacen.database,
  )
  assert.equal(siguiente.status, "active")
})

test("Las sesiones de pestañas cerradas pasan a pausa persistida al consultar su recuperación", async () => {
  const {
    store: almacen,
    path: ruta,
    session: sesion,
    result: resultado,
  } = await prepararPrueba()
  almacen.documents.set(ruta, {
    ...almacen.documents.get(ruta),
    leaseExpiresAt: Date.now() - 1,
  })
  assert.equal(
    efectivoSesionEstado(
      almacen.documents.get(ruta) as {
        status: string
        leaseExpiresAt: number
      },
    ),
    "paused",
  )
  assert.throws(
    () =>
      guardandoCambios(
        almacen.documents.get(ruta)!,
        resultado,
        sesion.ownerToken,
      ),
    /no está activa/,
  )
  assert.equal(
    (await leerEjercicioSesion("owner", sesion.id, almacen.database)).status,
    "paused",
  )
  assert.equal(almacen.documents.get(ruta)?.status, "paused")
})

test("Cancelar y proteger un guardado son mutuamente excluyentes bajo reintentos transaccionales", async () => {
  for (const guardarPrimero of [true, false]) {
    const {
      store: almacen,
      session: sesion,
      path: ruta,
      result: resultado,
    } = await prepararPrueba()
    const cancelar = () =>
      modificarEjercicioSesion(
        "owner",
        sesion.id,
        (actual) =>
          sesionCambios(actual, "cancelled", undefined, sesion.ownerToken),
        almacen.database,
      )
    const guardar = () =>
      modificarEjercicioSesion(
        "owner",
        sesion.id,
        (actual) => guardandoCambios(actual, resultado, sesion.ownerToken),
        almacen.database,
      )
    const desenlaces = await Promise.allSettled(
      guardarPrimero ? [guardar(), cancelar()] : [cancelar(), guardar()],
    )
    assert.equal(
      desenlaces.filter((elemento) => elemento.status === "fulfilled").length,
      1,
    )
    assert.equal(
      almacen.documents.get(ruta)?.status,
      guardarPrimero ? "saving" : "cancelled",
    )
    assert.equal(almacen.documents.has(`${ruta}/results/completed`), false)
    assert.equal(almacen.documents.has("users/owner/progress/speed"), false)
  }
})

test("El guardado protegido sobrevive a la recuperación y los reintentos crean un solo resultado", async () => {
  const {
    store: almacen,
    session: sesion,
    path: ruta,
    result: resultado,
  } = await prepararPrueba()
  await modificarEjercicioSesion(
    "owner",
    sesion.id,
    (actual) => guardandoCambios(actual, resultado, sesion.ownerToken),
    almacen.database,
  )
  const recuperado = await modificarEjercicioSesion(
    "owner",
    sesion.id,
    recuperacionCambios,
    almacen.database,
  )
  assert.equal(recuperado.status, "saving")
  const completar = () =>
    transaccionarEjercicioResultado(
      "owner",
      sesion.id,
      (ejercicio) => assert.equal(ejercicio.id, resultado.exerciseId),
      (ejercicio, progreso, estado, guardadoRespuesta) =>
        prepararSesionResultado(ejercicio, progreso, guardadoRespuesta, estado),
      "speed",
      almacen.database,
      recuperado.ownerToken as string,
    )
  const [primero, reintentar] = await Promise.all([completar(), completar()])
  assert.deepEqual(primero, reintentar)
  assert.equal(almacen.documents.get(ruta)?.status, "completed")
  assert.equal(
    almacen.documents.get("users/owner/progress/speed")?.totalExercises,
    1,
  )
  assert.equal(
    almacen.documents.get("users/owner/progress/speed")?.promotionStreak,
    1,
  )
  assert.equal(almacen.documents.has("users/owner/progress/memory"), false)
})

test("Las sesiones nuevas rechazan resultados sin protección previa del guardado", async () => {
  const { store: almacen, session: sesion } = await prepararPrueba()
  await assert.rejects(
    transaccionarEjercicioResultado(
      "owner",
      sesion.id,
      () => {},
      () => {
        throw new Error("Should not evaluate")
      },
      "speed",
      almacen.database,
      sesion.ownerToken,
    ),
    /Protegé el guardado/,
  )
  assert.equal(almacen.documents.has("users/owner/progress/speed"), false)
})

test("Las sesiones completadas no ocultan sesiones pendientes de recuperación", async () => {
  const { store: almacen, session: sesion, path: ruta } = await prepararPrueba()
  for (let indice = 0; indice < 150; indice++)
    almacen.documents.set(`users/owner/sessions/completed-${indice}`, {
      status: "completed",
      exercise: sesion.exercise,
    })
  almacen.documents.set(ruta, {
    ...almacen.documents.get(ruta),
    leaseExpiresAt: Date.now() - 1,
  })
  const baseDatos = {
    ...almacen.database,
    collection: (coleccionRuta: string) => ({
      where: (campo: string, operador: string, estados: string[]) => {
        assert.equal(coleccionRuta, "users/owner/sessions")
        assert.equal(campo, "status")
        assert.equal(operador, "in")
        return {
          limit: (limite: number) => ({
            get: async () => ({
              docs: [...almacen.documents]
                .filter(
                  ([clave, datos]) =>
                    clave.startsWith(coleccionRuta + "/") &&
                    clave.split("/").length === 4 &&
                    estados.includes(String(datos.status)),
                )
                .slice(0, limite)
                .map(([clave, datos]) => ({
                  id: clave.split("/").at(-1)!,
                  data: () => datos,
                })),
            }),
          }),
        }
      },
    }),
  } as unknown as Firestore
  const pendiente = await listaRecuperableSesiones("owner", baseDatos)
  assert.equal(pendiente.length, 1)
  assert.equal(pendiente[0].id, sesion.id)
  assert.equal(pendiente[0].status, "paused")
})
