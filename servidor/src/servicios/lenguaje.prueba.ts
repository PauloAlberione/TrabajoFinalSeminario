import test from "node:test"
import assert from "node:assert/strict"
import {
  generarLenguaje,
  evaluarLenguaje,
  evaluarCrucigramaPalabra,
  tiposLenguaje,
  lenguajeConfiguraciones,
  type LenguajeInstancia,
  type LenguajeRespuesta,
} from "../../../compartido/lenguaje"
import {
  crucigramaCrucigramas,
  normalizarRespuesta,
  validarCrucigrama,
} from "../../../compartido/crucigramasLenguaje"
import {
  asociaciones,
  frases,
  sinonimoAntonimoPreguntas,
} from "../../../compartido/lenguajeContenido"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"
import type { Nivel } from "../../../compartido/memoria"

function respuesta(instancia: LenguajeInstancia): LenguajeRespuesta {
  const tiempo = instancia.config.questionCount * 2
  return {
    actualResponseTimeSeconds: tiempo,
    answers: instancia.questions.map((pregunta) => ({
      questionId: pregunta.id,
      answer: pregunta.answer,
      responseTimeSeconds: 2,
    })),
    words:
      instancia.puzzle?.words.map((palabra) => ({
        wordId: palabra.id,
        attempts: [palabra.answer],
      })) ?? [],
  }
}

const esperadoTiempos = {
  wordAssociation: [70, 85, 105, 125],
  simpleCrossword: [180, 240, 300, 360],
  completeSentence: [75, 90, 110, 130],
  synonymsAntonyms: [65, 80, 100, 120],
}

for (const tipo of tiposLenguaje)
  test(`${tipo}: all levels, bounded sampling, valid options and normalized accuracy`, () => {
    const niveles: Nivel[] = ["easy", "normal", "hard", "veryHard"]
    niveles.forEach((nivel, indice) => {
      const instancia = generarLenguaje(tipo, nivel)
      assert.equal(
        instancia.config.targetTimeSeconds,
        esperadoTiempos[tipo][indice],
      )
      assert.equal(
        instancia.config.questionCount,
        tipo === "simpleCrossword" ? indice + 4 : 8 + indice * 2,
      )
      if (tipo === "simpleCrossword") {
        assert.equal(
          instancia.puzzle!.words.length,
          instancia.config.questionCount,
        )
        assert.equal(validarCrucigrama(instancia.puzzle!), true)
      } else {
        assert.equal(
          new Set(instancia.questions.map((pregunta) => pregunta.id)).size,
          instancia.config.questionCount,
        )
        assert.equal(instancia.config.optionCount, indice < 2 ? 4 : indice + 3)
        instancia.questions.forEach((pregunta) => {
          assert.equal(pregunta.options.length, instancia.config.optionCount)
          assert.equal(new Set(pregunta.options).size, pregunta.options.length)
          assert.equal(
            pregunta.options.filter((opcion) => opcion === pregunta.answer)
              .length,
            1,
          )
        })
        if (tipo === "synonymsAntonyms") {
          assert.equal(
            instancia.questions.filter(
              (pregunta) => pregunta.relation === "synonym",
            ).length,
            instancia.config.questionCount / 2,
          )
          assert.equal(
            instancia.questions.filter(
              (pregunta) => pregunta.relation === "antonym",
            ).length,
            instancia.config.questionCount / 2,
          )
        }
      }
      const resultado = evaluarLenguaje(instancia, respuesta(instancia))
      assert.equal(resultado.accuracy, 100)
      assert.equal(resultado.errors, 0)
      assert.equal(resultado.details.exerciseType, tipo)
    })
  })

test("Los bancos de preguntas contienen preguntas únicas y opciones distintas", () => {
  for (const banco of [asociaciones, frases, sinonimoAntonimoPreguntas]) {
    assert.equal(
      new Set(banco.map((pregunta) => pregunta.id)).size,
      banco.length,
    )
    for (const pregunta of banco) {
      assert.ok(pregunta.prompt)
      assert.equal(
        new Set(
          [pregunta.answer, ...pregunta.distractors].map(normalizarRespuesta),
        ).size,
        pregunta.distractors.length + 1,
      )
    }
  }
})

test("Las ocho plantillas de crucigramas tienen cruces correctos, coordenadas acotadas y cantidades previstas", () => {
  for (const [nivel, crucigramas] of Object.entries(crucigramaCrucigramas)) {
    assert.ok(crucigramas.length >= 2)
    for (const crucigrama of crucigramas) {
      assert.equal(validarCrucigrama(crucigrama), true)
      assert.equal(
        crucigrama.words.length,
        lenguajeConfiguraciones.simpleCrossword[(nivel as Nivel)].questionCount,
      )
    }
  }
  assert.equal(normalizarRespuesta("  ÁrBoL "), "ARBOL")
  const invalido = structuredClone(crucigramaCrucigramas.easy[0])
  invalido.words[0].row = 99
  assert.throws(() => validarCrucigrama(invalido))
})

test("Los reintentos y revelaciones del crucigrama afectan la precisión del primer intento", () => {
  const instancia = generarLenguaje("simpleCrossword", "easy")
  const entrada = respuesta(instancia)
  entrada.words[0].attempts = ["ZZZZ", instancia.puzzle!.words[0].answer]
  entrada.words[1].attempts = ["ZZZZ", "YYYY", "XXXX"]
  const resultado = evaluarLenguaje(instancia, entrada)
  assert.equal(resultado.correctAnswers, 2)
  assert.equal(resultado.errors, 2)
  assert.equal(resultado.accuracy, 50)
  assert.equal(resultado.details.exerciseType, "simpleCrossword")
  if (resultado.details.exerciseType === "simpleCrossword") {
    assert.equal(resultado.details.solvedWords, 3)
    assert.equal(resultado.details.revealedWords, 1)
    assert.equal(resultado.details.incorrectAttempts, 4)
  }
  assert.throws(() => evaluarCrucigramaPalabra("casa", ["CASA", "CASA"]))
  assert.throws(() => evaluarCrucigramaPalabra("casa", ["ZZZ"]))
  assert.throws(() => evaluarCrucigramaPalabra("casa", ["Z", "Z", "Z", "Z"]))
  assert.equal(
    evaluarCrucigramaPalabra("árbol", ["ARBOL"]).firstAttemptCorrect,
    true,
  )
})

test("Los juegos de opciones rechazan respuestas repetidas, ausentes o inválidas y tiempos inconsistentes", () => {
  for (const tipo of [
    "wordAssociation",
    "completeSentence",
    "synonymsAntonyms",
  ] as const) {
    const instancia = generarLenguaje(tipo, "easy")
    const entrada = respuesta(instancia)
    entrada.answers[0].answer = instancia.questions[0].options.find(
      (opcion) => opcion !== instancia.questions[0].answer,
    )!
    assert.equal(evaluarLenguaje(instancia, entrada).accuracy, 87.5)
    assert.throws(() =>
      evaluarLenguaje(instancia, {
        ...entrada,
        answers: entrada.answers.slice(1),
      }),
    )
    assert.throws(() =>
      evaluarLenguaje(instancia, {
        ...entrada,
        actualResponseTimeSeconds: Infinity,
      }),
    )
    assert.throws(() =>
      evaluarLenguaje(instancia, {
        ...entrada,
        actualResponseTimeSeconds: 10000,
      }),
    )
    assert.throws(() =>
      evaluarLenguaje(instancia, {
        ...entrada,
        answers: entrada.answers.map(() => entrada.answers[0]),
      }),
    )
  }
})

test("Lenguaje asciende entre juegos y cambia la siguiente estrategia sin afectar Memoria", () => {
  const memoria = {
    currentLevel: "hard" as Nivel,
    promotionStreak: 1,
    demotionStreak: 0,
    totalExercises: 12,
  }
  const original = structuredClone(memoria)
  const primero =
    obtenerEjercicioEstrategia("wordAssociation").generateExercise("easy")
  const primeroResultado = prepararSesionResultado(
    primero,
    {},
    respuesta(primero.payload as LenguajeInstancia),
  )
  assert.equal(primeroResultado.nextProgress.promotionStreak, 1)
  assert.equal(primeroResultado.nextProgress.cognitiveFunctionId, "language")
  const segundo = obtenerEjercicioEstrategia(
    "completeSentence",
  ).generateExercise(primeroResultado.nextProgress.currentLevel)
  const segundoResultado = prepararSesionResultado(
    segundo,
    primeroResultado.nextProgress,
    respuesta(segundo.payload as LenguajeInstancia),
  )
  assert.equal(segundoResultado.nextProgress.currentLevel, "normal")
  const tercero = obtenerEjercicioEstrategia(
    "synonymsAntonyms",
  ).generateExercise(segundoResultado.nextProgress.currentLevel)
  assert.equal((tercero.payload as LenguajeInstancia).config.questionCount, 10)
  assert.deepEqual(memoria, original)
})

test("Dos resultados bajos de Lenguaje descienden entre juegos", () => {
  let estado = {
    currentLevel: "normal" as Nivel,
    promotionStreak: 0,
    demotionStreak: 0,
  }
  for (const tipo of ["wordAssociation", "completeSentence"] as const) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(
      estado.currentLevel,
    )
    const instancia = ejercicio.payload as LenguajeInstancia
    const entrada = respuesta(instancia)
    entrada.answers = entrada.answers.map((respuesta, indice) => ({
      ...respuesta,
      answer: instancia.questions[indice].options.find(
        (opcion) => opcion !== instancia.questions[indice].answer,
      )!,
    }))
    estado = prepararSesionResultado(ejercicio, estado, entrada).nextProgress
  }
  assert.equal(estado.currentLevel, "easy")
  assert.equal(estado.demotionStreak, 0)
})
