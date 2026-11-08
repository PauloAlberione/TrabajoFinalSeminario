import test from "node:test"
import assert from "node:assert/strict"
import { generarMemoria } from "../../../compartido/memoria"
import { generarCalculo } from "../../../compartido/calculo"
import { generarLenguaje } from "../../../compartido/lenguaje"
import { generarAtencion } from "../../../compartido/atencionReconocimiento"
import { generarVelocidad } from "../../../compartido/velocidad"
import {
  aciertoMemoria,
  aciertoCalculo,
  aciertoLenguaje,
  aciertoAtencion,
  aciertoVelocidad,
} from "../../../src/funcionalidades/ejercicios/compartido/respuestaVisual"

test("La presentación de memoria distingue listas, secuencias y respuestas incompletas sin inventar un resultado", () => {
  const ronda = generarMemoria("wordList", "easy").rounds[0]
  assert.equal(
    aciertoMemoria("wordList", ronda, [...ronda.target].reverse()),
    true,
  )
  assert.equal(aciertoMemoria("wordList", ronda, ronda.target.slice(1)), false)
  assert.equal(aciertoMemoria("wordList", ronda, undefined), undefined)
  assert.equal(
    aciertoMemoria(
      "colorSequence",
      ronda,
      ronda.target.map((valor, indice) =>
        indice === 0 ? "__incorrecto__" : valor,
      ),
    ),
    false,
  )
})

test("La presentación de Cálculo y Lenguaje conserva la respuesta correcta tras recuperar datos", () => {
  const calculo = generarCalculo("orderNumbers", "easy")
  assert.equal(calculo.type, "orderNumbers")
  if (calculo.type !== "orderNumbers") throw Error("Configuración inesperada")
  const pregunta = calculo.questions[0]
  const respuesta = {
    questionId: pregunta.id,
    answer: pregunta.expected,
    responseTimeSeconds: 1.5,
  }
  assert.equal(aciertoCalculo(calculo, respuesta), true)
  assert.equal(
    aciertoCalculo(calculo, {
      ...respuesta,
      answer: pregunta.expected.slice(1),
    }),
    false,
  )
  const lenguaje = generarLenguaje("wordAssociation", "easy")
  const eleccion = {
    questionId: lenguaje.questions[0].id,
    answer: lenguaje.questions[0].answer,
    responseTimeSeconds: 1.5,
  }
  assert.equal(
    aciertoLenguaje(lenguaje, JSON.parse(JSON.stringify(eleccion))),
    true,
  )
  assert.equal(
    aciertoLenguaje(lenguaje, { ...eleccion, answer: "__incorrecto__" }),
    false,
  )
})

test("La presentación de Atención reconoce aciertos parciales y la figura encontrada sin cambiar intentos", () => {
  const instancia = generarAtencion("hiddenFigure", "easy")
  if (instancia.type !== "hiddenFigure") throw Error("Configuración inesperada")
  const ronda = instancia.rounds[0]
  const seleccion = [-1, ronda.targetIndices[0]]
  assert.equal(
    aciertoAtencion(instancia, {
      roundId: ronda.id,
      selection: seleccion,
      responseTimeSeconds: 2,
    }),
    true,
  )
  assert.deepEqual(seleccion, [-1, ronda.targetIndices[0]])
  assert.equal(
    aciertoAtencion(instancia, {
      roundId: ronda.id,
      selection: [-1],
      responseTimeSeconds: 2,
    }),
    false,
  )
})

test("La presentación de Velocidad no confunde vencimientos o anticipaciones con aciertos ni altera el tiempo", () => {
  const instancia = generarVelocidad("visualReaction", "easy"),
    ensayo = instancia.trials[0]
  const respuesta = {
    trialId: ensayo.id,
    status: "answered" as const,
    submittedAnswer: ensayo.expectedAnswer,
    responseTimeMs: 123.45,
  }
  assert.equal(aciertoVelocidad(instancia, respuesta), true)
  assert.equal(
    aciertoVelocidad(instancia, { ...respuesta, status: "timeout" }),
    false,
  )
  assert.equal(
    aciertoVelocidad(instancia, { ...respuesta, status: "falseStart" }),
    false,
  )
  assert.equal(respuesta.responseTimeMs, 123.45)
})
