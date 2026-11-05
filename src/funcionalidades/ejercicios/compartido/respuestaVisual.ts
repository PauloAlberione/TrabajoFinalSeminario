import type {
  CalculoInstancia,
  CalculoRespuesta,
} from "../../../../compartido/calculo"
import type {
  LenguajeInstancia,
  PreguntaRespuesta,
} from "../../../../compartido/lenguaje"
import {
  visualClave,
  type AtencionInstancia,
  type AtencionRespuesta,
} from "../../../../compartido/atencionReconocimiento"
import type {
  VelocidadInstancia,
  VelocidadRespuesta,
} from "../../../../compartido/velocidad"
import type { MemoriaRonda, TipoMemoria } from "../../../../compartido/memoria"

// Solo determina la presentación de la respuesta. La puntuación sigue calculándose en el backend.
export function aciertoCalculo(
  instancia: CalculoInstancia,
  respuesta?: CalculoRespuesta,
) {
  const pregunta = instancia.questions.find(
    (elemento) => elemento.id === respuesta?.questionId,
  )
  if (!pregunta || !respuesta) return undefined
  const esperado = "expected" in pregunta ? pregunta.expected : pregunta.answer
  const seleccion = respuesta.answer
  return Array.isArray(esperado)
    ? Array.isArray(seleccion) &&
        esperado.length === seleccion.length &&
        esperado.every((valor, indice) => seleccion[indice] === valor)
    : esperado === seleccion
}

export function aciertoLenguaje(
  instancia: LenguajeInstancia,
  respuesta?: PreguntaRespuesta,
) {
  const pregunta = instancia.questions.find(
    (elemento) => elemento.id === respuesta?.questionId,
  )
  return pregunta && respuesta
    ? pregunta.answer === respuesta.answer
    : undefined
}

export function aciertoAtencion(
  instancia: AtencionInstancia,
  respuesta?: AtencionRespuesta,
) {
  const ronda = instancia.rounds.find(
    (elemento) => elemento.id === respuesta?.roundId,
  )
  if (!ronda || !respuesta) return undefined
  if ("targetIndices" in ronda && Array.isArray(respuesta.selection)) {
    return instancia.type === "hiddenFigure"
      ? respuesta.selection.some((indice) =>
          ronda.targetIndices.includes(indice),
        )
      : respuesta.selection.length === ronda.targetIndices.length &&
          respuesta.selection.every((indice) =>
            ronda.targetIndices.includes(indice),
          )
  }
  return (
    respuesta.selection ===
    ("targetId" in ronda
      ? ronda.targetId
      : "correctAnswer" in ronda
        ? visualClave(ronda.correctAnswer)
        : undefined)
  )
}

export function aciertoVelocidad(
  instancia: VelocidadInstancia,
  respuesta?: VelocidadRespuesta,
) {
  const ensayo = instancia.trials.find(
    (elemento) => elemento.id === respuesta?.trialId,
  )
  return ensayo && respuesta
    ? respuesta.status === "answered" &&
        respuesta.submittedAnswer === ensayo.expectedAnswer
    : undefined
}

export function aciertoMemoria(
  tipo: TipoMemoria,
  ronda?: MemoriaRonda,
  respuesta?: string[],
) {
  if (!ronda || !respuesta) return undefined
  return (
    respuesta.length === ronda.target.length &&
    respuesta.every((valor, indice) =>
      tipo === "wordList"
        ? ronda.target.includes(valor)
        : ronda.target[indice] === valor,
    )
  )
}
