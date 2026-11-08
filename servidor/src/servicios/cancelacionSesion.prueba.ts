import test from "node:test"
import assert from "node:assert/strict"
import { Timestamp } from "firebase-admin/firestore"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import { AlmacenHistorial } from "../pruebas/historialAlmacen"
import {
  crearEjercicioSesion,
  modificarEjercicioSesion,
} from "../repositorios/sesion.repositorio"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import {
  sesionCambios,
  guardandoCambios,
  recuperacionCambios,
} from "./sesion.servicio"
import {
  cancelarSesionPendiente,
  cambiosCancelacion,
  listarCancelaciones,
  obtenerCancelacion,
} from "./cancelacionSesion.servicio"
import { interpretarCanceladasConsulta } from "../repositorios/cancelaciones.repositorio"
import {
  presentarCancelacion,
  resumirAvanceParcial,
} from "./avanceParcial.servicio"
import { tiposMemoria } from "../../../compartido/memoria"
import { tiposLenguaje } from "../../../compartido/lenguaje"
import { tiposCalculo } from "../../../compartido/calculo"
import { tiposAtencion } from "../../../compartido/atencionReconocimiento"
import {
  tiposVelocidad,
  type VelocidadInstancia,
} from "../../../compartido/velocidad"
import type { EjercicioTipo } from "../tipos/dominio"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
import type { PuntoControlEjercicio } from "../../../compartido/sesionEjercicio"
import {
  cancelarPendiente,
  canceladas,
  detalleCancelada,
} from "../controladores/sesion.controlador"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import type { Response } from "express"

function punto(
  ejercicio: InstanciaEjercicio,
  token: string,
  secuencia = 1,
): PuntoControlEjercicio {
  return {
    version: 1,
    writerToken: token,
    sequence: secuencia,
    exerciseId: ejercicio.id,
    phase: ejercicio.cognitiveFunctionId === "memory" ? "response" : "question",
    step: 0,
    activeSeconds: 4.25,
    state: {
      answers: [],
      feedback: "",
      locked: false,
      pending: null,
      selected: ejercicio.cognitiveFunctionId === "language" ? null : [],
      matched: [],
      reveal: [],
      phaseElapsed: 0,
      numericValue: "12",
      selectedOption: null,
      selectedOrder: [],
      questionStart: 0,
      crossword: null,
      waiting: 0,
      choice: null,
      attempts: [],
      elapsed: 0,
    },
  }
}

async function preparar(tipo: EjercicioTipo = "mentalCalculation") {
  const almacen = new AlmacenTransacciones(),
    estrategia = obtenerEjercicioEstrategia(tipo)
  const sesion = await crearEjercicioSesion(
    "owner",
    estrategia.cognitiveFunctionId,
    (nivel) => estrategia.generateExercise(nivel),
    almacen.database,
    true,
  )
  const ruta = `users/owner/sessions/${sesion.id}`
  const estado = punto(sesion.exercise, sesion.ownerToken!)
  await modificarEjercicioSesion(
    "owner",
    sesion.id,
    (actual) => sesionCambios(actual, "paused", estado, sesion.ownerToken),
    almacen.database,
  )
  return { almacen, sesion, ruta, estado }
}

test("Cancelar desde pendientes conserva el estado local más reciente y nunca crea resultados ni modifica el progreso", async () => {
  const { almacen, sesion, ruta, estado } = await preparar()
  almacen.documents.set("users/owner/progress/calculation", {
    currentLevel: "hard",
    promotionStreak: 1,
    totalExercises: 9,
  })
  const anterior = {
    ...almacen.documents.get("users/owner/progress/calculation"),
  }
  const local = {
    ...estado,
    sequence: 3,
    activeSeconds: 8,
    state: { ...estado.state, numericValue: "123" },
  }
  await cancelarSesionPendiente(
    "owner",
    sesion.id,
    local,
    sesion.ownerToken,
    almacen.database,
  )
  const guardado = almacen.documents.get(ruta)!
  assert.equal(guardado.status, "cancelled")
  assert.ok(guardado.endedAt)
  assert.equal(
    (guardado.checkpoint as PuntoControlEjercicio).state.numericValue,
    "123",
  )
  assert.equal((guardado.checkpoint as PuntoControlEjercicio).activeSeconds, 8)
  assert.deepEqual(guardado.exercise, sesion.exercise)
  assert.deepEqual(guardado.cancellation, { version: 1, origin: "pendingList" })
  assert.deepEqual(
    almacen.documents.get("users/owner/progress/calculation"),
    anterior,
  )
  assert.equal(almacen.documents.has(`${ruta}/results/completed`), false)
  const version = almacen.versions.get(ruta),
    fecha = guardado.endedAt
  await cancelarSesionPendiente(
    "owner",
    sesion.id,
    undefined,
    undefined,
    almacen.database,
  )
  assert.equal(almacen.versions.get(ruta), version)
  assert.equal(almacen.documents.get(ruta)?.endedAt, fecha)
  await assert.rejects(
    modificarEjercicioSesion(
      "owner",
      sesion.id,
      recuperacionCambios,
      almacen.database,
    ),
  )
  await assert.rejects(
    modificarEjercicioSesion(
      "owner",
      sesion.id,
      (actual) => sesionCambios(actual, "active", undefined, sesion.ownerToken),
      almacen.database,
    ),
  )
})

test("Se conserva el punto remoto si una copia es antigua o pertenece a otro propietario; los estados locales inválidos se rechazan", async () => {
  const { almacen, sesion, ruta, estado } = await preparar()
  assert.throws(() =>
    cambiosCancelacion(
      almacen.documents.get(ruta)!,
      { ...estado, activeSeconds: -1 },
      sesion.ownerToken,
    ),
  )
  const viejo = cambiosCancelacion(
    almacen.documents.get(ruta)!,
    { ...estado, state: { ...estado.state, numericValue: "99" } },
    sesion.ownerToken,
  )
  assert.equal(
    (viejo.checkpoint as PuntoControlEjercicio).state.numericValue,
    "12",
  )
  const ajeno = cambiosCancelacion(
    almacen.documents.get(ruta)!,
    { ...estado, sequence: 99, state: { ...estado.state, numericValue: "99" } },
    "otra-pestana",
  )
  assert.equal(
    (ajeno.checkpoint as PuntoControlEjercicio).state.numericValue,
    "12",
  )
  await assert.rejects(
    cancelarSesionPendiente(
      "otro",
      sesion.id,
      undefined,
      undefined,
      almacen.database,
    ),
  )
  assert.equal(almacen.documents.get(ruta)?.status, "paused")
})

test("Los 20 ejercicios conservan el avance cancelado, sin convertir respuestas omitidas en errores ni fabricar una precisión", async () => {
  for (const tipo of [
    ...tiposMemoria,
    ...tiposLenguaje,
    ...tiposCalculo,
    ...tiposAtencion,
    ...tiposVelocidad,
  ]) {
    const { almacen, sesion, ruta } = await preparar(tipo)
    await cancelarSesionPendiente(
      "owner",
      sesion.id,
      undefined,
      undefined,
      almacen.database,
    )
    const salida = presentarCancelacion(
      sesion.id,
      almacen.documents.get(ruta)!,
      true,
    )
    assert.equal(salida.status, "cancelled")
    assert.equal(salida.partialProgress?.activeSeconds, 4.25, tipo)
    assert.equal(salida.partialProgress?.recordedResponses, 0)
    assert.equal("accuracy" in salida, false)
    assert.equal("errors" in salida, false)
    assert.equal(almacen.documents.has(`${ruta}/results/completed`), false)
  }
})

test("El detalle parcial conserva respuestas numéricas, tiempos en segundos, anticipaciones y letras de crucigrama", () => {
  const calculo =
      obtenerEjercicioEstrategia("mentalCalculation").generateExercise("easy"),
    estado = punto(calculo, "token")
  estado.state.answers = [
    { questionId: "one", answer: 0, responseTimeSeconds: 0.5 },
  ]
  const parcial = resumirAvanceParcial(calculo, estado, true)!
  assert.equal(parcial.responses?.[0].response, "0")
  assert.equal(parcial.responses?.[0].responseTimeSeconds, 0.5)
  assert.equal(parcial.drafts?.[0].response, "12")
  const velocidad =
      obtenerEjercicioEstrategia("quickResponse").generateExercise("easy"),
    rapido = punto(velocidad, "token")
  rapido.state.answers = [
    {
      trialId: (velocidad.payload as VelocidadInstancia).trials[0].id,
      status: "answered",
      submittedAnswer: "A",
      responseTimeMs: 250,
    },
  ]
  const ensayos = (velocidad.payload as VelocidadInstancia).trials
  ;(rapido.state.answers as unknown[]).push(
    {
      trialId: ensayos[1].id,
      status: "timeout",
      submittedAnswer: null,
      responseTimeMs: 1000,
    },
    {
      trialId: ensayos[2].id,
      status: "falseStart",
      submittedAnswer: null,
      responseTimeMs: null,
    },
  )
  assert.equal(
    resumirAvanceParcial(velocidad, rapido, true)?.responses?.[1].status,
    "timeout",
  )
  assert.equal(
    resumirAvanceParcial(velocidad, rapido, true)?.responses?.[2].status,
    "falseStart",
  )
  assert.equal(
    resumirAvanceParcial(velocidad, rapido, true)?.responses?.[0]
      .responseTimeSeconds,
    0.25,
  )
  const crucigrama =
      obtenerEjercicioEstrategia("simpleCrossword").generateExercise("easy"),
    tablero = punto(crucigrama, "token")
  const palabra = (crucigrama.payload as {
    puzzle: { words: { id: string }[] }
  }).puzzle.words[0]
  tablero.state.crossword = {
    selectedId: palabra.id,
    feedback: "",
    letters: { "0,0": "A" },
    attempts: { [palabra.id]: ["CASA"] },
    finished: {},
  }
  const letras = resumirAvanceParcial(crucigrama, tablero, true)!
  assert.equal(letras.recordedResponses, 1)
  assert.equal(letras.responses?.[0].response, "CASA")
  assert.equal(letras.drafts?.[0].response, "A")
  assert.equal(
    resumirAvanceParcial(calculo, { ...estado, exerciseId: "ajeno" }, true),
    null,
  )
})

test("Cancelar una sesión sin punto guardado deja constancia sin inventar respuestas", async () => {
  const { almacen, sesion, ruta } = await preparar()
  almacen.documents.set(ruta, {
    ...almacen.documents.get(ruta),
    checkpoint: null,
    status: "created",
  })
  await cancelarSesionPendiente(
    "owner",
    sesion.id,
    undefined,
    undefined,
    almacen.database,
  )
  assert.equal(
    presentarCancelacion(sesion.id, almacen.documents.get(ruta)!, true)
      .partialProgress,
    null,
  )
})

test("La cancelación desde un ejercicio también conserva checkpoint y fecha bajo reintentos", async () => {
  const { almacen, sesion, ruta, estado } = await preparar()
  await modificarEjercicioSesion(
    "owner",
    sesion.id,
    (actual) =>
      sesionCambios(
        actual,
        "cancelled",
        { ...estado, sequence: 2 },
        sesion.ownerToken,
      ),
    almacen.database,
  )
  const version = almacen.versions.get(ruta),
    guardado = almacen.documents.get(ruta)
  await modificarEjercicioSesion(
    "owner",
    sesion.id,
    (actual) =>
      sesionCambios(actual, "cancelled", undefined, sesion.ownerToken),
    almacen.database,
  )
  assert.equal(almacen.versions.get(ruta), version)
  assert.deepEqual(almacen.documents.get(ruta), guardado)
})

test("Cancelar y comenzar el guardado compiten en la misma transacción: solo uno puede ganar", async () => {
  for (const guardarPrimero of [false, true]) {
    const { almacen, sesion, ruta } = await preparar("quickResponse")
    const instancia = sesion.exercise.payload as VelocidadInstancia
    const resultado = {
      exerciseId: sesion.exercise.id,
      exerciseType: sesion.exercise.type,
      cognitiveFunctionId: "speed",
      response: {
        answers: instancia.trials.map((ensayo) => ({
          trialId: ensayo.id,
          status: "answered",
          submittedAnswer: ensayo.expectedAnswer,
          responseTimeMs: 500,
        })),
        actualResponseTimeSeconds: instancia.trials.length / 2,
      },
    }
    await modificarEjercicioSesion(
      "owner",
      sesion.id,
      (actual) => sesionCambios(actual, "active", undefined, sesion.ownerToken),
      almacen.database,
    )
    const cancelar = () =>
      cancelarSesionPendiente(
        "owner",
        sesion.id,
        undefined,
        undefined,
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
    assert.equal(desenlaces.filter((r) => r.status === "fulfilled").length, 1)
    assert.equal(
      almacen.documents.get(ruta)?.status,
      guardarPrimero ? "saving" : "cancelled",
    )
    assert.equal(almacen.documents.has(`${ruta}/results/completed`), false)
  }
  assert.throws(() => cambiosCancelacion({ status: "completed" }))
  assert.throws(() => cambiosCancelacion({ status: "saving" }))
})

test("El registro pagina más de 100 sesiones, omite completadas antes del límite y conserva empates y aislamiento", async () => {
  const almacen = new AlmacenHistorial(),
    ejercicio = obtenerEjercicioEstrategia("wordList").generateExercise("easy")
  for (let indice = 0; indice < 350; indice++)
    almacen.documents.set(
      `users/owner/sessions/sesion-${String(indice).padStart(4, "0")}`,
      {
        status: indice % 2 ? "completed" : "cancelled",
        exercise: ejercicio,
        checkpoint: punto(ejercicio, "token"),
        endedAt: Timestamp.fromMillis(
          1700000000000 + Math.floor(indice / 3) * 1000,
        ),
      },
    )
  almacen.documents.set("users/otro/sessions/secreto", {
    status: "cancelled",
    exercise: ejercicio,
    endedAt: Timestamp.now(),
  })
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const pagina = await listarCancelaciones(
      "owner",
      cursor ? { cursor, limit: "17" } : { limit: "17" },
      almacen.database,
    )
    ids.push(...pagina.items.map((item) => item.id))
    cursor = pagina.nextCursor ?? undefined
  } while (cursor)
  assert.equal(ids.length, 175)
  assert.equal(new Set(ids).size, 175)
  assert.equal(ids.includes("secreto"), false)
  assert.equal(await obtenerCancelacion("otro", ids[0], almacen.database), null)
  const primera = await listarCancelaciones(
    "owner",
    { limit: "17" },
    almacen.database,
  )
  assert.throws(() =>
    interpretarCanceladasConsulta("otro", { cursor: primera.nextCursor! }),
  )
  assert.throws(() =>
    interpretarCanceladasConsulta("owner", { userId: "otro" }),
  )
  assert.equal(primera.items[0].partialProgress?.responses, undefined)
  assert.ok(
    (await obtenerCancelacion("owner", ids[0], almacen.database))
      ?.partialProgress?.responses,
  )
})

test("Los controladores nuevos exigen autenticación y rechazan un UID enviado por el cliente", async () => {
  for (const controlador of [cancelarPendiente, canceladas, detalleCancelada]) {
    let estado = 0
    const respuesta = {
      status: (valor: number) => {
        estado = valor
        return respuesta
      },
      json: () => respuesta,
    } as unknown as Response
    await controlador(
      { params: {}, body: {}, query: {} } as AutenticadoSolicitud,
      respuesta,
    )
    assert.equal(estado, 401)
  }
  let estado = 0
  const respuesta = {
    status: (valor: number) => {
      estado = valor
      return respuesta
    },
    json: () => respuesta,
  } as unknown as Response
  await cancelarPendiente(
    {
      userId: "owner",
      params: { sessionId: "one" },
      body: { userId: "otro" },
    } as unknown as AutenticadoSolicitud,
    respuesta,
  )
  assert.equal(estado, 400)
})

test("Las rutas HTTP de cancelación y su registro exigen token antes de consultar datos", async () => {
  const { aplicacion } = await import("../aplicacion")
  const servidor = aplicacion.listen(0, "127.0.0.1")
  await new Promise<void>((resolver) => servidor.once("listening", resolver))
  const puerto = (servidor.address() as import("node:net").AddressInfo).port
  try {
    for (const [metodo, ruta] of [
      ["POST", "/api/sessions/actividad/cancel"],
      ["GET", "/api/sessions/cancelled"],
      ["GET", "/api/sessions/cancelled/actividad"],
    ]) {
      const respuesta = await fetch(`http://127.0.0.1:${puerto}${ruta}`, {
        method: metodo,
        ...(metodo === "POST"
          ? { headers: { "Content-Type": "application/json" }, body: "{}" }
          : {}),
      })
      assert.equal(respuesta.status, 401)
      assert.equal(typeof (await respuesta.json()).error, "string")
    }
  } finally {
    await new Promise<void>((resolver, rechazar) =>
      servidor.close((error) => (error ? rechazar(error) : resolver())),
    )
  }
})
