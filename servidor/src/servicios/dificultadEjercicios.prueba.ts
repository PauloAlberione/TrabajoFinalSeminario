import test from "node:test"
import assert from "node:assert/strict"
import { tiposMemoria, type Nivel } from "../../../compartido/memoria"
import { tiposLenguaje, generarLenguaje } from "../../../compartido/lenguaje"
import { tiposCalculo } from "../../../compartido/calculo"
import { tiposAtencion } from "../../../compartido/atencionReconocimiento"
import {
  tiposVelocidad,
  generarVelocidad,
  evaluarVelocidad,
  coloresSolicitados,
  clasificacionElementos,
  respuestaVelocidadValida,
  type EntregaVelocidad,
  type VelocidadInstancia,
} from "../../../compartido/velocidad"
import { describirDificultad } from "../../../compartido/dificultadEjercicios"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"
import { validarPuntoControl } from "../../../compartido/sesionPuntoControl"

const niveles: Nivel[] = ["easy", "normal", "hard", "veryHard"]
const tipos = [
  ...tiposMemoria,
  ...tiposLenguaje,
  ...tiposCalculo,
  ...tiposAtencion,
  ...tiposVelocidad,
]

for (const tipo of tipos) {
  test(`${tipo}: cada nivel cambia la tarea dentro de la ronda, además de las repeticiones`, () => {
    const complejidades = niveles.map((nivel) => {
      const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(nivel)
      const instancia = ejercicio.payload as {
        config: Record<string, unknown>
        questions?: {
          options: string[]
          tier: string
        }[]
        puzzle?: { words: { answer: string }[] }
      }
      assert.ok(describirDificultad(tipo, nivel).length >= 2)
      if (tipo === "simpleCrossword")
        return instancia
          .puzzle!.words.map((palabra) => palabra.answer.length)
          .sort((primero, segundo) => primero - segundo)
      if (tiposLenguaje.includes(tipo as typeof tiposLenguaje[number]))
        return [
          instancia.config.optionCount,
          [
            ...new Set(instancia.questions!.map((pregunta) => pregunta.tier)),
          ].sort(),
        ]
      if (tipo === "quickResponse") {
        const velocidad = ejercicio.payload as VelocidadInstancia
        return [
          velocidad.config.comparisonCount,
          [
            ...new Set(
              velocidad.trials.flatMap((ensayo) =>
                ensayo.kind === "quickResponse"
                  ? (ensayo.comparisonPairs ?? [ensayo.pair])
                      .flat()
                      .map((figura) => figura.fill)
                  : [],
              ),
            ),
          ].sort(),
        ]
      }
      if (tipo === "quickClassification") {
        const velocidad = ejercicio.payload as VelocidadInstancia
        return [
          instancia.config.optionCount,
          [
            ...new Set(
              velocidad.trials.map(
                (ensayo) =>
                  ensayo.kind === "quickClassification" &&
                  clasificacionElementos.find(
                    (elemento) => elemento.id === ensayo.itemId,
                  )!.familiar,
              ),
            ),
          ],
        ]
      }
      // Se excluyen repeticiones, objetivos temporales y tiempos de espera.
      return Object.fromEntries(
        Object.entries(instancia.config).filter(
          ([clave]) =>
            ![
              "questionCount",
              "rounds",
              "targetTimeSeconds",
              "timeoutMs",
              "expectedResponseMs",
              "waitMinimumMs",
              "waitMaximumMs",
            ].includes(clave),
        ),
      )
    })
    for (let indice = 1; indice < niveles.length; indice++)
      assert.notDeepEqual(
        complejidades[indice],
        complejidades[indice - 1],
        `${tipo}: ${niveles[indice - 1]} → ${niveles[indice]}`,
      )
  })
}

function responderPerfecto(instancia: VelocidadInstancia): EntregaVelocidad {
  return {
    actualResponseTimeSeconds: instancia.trials.length,
    answers: instancia.trials.map((ensayo) => ({
      trialId: ensayo.id,
      status: "answered",
      submittedAnswer: ensayo.expectedAnswer,
      responseTimeMs: 1000,
    })),
  }
}

test("Muy difícil en colores: una ronda evalúa dos colores en orden y registra las selecciones parciales", () => {
  const instancia = generarVelocidad("touchColor", "veryHard")
  const ensayo = instancia.trials[0]
  assert.equal(ensayo.kind, "touchColor")
  if (ensayo.kind !== "touchColor") throw new Error("Ensayo inesperado")
  assert.equal(ensayo.options.length, 8)
  const colores = coloresSolicitados(ensayo)
  assert.equal(colores.length, 2)
  assert.notEqual(colores[0], colores[1])
  assert.equal(respuestaVelocidadValida(ensayo, colores[0]), false)
  assert.equal(
    respuestaVelocidadValida(ensayo, colores.concat(colores[0]).join("|")),
    false,
  )
  assert.equal(
    respuestaVelocidadValida(ensayo, [colores[0], colores[0]].join("|")),
    false,
  )
  assert.equal(
    respuestaVelocidadValida(ensayo, `${colores[0]}|inventado`),
    false,
  )
  const entrada = responderPerfecto(instancia)
  entrada.answers[0].submittedAnswer = colores.slice().reverse().join("|")
  assert.equal(evaluarVelocidad(instancia, entrada).errors, 1)
  entrada.answers[0] = {
    trialId: ensayo.id,
    status: "timeout",
    submittedAnswer: null,
    responseTimeMs: instancia.config.timeoutMs,
    selectedAnswers: [colores[0]],
  }
  entrada.actualResponseTimeSeconds += instancia.config.timeoutMs / 1000 - 1
  const resultado = evaluarVelocidad(instancia, entrada)
  assert.equal(resultado.totalQuestions, instancia.trials.length)
  assert.equal(resultado.correctAnswers, instancia.trials.length - 1)
  assert.equal(resultado.errors, 1)
  assert.deepEqual(resultado.details.trialResults[0].selectedAnswers, [
    colores[0],
  ])
  assert.equal(resultado.details.selectionCount, 2)
  assert.equal(resultado.details.optionCount, 8)
  assert.throws(() =>
    evaluarVelocidad(instancia, {
      ...entrada,
      answers: [
        { ...entrada.answers[0], selectedAnswers: ["inventado"] },
        ...entrada.answers.slice(1),
      ],
    }),
  )
})

test("Una sesión antigua de colores mantiene una selección y sus tiempos originales", () => {
  const instancia = generarVelocidad("touchColor", "veryHard")
  instancia.config = {
    ...instancia.config,
    optionCount: 6,
    timeoutMs: 5000,
    expectedResponseMs: 2500,
    targetTimeSeconds: 35,
  }
  delete instancia.config.selectionCount
  instancia.trials = instancia.trials.map((ensayo) => {
    if (ensayo.kind !== "touchColor") throw new Error("Ensayo inesperado")
    const { requestedColors, ...anterior } = ensayo
    return {
      ...anterior,
      options: ensayo.options.filter(
        (color) => !["pink", "brown"].includes(color),
      ),
      requestedColor: "red",
      expectedAnswer: "red",
    }
  })
  assert.equal(
    evaluarVelocidad(instancia, responderPerfecto(instancia)).accuracy,
    100,
  )
  const ensayo = instancia.trials[0]
  if (ensayo.kind !== "touchColor") throw new Error("Ensayo inesperado")
  assert.deepEqual(coloresSolicitados(ensayo), ["red"])
  assert.equal(respuestaVelocidadValida(ensayo, "red|blue"), false)
})

test("Reacción: las señales incorrectas cuentan como errores y no como reacciones válidas", () => {
  const instancia = generarVelocidad("visualReaction", "veryHard")
  assert.ok(
    instancia.trials.every(
      (ensayo) =>
        ensayo.options.length === 4 &&
        ensayo.options.filter((opcion) => opcion === "react").length === 1,
    ),
  )
  const entrada = responderPerfecto(instancia)
  entrada.answers[0].submittedAnswer = instancia.trials[0].options.find(
    (opcion) => opcion !== "react",
  )!
  entrada.answers[0].responseTimeMs = 1
  entrada.actualResponseTimeSeconds -= 0.999
  const resultado = evaluarVelocidad(instancia, entrada)
  assert.equal(resultado.errors, 1)
  assert.equal(resultado.details.exerciseType, "visualReaction")
  if (resultado.details.exerciseType !== "visualReaction")
    throw new Error("Detalles inesperados")
  assert.equal(resultado.details.validReactions, instancia.trials.length - 1)
  assert.equal(resultado.details.fastestResponseTimeMs, 1000)
  assert.equal(resultado.details.medianResponseTimeMs, 1000)
  assert.ok(resultado.responseTimeEfficiency < 100)
})

test("Lenguaje Normal garantiza preguntas de contexto sin perder la mezcla de sinónimos y antónimos", () => {
  for (const tipo of tiposLenguaje.filter((tipo) => tipo !== "simpleCrossword"))
    for (let intento = 0; intento < 20; intento++) {
      const instancia = generarLenguaje(tipo, "normal")
      assert.ok(
        instancia.questions.some((pregunta) => pregunta.tier === "direct"),
      )
      assert.ok(
        instancia.questions.some((pregunta) => pregunta.tier === "contextual"),
      )
      if (tipo === "synonymsAntonyms") {
        assert.equal(
          instancia.questions.filter(
            (pregunta) => pregunta.relation === "synonym",
          ).length,
          5,
        )
        assert.equal(
          instancia.questions.filter(
            (pregunta) => pregunta.relation === "antonym",
          ).length,
          5,
        )
      }
    }
})

test("Checkpoint de colores: conserva una selección parcial, admite sesiones antiguas y rechaza valores ajenos a la ronda", () => {
  const ejercicio =
    obtenerEjercicioEstrategia("touchColor").generateExercise("veryHard")
  const instancia = ejercicio.payload as VelocidadInstancia
  const color = instancia.trials[0].options[0]
  const checkpoint = {
    version: 1,
    exerciseId: ejercicio.id,
    phase: "question",
    step: 0,
    activeSeconds: 1,
    state: {
      feedback: "",
      locked: false,
      pending: null,
      answers: [],
      waiting: 0,
      selectedColors: [color],
    },
  }
  assert.deepEqual(
    validarPuntoControl(ejercicio, checkpoint).state.selectedColors,
    [color],
  )
  const anterior = structuredClone(checkpoint)
  Reflect.deleteProperty(anterior.state, "selectedColors")
  assert.doesNotThrow(() => validarPuntoControl(ejercicio, anterior))
  for (const seleccion of [
    [color, color],
    ["inventado"],
    [color, instancia.trials[0].options[1], instancia.trials[0].options[2]],
  ])
    assert.throws(() =>
      validarPuntoControl(ejercicio, {
        ...checkpoint,
        state: { ...checkpoint.state, selectedColors: seleccion },
      }),
    )
})

test("Los nuevos niveles siguen produciendo resultados y progresión independientes por categoría", () => {
  for (const tipo of tiposVelocidad)
    for (const nivel of niveles) {
      const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(nivel)
      const instancia = ejercicio.payload as VelocidadInstancia
      const antes = {
        currentLevel: nivel,
        promotionStreak: 1,
        demotionStreak: 0,
      }
      const preparado = prepararSesionResultado(
        ejercicio,
        antes,
        responderPerfecto(instancia),
      )
      assert.equal(preparado.summary.accuracy, 100)
      assert.equal(preparado.nextProgress.cognitiveFunctionId, "speed")
      assert.equal(preparado.summary.metrics.performanceScore, 100)
      assert.equal(antes.currentLevel, nivel)
    }
})

test("Dos colores: rechaza tiempos nulos o inválidos aunque ambas selecciones sean correctas", () => {
  const instancia = generarVelocidad("touchColor", "veryHard")
  const entrada = responderPerfecto(instancia)
  for (const tiempo of [0, -1, NaN, Infinity, instancia.config.timeoutMs + 1])
    assert.throws(() =>
      evaluarVelocidad(instancia, {
        ...entrada,
        answers: [
          { ...entrada.answers[0], responseTimeMs: tiempo },
          ...entrada.answers.slice(1),
        ],
      }),
    )
})

test("Reacción: pulsar distractores en todas las rondas no genera latencias válidas ni eficiencia temporal", () => {
  const instancia = generarVelocidad("visualReaction", "hard")
  const entrada = responderPerfecto(instancia)
  entrada.answers.forEach((respuesta, indice) => {
    respuesta.submittedAnswer = instancia.trials[indice].options.find(
      (opcion) => opcion !== "react",
    )!
  })
  const resultado = evaluarVelocidad(instancia, entrada)
  assert.equal(resultado.accuracy, 0)
  assert.equal(resultado.responseTimeEfficiency, 0)
  if (resultado.details.exerciseType !== "visualReaction")
    throw new Error("Detalles inesperados")
  assert.equal(resultado.details.validReactions, 0)
  assert.equal(resultado.details.fastestResponseTimeMs, null)
  assert.equal(resultado.details.medianResponseTimeMs, null)
  assert.equal(resultado.details.averageResponseTimeMs, null)
})
