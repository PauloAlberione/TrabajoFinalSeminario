import test from "node:test"
import assert from "node:assert/strict"
import {
  tiposAtencion,
  atencionConfiguraciones,
  generarAtencion,
  evaluarAtencion,
  visualClave,
  seguimientoPosicion,
  type AtencionInstancia,
  type EntregaAtencion,
} from "../../../compartido/atencionReconocimiento"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"
import type { Nivel } from "../../../compartido/memoria"

const niveles: Nivel[] = ["easy", "normal", "hard", "veryHard"]

function respuesta(instancia: AtencionInstancia): EntregaAtencion {
  return {
    actualResponseTimeSeconds: instancia.rounds.length,
    answers: instancia.rounds.map((ronda) => ({
      roundId: ronda.id,
      responseTimeSeconds: 1,
      selection:
        "objects" in ronda
          ? ronda.targetId
          : "correctAnswer" in ronda
            ? visualClave(ronda.correctAnswer)
            : instancia.type === "hiddenFigure"
              ? [ronda.targetIndices[0]]
              : ronda.targetIndices,
    })),
  }
}

const cantidades = {
  identifyElements: [5, 6, 7, 8],
  followObject: [5, 6, 7, 8],
  recognizePattern: [8, 10, 12, 14],
  hiddenFigure: [6, 7, 8, 9],
}
const objetivos = {
  identifyElements: [70, 90, 120, 150],
  followObject: [30, 38, 48, 58],
  recognizePattern: [70, 88, 110, 130],
  hiddenFigure: [70, 90, 115, 140],
}

for (const tipo of tiposAtencion)
  test(`${tipo}: exact configurations, generation and normalized perfect results at all levels`, () => {
    niveles.forEach((nivel, indice) => {
      const instancia = generarAtencion(tipo, nivel)
      assert.equal(instancia.rounds.length, cantidades[tipo][indice])
      assert.equal(instancia.config.targetTimeSeconds, objetivos[tipo][indice])
      const resultado = evaluarAtencion(instancia, respuesta(instancia))
      assert.equal(resultado.accuracy, 100)
      assert.equal(resultado.errors, 0)
      assert.equal(resultado.details.exerciseType, tipo)
      assert.equal(
        obtenerEjercicioEstrategia(tipo).cognitiveFunctionId,
        "attentionRecognition",
      )
    })
  })

test("La búsqueda contiene cantidades exactas de objetivos, distractores claros y formas distinguibles", () => {
  for (const nivel of niveles)
    for (const tipo of ["identifyElements", "hiddenFigure"] as const)
      for (let muestra = 0; muestra < 20; muestra++) {
        const instancia = generarAtencion(tipo, nivel)
        if (instancia.type !== tipo || !("items" in instancia.rounds[0]))
          throw new Error("Wrong type")
        for (const ronda of instancia.rounds) {
          if (!("items" in ronda)) throw new Error("Wrong round")
          assert.equal(ronda.items.length, instancia.config.elementCount)
          assert.equal(ronda.targetIndices.length, instancia.config.targetCount)
          assert.equal(
            ronda.items.filter(
              (elemento) => visualClave(elemento) === visualClave(ronda.target),
            ).length,
            instancia.config.targetCount,
          )
          for (const elemento of ronda.items)
            if (visualClave(elemento) !== visualClave(ronda.target)) {
              if (nivel === "easy")
                assert.notEqual(elemento.shape, ronda.target.shape)
              if (nivel === "veryHard")
                assert.equal(elemento.shape, ronda.target.shape)
            }
        }
      }
})

test("Identificar incluye omisiones y falsos positivos en el denominador de precisión", () => {
  const instancia = generarAtencion("identifyElements", "easy"),
    entrada = respuesta(instancia)
  const ronda = instancia.rounds[0]
  if (!("targetIndices" in ronda)) throw new Error("Wrong round")
  const incorrecto = ronda.items.findIndex(
    (_, indice) => !ronda.targetIndices.includes(indice),
  )
  entrada.answers[0].selection = [ronda.targetIndices[0], incorrecto]
  const resultado = evaluarAtencion(instancia, entrada)
  assert.equal(resultado.correctAnswers, 9)
  assert.equal(resultado.errors, 2)
  assert.equal(resultado.accuracy, (9 / 11) * 100)
  if (resultado.details.exerciseType !== "identifyElements")
    throw new Error("Wrong details")
  assert.equal(resultado.details.missedTargets, 1)
  assert.equal(resultado.details.falsePositiveSelections, 1)
  assert.equal(resultado.details.perfectRounds, 4)
  entrada.answers = entrada.answers.map((respuesta) => ({
    ...respuesta,
    selection: [],
  }))
  assert.equal(evaluarAtencion(instancia, entrada).accuracy, 0)
})

test("Las trayectorias de seguimiento son continuas, acotadas y conservan la identidad del objetivo", () => {
  for (const nivel of niveles) {
    const instancia = generarAtencion("followObject", nivel)
    if (instancia.type !== "followObject") throw new Error("Wrong type")
    assert.equal(instancia.config.elementCount, niveles.indexOf(nivel) + 3)
    for (const ronda of instancia.rounds) {
      assert.equal(ronda.objects.length, instancia.config.elementCount)
      assert.equal(
        ronda.objects.filter((objeto) => objeto.id === ronda.targetId).length,
        1,
      )
      const final = ronda.objects.map((objeto) => objeto.waypoints.at(-1)!)
      assert.equal(
        new Set(final.map((punto) => `${punto.x}:${punto.y}`)).size,
        ronda.objects.length,
      )
      for (const objeto of ronda.objects) {
        assert.equal(
          objeto.waypoints.length,
          instancia.config.movementComplexity + 1,
        )
        for (let paso = 0; paso <= 100; paso++) {
          const punto = seguimientoPosicion(objeto, paso / 100)
          assert.ok(
            punto.x >= 15 && punto.x <= 85 && punto.y >= 25 && punto.y <= 75,
          )
        }
        assert.deepEqual(seguimientoPosicion(objeto, 0), objeto.waypoints[0])
        assert.deepEqual(
          seguimientoPosicion(objeto, 1),
          objeto.waypoints.at(-1),
        )
      }
    }
    const resultado = evaluarAtencion(instancia, respuesta(instancia))
    assert.equal(resultado.actualResponseTimeSeconds, instancia.rounds.length)
    assert.ok(
      instancia.config.previewSeconds + instancia.config.movementSeconds > 0,
    )
  }
})

test("Los patrones visuales siguen ciclos explícitos y ofrecen una única respuesta correcta", () => {
  for (const nivel of niveles)
    for (let muestra = 0; muestra < 20; muestra++) {
      const instancia = generarAtencion("recognizePattern", nivel)
      if (instancia.type !== "recognizePattern") throw new Error("Wrong type")
      for (const ronda of instancia.rounds) {
        assert.ok(instancia.config.patterns.includes(ronda.patternType))
        ronda.sequence.forEach((elemento, indice) =>
          assert.equal(
            visualClave(elemento),
            visualClave(ronda.cycle[indice % ronda.cycle.length]),
          ),
        )
        assert.equal(
          visualClave(ronda.correctAnswer),
          visualClave(ronda.sequence[ronda.missingIndex]),
        )
        assert.equal(ronda.options.length, instancia.config.optionCount)
        assert.equal(
          new Set(ronda.options.map(visualClave)).size,
          ronda.options.length,
        )
        assert.equal(
          ronda.options.filter(
            (elemento) =>
              visualClave(elemento) === visualClave(ronda.correctAnswer),
          ).length,
          1,
        )
      }
    }
})

test("La figura oculta limita intentos, revela tras tres errores y adapta según el primer intento", () => {
  const instancia = generarAtencion("hiddenFigure", "easy"),
    entrada = respuesta(instancia)
  const primero = instancia.rounds[0],
    segundo = instancia.rounds[1]
  if (!("items" in primero) || !("items" in segundo))
    throw new Error("Wrong rounds")
  entrada.answers[0].selection = [
    primero.items.findIndex(
      (_, indice) => !primero.targetIndices.includes(indice),
    ),
    primero.targetIndices[0],
  ]
  entrada.answers[1].selection = segundo.items
    .flatMap((_, indice) =>
      !segundo.targetIndices.includes(indice) ? [indice] : [],
    )
    .slice(0, 3)
  const resultado = evaluarAtencion(instancia, entrada)
  assert.equal(resultado.accuracy, (4 / 6) * 100)
  if (resultado.details.exerciseType !== "hiddenFigure")
    throw new Error("Wrong details")
  assert.equal(resultado.details.figuresFound, 5)
  assert.equal(resultado.details.firstAttemptCorrect, 4)
  assert.equal(resultado.details.wrongAttempts, 4)
  assert.equal(resultado.details.revealedRounds, 1)
  for (const seleccion of [
    [],
    [primero.targetIndices[0], 1],
    [1, 1, 1],
    [0, 1, 2, 3],
  ])
    assert.throws(() =>
      evaluarAtencion(instancia, {
        ...entrada,
        answers: [
          { ...entrada.answers[0], selection: seleccion },
          ...entrada.answers.slice(1),
        ],
      }),
    )
})

test("La validación rechaza respuestas incompletas y tiempos activos nulos", () => {
  for (const tipo of tiposAtencion) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise("easy"),
      instancia = ejercicio.payload as AtencionInstancia,
      entrada = respuesta(instancia)
    for (const tiempo of [-1, NaN, Infinity, 10000])
      assert.throws(() =>
        evaluarAtencion(instancia, {
          ...entrada,
          actualResponseTimeSeconds: tiempo,
        }),
      )
    for (const respuestas of [
      [],
      entrada.answers.slice(1),
      entrada.answers.map(() => entrada.answers[0]),
      [null, ...entrada.answers.slice(1)],
    ])
      assert.throws(() =>
        evaluarAtencion(instancia, { ...entrada, answers: respuestas }),
      )
    for (const seleccion of [null, 1, [999], {}])
      assert.throws(() =>
        evaluarAtencion(instancia, {
          ...entrada,
          answers: [
            { ...entrada.answers[0], selection: seleccion },
            ...entrada.answers.slice(1),
          ],
        }),
      )
    const cero = {
      ...entrada,
      actualResponseTimeSeconds: 0,
      answers: entrada.answers.map((respuesta) => ({
        ...respuesta,
        responseTimeSeconds: 0,
      })),
    }
    assert.throws(() => prepararSesionResultado(ejercicio, {}, cero))
  }
})

test("Identificar y Patrones comparten ascenso; Figura oculta usa Normal y dos resultados bajos descienden", () => {
  let estado = {
    currentLevel: "easy" as Nivel,
    promotionStreak: 0,
    demotionStreak: 0,
  }
  for (const tipo of ["identifyElements", "recognizePattern"] as const) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(
      estado.currentLevel,
    )
    estado = prepararSesionResultado(
      ejercicio,
      estado,
      respuesta(ejercicio.payload as AtencionInstancia),
    ).nextProgress
  }
  assert.equal(estado.currentLevel, "normal")
  assert.deepEqual(
    (obtenerEjercicioEstrategia("hiddenFigure").generateExercise(
      estado.currentLevel,
    ).payload as AtencionInstancia).config,
    atencionConfiguraciones.hiddenFigure.normal,
  )
  for (const tipo of ["identifyElements", "hiddenFigure"] as const) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(
        estado.currentLevel,
      ),
      instancia = ejercicio.payload as AtencionInstancia,
      entrada = respuesta(instancia)
    entrada.answers = entrada.answers.map((respuesta, indice) => {
      const ronda = instancia.rounds[indice]
      if (!("items" in ronda)) throw new Error("Wrong round")
      return {
        ...respuesta,
        selection:
          tipo === "identifyElements"
            ? []
            : ronda.items
                .flatMap((_, posicion) =>
                  !ronda.targetIndices.includes(posicion) ? [posicion] : [],
                )
                .slice(0, 3),
      }
    })
    estado = prepararSesionResultado(ejercicio, estado, entrada).nextProgress
  }
  assert.equal(estado.currentLevel, "easy")
  assert.equal(estado.demotionStreak, 0)
})
