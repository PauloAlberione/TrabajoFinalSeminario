import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import test from "node:test"
import assert from "node:assert/strict"
import { obtenerProgreso } from "../repositorios/progreso.repositorio"
import { crearEjercicioSesion } from "../repositorios/sesion.repositorio"
import { transaccionarEjercicioResultado } from "../repositorios/finalizacionEjercicio.repositorio"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"
import { calcularMetricasRendimiento } from "./dificultadAdaptativa.servicio"
import {
  CATEGORIA_IDS,
  normalizarCategoria,
  type DetallesEjercicio,
  type EjercicioEvaluacion,
} from "../../../compartido/resultados"
import {
  tiposMemoria,
  type InstanciaMemoria,
} from "../../../compartido/memoria"
import {
  tiposLenguaje,
  type LenguajeInstancia,
} from "../../../compartido/lenguaje"
import {
  tiposCalculo,
  type CalculoInstancia,
} from "../../../compartido/calculo"
import {
  tiposAtencion,
  visualClave,
  type AtencionInstancia,
} from "../../../compartido/atencionReconocimiento"
import {
  tiposVelocidad,
  type VelocidadInstancia,
} from "../../../compartido/velocidad"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
import { ActivoTiempo } from "../../../compartido/tiempoActivo"

function perfecto(ejercicio: InstanciaEjercicio): Record<string, unknown> {
  switch (ejercicio.cognitiveFunctionId) {
    case "memory": {
      const instancia = ejercicio.payload as InstanciaMemoria
      const respuestas =
        instancia.type === "imagePairs"
          ? instancia.rounds[0].target.map((valor) =>
              instancia.rounds[0].options.flatMap((tarjeta, indice) =>
                tarjeta === valor ? [String(indice)] : [],
              ),
            )
          : instancia.rounds.map((ronda) => ronda.target)
      return { answers: respuestas, actualResponseTimeSeconds: 10 }
    }
    case "language": {
      const instancia = ejercicio.payload as LenguajeInstancia
      return instancia.puzzle
        ? {
            answers: [],
            words: instancia.puzzle.words.map((palabra) => ({
              wordId: palabra.id,
              attempts: [palabra.answer],
            })),
            actualResponseTimeSeconds: 10,
          }
        : {
            words: [],
            answers: instancia.questions.map((pregunta) => ({
              questionId: pregunta.id,
              answer: pregunta.answer,
              responseTimeSeconds: 1,
            })),
            actualResponseTimeSeconds: instancia.questions.length,
          }
    }
    case "calculation": {
      const instancia = ejercicio.payload as CalculoInstancia
      return {
        answers: instancia.questions.map((pregunta) => ({
          questionId: pregunta.id,
          answer: "expected" in pregunta ? pregunta.expected : pregunta.answer,
          responseTimeSeconds: 1,
        })),
        actualResponseTimeSeconds: instancia.questions.length,
      }
    }
    case "attentionRecognition": {
      const instancia = ejercicio.payload as AtencionInstancia
      return {
        answers: instancia.rounds.map((ronda) => ({
          roundId: ronda.id,
          selection:
            "items" in ronda
              ? instancia.type === "hiddenFigure"
                ? [ronda.targetIndices[0]]
                : ronda.targetIndices
              : "targetId" in ronda
                ? ronda.targetId
                : visualClave(ronda.correctAnswer),
          responseTimeSeconds: 1,
        })),
        actualResponseTimeSeconds: instancia.rounds.length,
      }
    }
    case "speed": {
      const instancia = ejercicio.payload as VelocidadInstancia
      return {
        answers: instancia.trials.map((ensayo) => ({
          trialId: ensayo.id,
          status: "answered",
          submittedAnswer: ensayo.expectedAnswer,
          responseTimeMs: 500,
        })),
        actualResponseTimeSeconds: instancia.trials.length / 2,
      }
    }
  }
}

function completar(
  almacen: AlmacenTransacciones,
  usuario: string,
  id: string,
  categoria: InstanciaEjercicio["cognitiveFunctionId"],
  respuesta?: unknown,
) {
  return transaccionarEjercicioResultado(
    usuario,
    id,
    (ejercicio) => {
      assert.equal(ejercicio.cognitiveFunctionId, categoria)
    },
    (ejercicio, progreso, estado) =>
      prepararSesionResultado(
        ejercicio,
        progreso,
        respuesta ?? perfecto(ejercicio),
        estado,
      ),
    categoria,
    almacen.database,
  )
}

async function iniciar(
  almacen: AlmacenTransacciones,
  tipo: "wordList" | "colorSequence" | "wordAssociation" | "quickResponse",
  usuario = "owner",
) {
  const estrategia = obtenerEjercicioEstrategia(tipo)
  await obtenerProgreso(
    usuario,
    estrategia.cognitiveFunctionId,
    almacen.database,
  )
  const sesion = await crearEjercicioSesion(
    usuario,
    estrategia.cognitiveFunctionId,
    (nivel) => estrategia.generateExercise(nivel),
    almacen.database,
  )
  const ruta = `users/${usuario}/sessions/${sesion.id}`
  almacen.documents.set(ruta, {
    ...almacen.documents.get(ruta),
    status: "active",
  })
  return sesion
}

test("El progreso anterior de Velocidad migra sin reiniciar nivel, rachas ni contadores", async () => {
  const almacen = new AlmacenTransacciones()
  const anterior = {
    currentLevel: "hard",
    promotionStreak: 1,
    demotionStreak: 0,
    totalExercises: 12,
    totalSessions: 12,
    averageAccuracy: 83,
    averageTime: 4,
    customField: "preserved",
  }
  almacen.documents.set("users/owner/progress/processingSpeed", anterior)
  const [primero, segundo] = await Promise.all([
    obtenerProgreso("owner", "speed", almacen.database),
    obtenerProgreso("owner", "speed", almacen.database),
  ])
  assert.equal(primero.currentLevel, "hard")
  assert.equal(segundo.totalExercises, 12)
  assert.equal(primero.promotionStreak, 1)
  assert.deepEqual(
    almacen.documents.get("users/owner/progress/processingSpeed"),
    anterior,
  )
  assert.equal(
    almacen.documents.get("users/owner/progress/speed")?.customField,
    "preserved",
  )
  const sesion = await iniciar(almacen, "quickResponse")
  assert.equal((sesion.exercise.payload as VelocidadInstancia).level, "hard")
  assert.equal(
    (await completar(almacen, "owner", sesion.id, "speed")).currentLevel,
    "veryHard",
  )
  assert.equal(normalizarCategoria("processingSpeed"), "speed")
  assert.deepEqual(CATEGORIA_IDS, [
    "memory",
    "language",
    "calculation",
    "attentionRecognition",
    "speed",
  ])
})

test("El progreso canónico de Velocidad prevalece y no se migran otras categorías", async () => {
  const almacen = new AlmacenTransacciones()
  almacen.documents.set("users/owner/progress/processingSpeed", {
    currentLevel: "veryHard",
    totalExercises: 99,
  })
  almacen.documents.set("users/owner/progress/speed", {
    currentLevel: "normal",
    totalExercises: 3,
  })
  assert.equal(
    (await obtenerProgreso("owner", "speed", almacen.database)).currentLevel,
    "normal",
  )
  assert.equal(
    (await obtenerProgreso("owner", "memory", almacen.database)).currentLevel,
    "easy",
  )
  assert.equal(
    almacen.documents.get("users/owner/progress/speed")?.totalExercises,
    3,
  )
})

test("Los 20 contratos conservan detalles específicos tipados y rechazan tiempos nulos o inválidos", () => {
  const tipos = [
    ...tiposMemoria,
    ...tiposLenguaje,
    ...tiposCalculo,
    ...tiposAtencion,
    ...tiposVelocidad,
  ]
  assert.equal(tipos.length, 20)
  for (const tipo of tipos) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise("easy"),
      respuesta = perfecto(ejercicio)
    const resultado = prepararSesionResultado(ejercicio, {}, respuesta)
    const evaluacion: EjercicioEvaluacion = resultado.summary
    const detalles: DetallesEjercicio = evaluacion.details!
    assert.equal(detalles.exerciseType, tipo)
    assert.deepEqual(resultado.record.details, detalles)
    assert.equal(resultado.record.timingSource, "clientActiveTime")
    assert.equal(
      evaluacion.actualTimeSeconds,
      evaluacion.actualResponseTimeSeconds,
    )
    for (const tiempo of [0, -1, NaN, Infinity, -Infinity, "1", null, 86401])
      assert.throws(
        () =>
          prepararSesionResultado(ejercicio, {}, {
            ...respuesta,
            actualResponseTimeSeconds: tiempo,
          }),
        tipo,
      )
  }
  const invalidoDetalles: DetallesEjercicio = {
    exerciseType: "imagePairs",
    // @ts-expect-error: imagePairs no admite métricas de Velocidad.
    timeouts: 1,
  }
  assert.ok(invalidoDetalles)
})

test("Las mediciones inferiores a un milisegundo no reciben bonificación temporal y las pausas conservan fracciones", () => {
  const alto = {
    correctAnswers: 9,
    errors: 1,
    totalQuestions: 10,
    targetTimeSeconds: 20,
  }
  assert.equal(
    calcularMetricasRendimiento({ ...alto, actualTimeSeconds: 0 })
      .timeEfficiency,
    0,
  )
  assert.equal(
    calcularMetricasRendimiento({ ...alto, actualTimeSeconds: 0 }, 100)
      .timeEfficiency,
    0,
  )
  assert.equal(
    calcularMetricasRendimiento({ ...alto, actualTimeSeconds: 0.0001 })
      .timeEfficiency,
    0,
  )
  assert.equal(
    calcularMetricasRendimiento({ ...alto, actualTimeSeconds: 0.5 })
      .timeEfficiency,
    100,
  )
  for (const tiempo of [-1, NaN, Infinity, 86401])
    assert.throws(() =>
      calcularMetricasRendimiento({ ...alto, actualTimeSeconds: tiempo }),
    )
  const reloj = new ActivoTiempo()
  reloj.resume(100)
  assert.equal(reloj.pause(100.25), 0.25)
  assert.equal(reloj.read(5000), 0.25)
  reloj.resume(10000)
  assert.equal(reloj.pause(10000.5), 0.75)
})

test("Una respuesta individual no puede declarar tiempo cero aunque el total sea positivo", () => {
  for (const tipo of [
    "wordAssociation",
    "mentalCalculation",
    "identifyElements",
    "quickResponse",
  ] as const) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise("easy")
    const respuesta = perfecto(ejercicio) as {
      answers: Record<string, unknown>[]
      actualResponseTimeSeconds: number
    }
    respuesta.answers[0] = {
      ...respuesta.answers[0],
      responseTimeSeconds: 0,
      responseTimeMs: 0,
    }
    assert.throws(() => prepararSesionResultado(ejercicio, {}, respuesta))
  }
})

test("Dos finalizaciones simultáneas conservan ambos resultados y solo una modifica la racha adaptativa", async () => {
  const almacen = new AlmacenTransacciones()
  const [primero, segundo] = await Promise.all([
    iniciar(almacen, "wordList"),
    iniciar(almacen, "colorSequence"),
  ])
  const resultados = await Promise.all([
    completar(almacen, "owner", primero.id, "memory"),
    completar(almacen, "owner", segundo.id, "memory"),
  ])
  assert.deepEqual(
    resultados.map((resultado) => resultado.adaptationStatus).sort(),
    ["applied", "outdatedProgress"],
  )
  const progreso = almacen.documents.get("users/owner/progress/memory")!
  assert.equal(progreso.totalExercises, 2)
  assert.equal(progreso.promotionStreak, 1)
  assert.equal(progreso.currentLevel, "easy")
  assert.ok(
    almacen.documents.has(
      `users/owner/sessions/${primero.id}/results/completed`,
    ),
  )
  assert.ok(
    almacen.documents.has(
      `users/owner/sessions/${segundo.id}/results/completed`,
    ),
  )
  const siguiente = await iniciar(almacen, "wordList")
  assert.equal(
    (await completar(almacen, "owner", siguiente.id, "memory")).currentLevel,
    "normal",
  )
})

test("Los niveles desactualizados no alteran rachas y las sesiones antiguas se guardan sin adaptación", async () => {
  const almacen = new AlmacenTransacciones()
  const desactualizado = await iniciar(almacen, "wordList"),
    anterior = await iniciar(almacen, "colorSequence")
  const anteriorRuta = `users/owner/sessions/${anterior.id}`
  const anteriorDatos = { ...almacen.documents.get(anteriorRuta)! }
  delete anteriorDatos.progressVersion
  almacen.documents.set(anteriorRuta, anteriorDatos)
  almacen.documents.set("users/owner/progress/memory", {
    currentLevel: "hard",
    totalExercises: 5,
    promotionStreak: 1,
    demotionStreak: 0,
  })
  assert.equal(
    (await completar(almacen, "owner", desactualizado.id, "memory"))
      .adaptationStatus,
    "outdatedLevel",
  )
  assert.equal(
    (await completar(almacen, "owner", anterior.id, "memory")).adaptationStatus,
    "legacySession",
  )
  const progreso = almacen.documents.get("users/owner/progress/memory")!
  assert.equal(progreso.currentLevel, "hard")
  assert.equal(progreso.promotionStreak, 1)
  assert.equal(progreso.totalExercises, 7)
})

test("Los envíos duplicados simultáneos son idempotentes y no afectan otras categorías ni usuarios", async () => {
  const almacen = new AlmacenTransacciones()
  const sesion = await iniciar(almacen, "wordList")
  almacen.documents.set("users/owner/progress/language", {
    currentLevel: "hard",
    totalExercises: 15,
  })
  const [primero, reintentar] = await Promise.all([
    completar(almacen, "owner", sesion.id, "memory"),
    completar(almacen, "owner", sesion.id, "memory"),
  ])
  assert.deepEqual(primero, reintentar)
  assert.equal(
    almacen.documents.get("users/owner/progress/memory")?.totalExercises,
    1,
  )
  assert.equal(
    almacen.documents.get("users/owner/progress/language")?.totalExercises,
    15,
  )
  await assert.rejects(
    completar(almacen, "another-user", sesion.id, "memory"),
    /inexistente/,
  )
  await assert.rejects(completar(almacen, "owner", sesion.id, "language"))
  const otroCategoria = await iniciar(almacen, "wordAssociation")
  assert.equal(
    (await completar(almacen, "owner", otroCategoria.id, "language"))
      .adaptationStatus,
    "applied",
  )
  assert.equal(
    almacen.documents.get("users/owner/progress/memory")?.promotionStreak,
    1,
  )
})

test("Las sesiones pausadas o canceladas no crean resultados ni modifican el progreso", async () => {
  const almacen = new AlmacenTransacciones()
  for (const estado of ["paused", "cancelled"]) {
    const sesion = await iniciar(almacen, "wordList")
    const ruta = `users/owner/sessions/${sesion.id}`
    almacen.documents.set(ruta, {
      ...almacen.documents.get(ruta),
      status: estado,
    })
    await assert.rejects(
      completar(almacen, "owner", sesion.id, "memory"),
      /no está activa/,
    )
    assert.equal(almacen.documents.has(`${ruta}/results/completed`), false)
    assert.equal(almacen.documents.has("users/owner/progress/memory"), false)
  }
})

test("Los tiempos positivos muy rápidos se conservan sin recibir bonificación temporal", () => {
  for (const tipo of [
    ...tiposMemoria,
    ...tiposLenguaje,
    ...tiposCalculo,
    ...tiposAtencion,
    ...tiposVelocidad,
  ]) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise("easy")
    const entrada = perfecto(ejercicio)
    let total = 0.0001
    if (
      ejercicio.cognitiveFunctionId !== "memory" &&
      tipo !== "simpleCrossword"
    ) {
      const respuestas = entrada.answers as Record<string, unknown>[]
      entrada.answers = respuestas.map((respuesta) => ({
        ...respuesta,
        responseTimeSeconds: 0.00001,
        responseTimeMs: 0.01,
      }))
      total = respuestas.length * 0.00001
    }
    entrada.actualResponseTimeSeconds = total
    const resultado = prepararSesionResultado(ejercicio, {}, entrada)
    assert.ok(
      Math.abs(resultado.record.actualResponseTimeSeconds - total) < 1e-12,
      tipo,
    )
    assert.equal(resultado.record.timeEfficiency, 0, tipo)
  }
})
