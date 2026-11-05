import type { Nivel } from "./memoria"
import {
  mentalConfiguraciones,
  secuenciaConfiguraciones,
  ordenConfiguraciones,
  restaConfiguraciones,
} from "./calculo/configuraciones"
import { generarMentalCalculo } from "./calculo/calculoMental"
import { generarNumeroSecuencias } from "./calculo/secuenciaNumerica"
import { generarOrdenNumeros } from "./calculo/ordenarNumeros"
import { generarRestaDiferencia } from "./calculo/diferenciaResta"
import type {
  TipoCalculo,
  CalculoInstancia,
  CalculoDetalles,
  CalculoRespuesta,
  Operacion,
} from "./calculo/tipos"

export type * from "./calculo/tipos"

export { interpretarNumericoRespuesta } from "./calculo/matematicas"

export const tiposCalculo: TipoCalculo[] = [
  "mentalCalculation",
  "numberSequence",
  "orderNumbers",
  "subtractionDifference",
]
export const nombresCalculo: Record<TipoCalculo, string> = {
  mentalCalculation: "Cálculo mental",
  numberSequence: "Secuencias numéricas",
  orderNumbers: "Ordenar números",
  subtractionDifference: "Resta y diferencia",
}
export const calculoInstrucciones: Record<TipoCalculo, string> = {
  mentalCalculation:
    "Resolvé la operación y escribí el resultado. Podés corregirlo antes de confirmar. En las operaciones con paréntesis, resolvé primero lo que está dentro.",
  numberSequence:
    "Observá cómo cambian los números y elegí el que falta. Seleccioná una opción y confirmá tu respuesta.",
  orderNumbers:
    "Seleccioná los números uno por uno en el orden indicado. Podés deshacer o empezar de nuevo antes de confirmar.",
  subtractionDifference:
    "En las restas, calculá el primer número menos el segundo. En las preguntas de diferencia, buscá la distancia entre los dos números: siempre es positiva o cero. Escribí el resultado y confirmá.",
}
export const calculoConfiguraciones = {
  mentalCalculation: mentalConfiguraciones,
  numberSequence: secuenciaConfiguraciones,
  orderNumbers: ordenConfiguraciones,
  subtractionDifference: restaConfiguraciones,
}

export function generarCalculo(
  tipo: TipoCalculo,
  nivel: Nivel,
): CalculoInstancia {
  switch (tipo) {
    case "mentalCalculation":
      return {
        type: tipo,
        level: nivel,
        config: mentalConfiguraciones[nivel],
        questions: generarMentalCalculo(nivel),
      }
    case "numberSequence":
      return {
        type: tipo,
        level: nivel,
        config: secuenciaConfiguraciones[nivel],
        questions: generarNumeroSecuencias(nivel),
      }
    case "orderNumbers":
      return {
        type: tipo,
        level: nivel,
        config: ordenConfiguraciones[nivel],
        questions: generarOrdenNumeros(nivel),
      }
    case "subtractionDifference":
      return {
        type: tipo,
        level: nivel,
        config: restaConfiguraciones[nivel],
        questions: generarRestaDiferencia(nivel),
      }
  }
}

function validarRespuesta(instancia: CalculoInstancia, respuesta: unknown): {
  answers: CalculoRespuesta[]
  time: number
} {
  if (!respuesta || typeof respuesta !== "object")
    throw new Error("Respuesta inválida.")
  const entrada = respuesta as Record<string, unknown>
  const tiempo = entrada.actualResponseTimeSeconds
  if (
    typeof tiempo !== "number" ||
    !Number.isFinite(tiempo) ||
    tiempo <= 0 ||
    tiempo > 86400
  )
    throw new Error("Tiempo inválido.")
  if (
    !Array.isArray(entrada.answers) ||
    entrada.answers.length !== instancia.questions.length
  )
    throw new Error("Respuestas incompletas.")
  const respuestas = entrada.answers as CalculoRespuesta[]
  if (
    respuestas.some(
      (respuesta) =>
        !respuesta ||
        typeof respuesta.questionId !== "string" ||
        !Number.isFinite(respuesta.responseTimeSeconds) ||
        respuesta.responseTimeSeconds <= 0,
    ) ||
    new Set(respuestas.map((respuesta) => respuesta.questionId)).size !==
      respuestas.length
  )
    throw new Error("Respuestas inválidas.")
  if (
    Math.abs(
      respuestas.reduce(
        (total, respuesta) => total + respuesta.responseTimeSeconds,
        0,
      ) - tiempo,
    ) > 0.1
  )
    throw new Error("Los tiempos no coinciden.")
  return { answers: respuestas, time: tiempo }
}

function operacionCantidades(): Record<Operacion, number> {
  return { addition: 0, subtraction: 0, multiplication: 0, division: 0 }
}

export function evaluarCalculo(
  instancia: CalculoInstancia,
  respuesta: unknown,
) {
  const { answers: respuestas, time: tiempo } = validarRespuesta(
    instancia,
    respuesta,
  )
  let correcto = 0
  let total = instancia.questions.length
  let detalles: CalculoDetalles
  if (instancia.type === "orderNumbers") {
    let perfectoRondas = 0
    for (const ronda of instancia.questions) {
      const entrada = respuestas.find(
        (respuesta) => respuesta.questionId === ronda.id,
      )?.answer
      if (
        !Array.isArray(entrada) ||
        entrada.length !== ronda.values.length ||
        new Set(entrada).size !== entrada.length ||
        entrada.some(
          (valor) =>
            !Number.isSafeInteger(valor) || !ronda.values.includes(valor),
        )
      )
        throw new Error("Orden inválido.")
      const posiciones = entrada.filter(
        (valor, indice) => valor === ronda.expected[indice],
      ).length
      correcto += posiciones
      perfectoRondas += Number(posiciones === entrada.length)
    }
    total *= instancia.config.numbersPerRound
    detalles = {
      exerciseType: instancia.type,
      rounds: instancia.questions.length,
      numbersPerRound: instancia.config.numbersPerRound,
      totalPositions: total,
      correctPositions: correcto,
      incorrectPositions: total - correcto,
      perfectRounds: perfectoRondas,
      ascendingRounds: instancia.questions.filter(
        (ronda) => ronda.direction === "ascending",
      ).length,
      descendingRounds: instancia.questions.filter(
        (ronda) => ronda.direction === "descending",
      ).length,
    }
  } else {
    const correctoPorOperacion = operacionCantidades(),
      erroresPorOperacion = operacionCantidades()
    let correctoDirectoRestas = 0,
      correctoDiferencias = 0
    for (const pregunta of instancia.questions) {
      const entrada = respuestas.find(
        (respuesta) => respuesta.questionId === pregunta.id,
      )?.answer
      if (
        typeof entrada !== "number" ||
        !Number.isSafeInteger(entrada) ||
        Math.abs(entrada) > 100000
      )
        throw new Error("Número inválido.")
      if (
        instancia.type === "numberSequence" &&
        !("options" in pregunta && pregunta.options.includes(entrada))
      )
        throw new Error("Opción inválida.")
      const esCorrecto = entrada === pregunta.answer
      correcto += Number(esCorrecto)
      if ("operation" in pregunta)
        (esCorrecto ? correctoPorOperacion : erroresPorOperacion)[
          pregunta.operation
        ]++
      if ("mode" in pregunta && esCorrecto) {
        if (pregunta.mode === "direct") correctoDirectoRestas++
        else correctoDiferencias++
      }
    }
    const comun = {
      questionCount: total,
      correctAnswers: correcto,
      incorrectAnswers: total - correcto,
      averageQuestionTime: tiempo / total,
    }
    switch (instancia.type) {
      case "mentalCalculation":
        detalles = {
          exerciseType: instancia.type,
          ...comun,
          correctByOperation: correctoPorOperacion,
          errorsByOperation: erroresPorOperacion,
        }
        break
      case "numberSequence":
        detalles = {
          exerciseType: instancia.type,
          ...comun,
          patternTypesPlayed: [
            ...new Set(
              instancia.questions.map((pregunta) => pregunta.rule.pattern),
            ),
          ],
        }
        break
      case "subtractionDifference":
        detalles = {
          exerciseType: instancia.type,
          ...comun,
          directSubtractionQuestions: instancia.questions.filter(
            (pregunta) => pregunta.mode === "direct",
          ).length,
          differenceQuestions: instancia.questions.filter(
            (pregunta) => pregunta.mode === "difference",
          ).length,
          correctDirectSubtractions: correctoDirectoRestas,
          correctDifferences: correctoDiferencias,
        }
        break
    }
  }
  return {
    correctAnswers: correcto,
    errors: total - correcto,
    totalQuestions: total,
    accuracy: (correcto / total) * 100,
    actualTimeSeconds: tiempo,
    actualResponseTimeSeconds: tiempo,
    targetTimeSeconds: instancia.config.targetTimeSeconds,
    details: detalles,
  }
}
