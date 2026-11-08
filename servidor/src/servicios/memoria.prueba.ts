import test from "node:test"
import assert from "node:assert/strict"
import {
  configuraciones,
  generarMemoria,
  evaluarMemoria,
  precision,
  tiposMemoria,
  type InstanciaMemoria,
  type RespuestaMemoria,
  type Nivel,
} from "../../../compartido/memoria"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"

export function perfectoRespuesta(
  instancia: InstanciaMemoria,
): RespuestaMemoria {
  const respuestas =
    instancia.type === "imagePairs"
      ? instancia.rounds[0].target.map((elemento) =>
          instancia.rounds[0].options.flatMap((valor, indice) =>
            valor === elemento ? [String(indice)] : [],
          ),
        )
      : instancia.rounds.map((ronda) => [...ronda.target])
  return { answers: respuestas, actualResponseTimeSeconds: 10 }
}

const esperado = {
  imagePairs: [
    [1, 4, 45, 0],
    [1, 6, 70, 0],
    [1, 8, 95, 0],
    [1, 10, 125, 0],
  ],
  colorSequence: [
    [4, 3, 35, 900],
    [4, 4, 40, 800],
    [5, 5, 55, 700],
    [5, 6, 60, 600],
  ],
  wordList: [
    [3, 4, 45, 12000],
    [3, 5, 50, 10000],
    [4, 6, 65, 9000],
    [4, 8, 80, 8000],
  ],
  rememberOrder: [
    [4, 3, 40, 8000],
    [4, 4, 50, 7000],
    [5, 5, 70, 6000],
    [5, 6, 85, 5000],
  ],
}

for (const tipo of tiposMemoria) {
  test(`${tipo}: all difficulty configurations, generation and perfect accuracy`, () => {
    const niveles: Nivel[] = ["easy", "normal", "hard", "veryHard"]
    niveles.forEach((nivel, indice) => {
      const instancia = generarMemoria(tipo, nivel)
      const configuracion = configuraciones[tipo][nivel]
      assert.deepEqual(
        [
          configuracion.rounds,
          configuracion.size,
          configuracion.targetTimeSeconds,
          configuracion.presentationMs,
        ],
        esperado[tipo][indice],
      )
      assert.equal(instancia.rounds.length, configuracion.rounds)
      for (const ronda of instancia.rounds) {
        assert.equal(ronda.target.length, configuracion.size)
        if (tipo === "imagePairs") {
          assert.equal(ronda.options.length, configuracion.size * 2)
          ronda.target.forEach((elemento) =>
            assert.equal(
              ronda.options.filter((valor) => valor === elemento).length,
              2,
            ),
          )
        }
        if (tipo === "colorSequence") {
          assert.equal(ronda.options.length, configuracion.paletteSize)
          assert.ok(
            ronda.target.every((elemento) => ronda.options.includes(elemento)),
          )
        }
        if (tipo === "wordList") {
          assert.equal(
            ronda.options.length,
            configuracion.size + configuracion.distractors,
          )
          assert.equal(new Set(ronda.options).size, ronda.options.length)
          assert.ok(
            ronda.target.every((elemento) => ronda.options.includes(elemento)),
          )
        }
        if (tipo === "rememberOrder")
          assert.deepEqual([...ronda.options].sort(), [...ronda.target].sort())
      }
      const resultado = evaluarMemoria(instancia, perfectoRespuesta(instancia))
      assert.equal(resultado.accuracy, 100)
      assert.equal(resultado.errors, 0)
      assert.equal(resultado.actualTimeSeconds, 10)
      assert.equal(resultado.targetTimeSeconds, configuracion.targetTimeSeconds)
      assert.equal(resultado.details.exerciseType, tipo)
    })
  })
}

test("Las parejas de imágenes penalizan errores y rechazan coincidencias repetidas y rondas incompletas", () => {
  const instancia = generarMemoria("imagePairs", "easy")
  const respuesta = perfectoRespuesta(instancia)
  const tarjetas = instancia.rounds[0].options
  const otro = tarjetas.findIndex((valor) => valor !== tarjetas[0])
  respuesta.answers.unshift(["0", String(otro)])
  const resultado = evaluarMemoria(instancia, respuesta)
  assert.equal(resultado.accuracy, 80)
  assert.equal(resultado.errors, 1)
  assert.equal(resultado.correctAnswers, 4)
  assert.throws(() =>
    evaluarMemoria(instancia, {
      ...respuesta,
      answers: respuesta.answers.slice(0, -1),
    }),
  )
  assert.throws(() =>
    evaluarMemoria(instancia, {
      ...respuesta,
      answers: [...respuesta.answers, respuesta.answers[1]],
    }),
  )
  assert.throws(() =>
    evaluarMemoria(instancia, {
      ...respuesta,
      answers: [["0", "00"], ...respuesta.answers.slice(1)],
    }),
  )
  assert.equal(precision(0, 0), 0)
})

test("Secuencia y orden evalúan posiciones en lugar de presencia", () => {
  for (const tipo of ["colorSequence", "rememberOrder"] as const) {
    const instancia = generarMemoria(tipo, "easy")
    instancia.rounds.forEach((ronda) => {
      ronda.target = ronda.options.slice(0, 3)
    })
    const respuesta = perfectoRespuesta(instancia)
    respuesta.answers = respuesta.answers.map((respuesta) => [
      respuesta[1],
      respuesta[0],
      respuesta[2],
    ])
    const resultado = evaluarMemoria(instancia, respuesta)
    assert.equal(resultado.correctAnswers, 4)
    assert.equal(resultado.errors, 8)
    assert.ok(Math.abs(resultado.accuracy - 100 / 3) < 1e-10)
    if (
      resultado.details.exerciseType !== "imagePairs" &&
      resultado.details.exerciseType !== "wordList"
    )
      assert.equal(resultado.details.perfectRounds, 0)
  }
})

test("La lista de palabras cuenta una omisión por selección incorrecta y rechaza conteos inválidos", () => {
  const instancia = generarMemoria("wordList", "easy")
  const respuesta = perfectoRespuesta(instancia)
  respuesta.answers[0][0] = instancia.rounds[0].options.find(
    (elemento) => !instancia.rounds[0].target.includes(elemento),
  )!
  const resultado = evaluarMemoria(instancia, respuesta)
  assert.equal(resultado.correctAnswers, 11)
  assert.equal(resultado.errors, 1)
  assert.throws(() =>
    evaluarMemoria(instancia, {
      ...respuesta,
      answers: respuesta.answers.slice(1),
    }),
  )
  respuesta.answers[0][1] = respuesta.answers[0][0]
  assert.throws(() => evaluarMemoria(instancia, respuesta))
})

test("La validación rechaza entradas inválidas y tiempos negativos o no finitos", () => {
  for (const tipo of tiposMemoria) {
    const instancia = generarMemoria(tipo, "easy")
    for (const respuesta of [
      null,
      {},
      { answers: [], actualResponseTimeSeconds: -1 },
      { answers: [], actualResponseTimeSeconds: Infinity },
      { answers: [["unknown"]], actualResponseTimeSeconds: 3 },
    ])
      assert.throws(() => evaluarMemoria(instancia, respuesta))
  }
})

test("El ascenso de Memoria se comparte entre juegos y modifica la siguiente configuración", () => {
  const parejas =
    obtenerEjercicioEstrategia("imagePairs").generateExercise("easy")
  const primero = prepararSesionResultado(
    parejas,
    {},
    perfectoRespuesta(parejas.payload as InstanciaMemoria),
  )
  assert.equal(primero.nextProgress.promotionStreak, 1)
  const colores = obtenerEjercicioEstrategia("colorSequence").generateExercise(
    primero.nextProgress.currentLevel,
  )
  const segundo = prepararSesionResultado(
    colores,
    primero.nextProgress,
    perfectoRespuesta(colores.payload as InstanciaMemoria),
  )
  assert.equal(segundo.nextProgress.currentLevel, "normal")
  assert.equal(segundo.nextProgress.promotionStreak, 0)
  const palabras = obtenerEjercicioEstrategia("wordList").generateExercise(
    segundo.nextProgress.currentLevel,
  )
  assert.equal((palabras.payload as InstanciaMemoria).config.size, 5)
  assert.equal(
    (palabras.payload as InstanciaMemoria).config.presentationMs,
    10000,
  )
})

test("Dos resultados bajos de Memoria descienden entre juegos y reinician las rachas", () => {
  let progreso = {
    currentLevel: "normal" as Nivel,
    promotionStreak: 0,
    demotionStreak: 0,
  }
  for (const tipo of ["colorSequence", "rememberOrder"] as const) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(
      progreso.currentLevel,
    )
    const instancia = ejercicio.payload as InstanciaMemoria
    const respuesta = perfectoRespuesta(instancia)
    respuesta.actualResponseTimeSeconds = 10000
    respuesta.answers = instancia.rounds.map((ronda) =>
      tipo === "colorSequence"
        ? ronda.target.map(
            (valor) =>
              ronda.options[
                (ronda.options.indexOf(valor) + 1) % ronda.options.length
              ],
          )
        : [...ronda.target.slice(1), ronda.target[0]],
    )
    const preparado = prepararSesionResultado(ejercicio, progreso, respuesta)
    progreso = preparado.nextProgress
  }
  assert.equal(progreso.currentLevel, "easy")
  assert.equal(progreso.demotionStreak, 0)
})
