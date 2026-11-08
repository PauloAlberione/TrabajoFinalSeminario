import test from "node:test"
import assert from "node:assert/strict"
import {
  tiposCalculo,
  calculoConfiguraciones,
  generarCalculo,
  evaluarCalculo,
  interpretarNumericoRespuesta,
  type CalculoInstancia,
  type EntregaCalculo,
} from "../../../compartido/calculo"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"
import type { Nivel } from "../../../compartido/memoria"

const niveles: Nivel[] = ["easy", "normal", "hard", "veryHard"]
const objetivos = {
  mentalCalculation: [80, 105, 135, 165],
  numberSequence: [80, 105, 135, 165],
  orderNumbers: [75, 95, 125, 150],
  subtractionDifference: [75, 95, 120, 145],
}

export function perfectoCalculoRespuesta(
  instancia: CalculoInstancia,
): EntregaCalculo {
  return {
    actualResponseTimeSeconds: instancia.questions.length * 2,
    answers: instancia.questions.map((pregunta) => ({
      questionId: pregunta.id,
      answer: "expected" in pregunta ? pregunta.expected : pregunta.answer,
      responseTimeSeconds: 2,
    })),
  }
}

for (const tipo of tiposCalculo)
  test(`${tipo}: all configurations generate complete exercises and evaluate correct responses`, () => {
    niveles.forEach((nivel, indice) => {
      const instancia = generarCalculo(tipo, nivel)
      assert.equal(instancia.config.targetTimeSeconds, objetivos[tipo][indice])
      assert.equal(
        instancia.questions.length,
        tipo === "orderNumbers" ? [5, 5, 6, 6][indice] : 8 + indice * 2,
      )
      assert.equal(
        new Set(instancia.questions.map((pregunta) => pregunta.id)).size,
        instancia.questions.length,
      )
      const evaluacion = evaluarCalculo(
        instancia,
        perfectoCalculoRespuesta(instancia),
      )
      assert.equal(evaluacion.accuracy, 100)
      assert.equal(evaluacion.errors, 0)
      assert.equal(evaluacion.details.exerciseType, tipo)
      assert.equal(
        obtenerEjercicioEstrategia(tipo).cognitiveFunctionId,
        "calculation",
      )
    })
  })

test("La generación aritmética respeta operaciones, rangos, división exacta y resultados de dos pasos", () => {
  for (const nivel of niveles)
    for (let muestra = 0; muestra < 40; muestra++) {
      const instancia = generarCalculo("mentalCalculation", nivel)
      assert.equal(instancia.type, "mentalCalculation")
      if (instancia.type !== "mentalCalculation") continue
      for (const pregunta of instancia.questions) {
        const [izquierda, derecha, final] = pregunta.operands
        assert.ok(instancia.config.operations.includes(pregunta.operation))
        let respuesta = 0
        switch (pregunta.operation) {
          case "addition":
            respuesta = izquierda + derecha
            break
          case "subtraction":
            respuesta = izquierda - derecha
            assert.ok(respuesta >= 0)
            break
          case "multiplication":
            respuesta = izquierda * derecha
            assert.ok(
              izquierda >= 2 && izquierda <= instancia.config.factorMaximum,
            )
            break
          case "division":
            assert.ok(derecha > 0)
            assert.equal(izquierda % derecha, 0)
            respuesta = izquierda / derecha
            break
        }
        if (
          pregunta.operation === "addition" ||
          pregunta.operation === "subtraction"
        )
          for (const operando of [izquierda, derecha])
            assert.ok(
              operando >= instancia.config.minimum &&
                operando <= instancia.config.maximum,
            )
        else
          assert.ok(derecha >= 2 && derecha <= instancia.config.factorMaximum)
        if (pregunta.secondOperation) {
          assert.equal(nivel, "veryHard")
          assert.ok(pregunta.prompt.startsWith("("))
          respuesta += final
        }
        assert.equal(pregunta.answer, respuesta)
        assert.ok(Number.isSafeInteger(respuesta))
      }
      if (nivel === "veryHard")
        assert.ok(
          instancia.questions.some((pregunta) => pregunta.secondOperation),
        )
    }
})

test("Las secuencias tienen reglas, posiciones faltantes y opciones únicas matemáticamente válidas", () => {
  for (const nivel of niveles)
    for (let muestra = 0; muestra < 40; muestra++) {
      const instancia = generarCalculo("numberSequence", nivel)
      if (instancia.type !== "numberSequence") throw new Error("Wrong type")
      for (const pregunta of instancia.questions) {
        const { rule: regla, values: valores } = pregunta
        assert.ok(instancia.config.patterns.includes(regla.pattern))
        assert.ok(instancia.config.lengths.includes(valores.length))
        assert.equal(valores[0], regla.start)
        for (let indice = 1; indice < valores.length; indice++) {
          const anterior = valores[indice - 1]
          switch (regla.pattern) {
            case "constantAdd":
              assert.equal(valores[indice] - anterior, regla.step)
              break
            case "constantSubtract":
              assert.equal(anterior - valores[indice], regla.step)
              break
            case "multiply":
              assert.equal(valores[indice] / anterior, regla.step)
              break
            case "alternating":
              assert.equal(
                valores[indice] - anterior,
                indice % 2 ? regla.step : regla.alternateStep,
              )
              break
            case "increasingDifference":
              assert.equal(valores[indice] - anterior, regla.step + indice - 1)
              break
            case "mixed":
              assert.equal(
                valores[indice],
                indice % 2 ? anterior * 2 : anterior + regla.alternateStep,
              )
              break
          }
        }
        assert.equal(pregunta.answer, valores[pregunta.missingIndex])
        assert.equal(pregunta.options.length, instancia.config.optionCount)
        assert.equal(new Set(pregunta.options).size, pregunta.options.length)
        assert.equal(
          pregunta.options.filter((valor) => valor === pregunta.answer).length,
          1,
        )
        assert.ok(pregunta.options.every((valor) => valor >= 0))
        if (nivel === "easy")
          assert.equal(pregunta.missingIndex, valores.length - 1)
      }
    }
})

test("Ordenar usa números únicos, direcciones equilibradas y valores negativos solo en veryHard", () => {
  for (const nivel of niveles)
    for (let muestra = 0; muestra < 40; muestra++) {
      const instancia = generarCalculo("orderNumbers", nivel)
      if (instancia.type !== "orderNumbers") throw new Error("Wrong type")
      assert.equal(
        instancia.questions.filter((ronda) => ronda.direction === "descending")
          .length,
        instancia.config.descendingRounds,
      )
      for (const ronda of instancia.questions) {
        assert.equal(ronda.values.length, instancia.config.numbersPerRound)
        assert.equal(new Set(ronda.values).size, ronda.values.length)
        assert.ok(
          ronda.values.every(
            (valor) =>
              valor >= instancia.config.minimum &&
              valor <= instancia.config.maximum,
          ),
        )
        assert.deepEqual(
          ronda.expected,
          ronda.values
            .slice()
            .sort((izquierda, derecha) =>
              ronda.direction === "ascending"
                ? izquierda - derecha
                : derecha - izquierda,
            ),
        )
        assert.notDeepEqual(ronda.values, ronda.expected)
        if (nivel !== "veryHard")
          assert.ok(ronda.values.every((valor) => valor > 0))
      }
      if (nivel === "veryHard")
        assert.ok(
          instancia.questions.some((ronda) =>
            ronda.values.some((valor) => valor < 0),
          ),
        )
    }
})

test("La resta y diferencia absoluta tienen modalidades equilibradas y rangos seguros", () => {
  for (const nivel of niveles)
    for (let muestra = 0; muestra < 40; muestra++) {
      const instancia = generarCalculo("subtractionDifference", nivel)
      if (instancia.type !== "subtractionDifference")
        throw new Error("Wrong type")
      assert.equal(
        instancia.questions.filter((pregunta) => pregunta.mode === "difference")
          .length,
        instancia.questions.length / 2,
      )
      for (const pregunta of instancia.questions) {
        const [izquierda, derecha] = pregunta.operands
        assert.ok(
          pregunta.operands.every(
            (valor) =>
              valor >= instancia.config.minimum &&
              valor <= instancia.config.maximum,
          ),
        )
        assert.equal(
          pregunta.answer,
          pregunta.mode === "difference"
            ? Math.abs(izquierda - derecha)
            : izquierda - derecha,
        )
        if (nivel !== "veryHard" || pregunta.mode === "difference")
          assert.ok(pregunta.answer >= 0)
      }
    }
})

test("Ordenar puntúa cada posición y conserva los aciertos parciales", () => {
  const instancia = generarCalculo("orderNumbers", "easy"),
    entrada = perfectoCalculoRespuesta(instancia)
  const orden = (entrada.answers[0].answer as number[]).slice()
  ;[orden[0], orden[1]] = [orden[1], orden[0]]
  entrada.answers[0].answer = orden
  const resultado = evaluarCalculo(instancia, entrada)
  assert.equal(resultado.correctAnswers, 18)
  assert.equal(resultado.errors, 2)
  assert.equal(resultado.accuracy, 90)
  if (resultado.details.exerciseType !== "orderNumbers")
    throw new Error("Wrong metrics")
  assert.equal(resultado.details.perfectRounds, 4)
})

test("La entrada numérica admite correcciones, espacios y signos menos permitidos", () => {
  assert.equal(interpretarNumericoRespuesta(" 24 ", false), 24)
  assert.equal(interpretarNumericoRespuesta("-24", true), -24)
  assert.equal(interpretarNumericoRespuesta("−24", true), -24)
  assert.equal(interpretarNumericoRespuesta("0", false), 0)
  for (const valor of [
    "",
    " ",
    "-",
    "NaN",
    "Infinity",
    "1.5",
    "1e3",
    "1 2",
    "99999999",
    "abc",
    "--2",
  ])
    assert.equal(interpretarNumericoRespuesta(valor, true), null)
  assert.equal(interpretarNumericoRespuesta("-2", false), null)
})

test("La validación rechaza respuestas ausentes, repetidas o inválidas y tiempos inconsistentes o nulos", () => {
  for (const tipo of tiposCalculo) {
    const instancia = generarCalculo(tipo, "easy"),
      entrada = perfectoCalculoRespuesta(instancia)
    for (const tiempo of [-1, Infinity, NaN, "12", 86401])
      assert.throws(() =>
        evaluarCalculo(instancia, {
          ...entrada,
          actualResponseTimeSeconds: tiempo,
        }),
      )
    assert.throws(() =>
      evaluarCalculo(instancia, {
        ...entrada,
        answers: entrada.answers.slice(1),
      }),
    )
    assert.throws(() =>
      evaluarCalculo(instancia, {
        ...entrada,
        answers: entrada.answers.map(() => entrada.answers[0]),
      }),
    )
    assert.throws(() =>
      evaluarCalculo(instancia, { ...entrada, actualResponseTimeSeconds: 100 }),
    )
    for (const invalido of [NaN, Infinity, "1", null, [], [1, 1]])
      assert.throws(() =>
        evaluarCalculo(instancia, {
          ...entrada,
          answers: [
            { ...entrada.answers[0], answer: invalido },
            ...entrada.answers.slice(1),
          ],
        }),
      )
    const cero = {
      actualResponseTimeSeconds: 0,
      answers: entrada.answers.map((respuesta) => ({
        ...respuesta,
        responseTimeSeconds: 0,
      })),
    }
    assert.throws(() =>
      prepararSesionResultado(
        {
          ...obtenerEjercicioEstrategia(tipo).generateExercise("easy"),
          payload: instancia,
        },
        {},
        cero,
      ),
    )
  }
})

test("La racha de Cálculo asciende entre cálculo mental y secuencias y modifica la siguiente ordenación", () => {
  const primero =
    obtenerEjercicioEstrategia("mentalCalculation").generateExercise("easy")
  const primeroResultado = prepararSesionResultado(
    primero,
    {},
    perfectoCalculoRespuesta(primero.payload as CalculoInstancia),
  )
  assert.equal(primeroResultado.nextProgress.cognitiveFunctionId, "calculation")
  assert.equal(primeroResultado.nextProgress.promotionStreak, 1)
  const segundo = obtenerEjercicioEstrategia("numberSequence").generateExercise(
    primeroResultado.nextProgress.currentLevel,
  )
  const resultado = prepararSesionResultado(
    segundo,
    primeroResultado.nextProgress,
    perfectoCalculoRespuesta(segundo.payload as CalculoInstancia),
  )
  assert.equal(resultado.nextProgress.currentLevel, "normal")
  assert.equal(resultado.nextProgress.promotionStreak, 0)
  const siguiente = obtenerEjercicioEstrategia("orderNumbers").generateExercise(
    resultado.nextProgress.currentLevel,
  ).payload as CalculoInstancia
  assert.deepEqual(siguiente.config, calculoConfiguraciones.orderNumbers.normal)
})

test("Dos resultados bajos de Cálculo descienden entre juegos distintos", () => {
  let estado = {
    currentLevel: "normal" as Nivel,
    promotionStreak: 0,
    demotionStreak: 0,
  }
  for (const tipo of ["mentalCalculation", "subtractionDifference"] as const) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(
        estado.currentLevel,
      ),
      instancia = ejercicio.payload as CalculoInstancia
    const respuesta = perfectoCalculoRespuesta(instancia)
    respuesta.answers = respuesta.answers.map((respuesta) => ({
      ...respuesta,
      answer: -99999,
    }))
    estado = prepararSesionResultado(ejercicio, estado, respuesta).nextProgress
  }
  assert.equal(estado.currentLevel, "easy")
  assert.equal(estado.demotionStreak, 0)
})
