import { mezclar, type Nivel } from "./memoria"
import {
  asociaciones,
  frases,
  sinonimoAntonimoPreguntas,
  type EleccionPregunta,
} from "./lenguajeContenido"
import {
  crucigramaCrucigramas,
  normalizarRespuesta,
  type CrucigramaCrucigrama,
} from "./crucigramasLenguaje"

export type TipoLenguaje = "wordAssociation" | "simpleCrossword" | "completeSentence" | "synonymsAntonyms"

export const tiposLenguaje: TipoLenguaje[] = [
  "wordAssociation",
  "simpleCrossword",
  "completeSentence",
  "synonymsAntonyms",
]
export const lenguajeNombres: Record<TipoLenguaje, string> = {
  wordAssociation: "Asociación de palabras",
  simpleCrossword: "Crucigrama simple",
  completeSentence: "Completar la frase",
  synonymsAntonyms: "Sinónimos y antónimos",
}
export const lenguajeInstrucciones: Record<TipoLenguaje, string> = {
  wordAssociation:
    "Leé la palabra y elegí la opción que responde a la pregunta. Confirmá tu respuesta para continuar.",
  simpleCrossword:
    "Elegí una pista y escribí la palabra en sus casillas. Podés revisar antes de comprobar. Después de tres intentos incorrectos se mostrará la respuesta.",
  completeSentence:
    "Leé la frase y elegí la palabra que completa el espacio. Confirmá tu respuesta para continuar.",
  synonymsAntonyms:
    "Leé si se pide un sinónimo (significado similar) o un antónimo (significado contrario). Elegí una opción y confirmá.",
}

export interface LenguajeConfiguracion {
  questionCount: number
  optionCount: number
  targetTimeSeconds: number
}

function configuraciones(
  tiempos: number[],
  crucigrama = false,
): Record<Nivel, LenguajeConfiguracion> {
  return Object.fromEntries(
    (["easy", "normal", "hard", "veryHard"] as const).map((nivel, indice) => [
      nivel,
      {
        questionCount: crucigrama ? indice + 4 : 8 + indice * 2,
        optionCount: crucigrama ? 0 : indice < 2 ? 4 : indice + 3,
        targetTimeSeconds: tiempos[indice],
      },
    ]),
  ) as Record<Nivel, LenguajeConfiguracion>
}

export const lenguajeConfiguraciones: Record<TipoLenguaje, Record<Nivel, LenguajeConfiguracion>> =
  {
    wordAssociation: configuraciones([70, 85, 105, 125]),
    simpleCrossword: configuraciones([180, 240, 300, 360], true),
    completeSentence: configuraciones([75, 90, 110, 130]),
    synonymsAntonyms: configuraciones([65, 80, 100, 120]),
  }

export interface LenguajePregunta extends EleccionPregunta {
  options: string[]
}

export interface LenguajeInstancia {
  type: TipoLenguaje
  level: Nivel
  config: LenguajeConfiguracion
  questions: LenguajePregunta[]
  puzzle: CrucigramaCrucigrama | null
}

export interface PreguntaRespuesta {
  questionId: string
  answer: string
  responseTimeSeconds: number
}

export interface CrucigramaRespuesta {
  wordId: string
  attempts: string[]
}

export interface LenguajeRespuesta {
  actualResponseTimeSeconds: number
  answers: PreguntaRespuesta[]
  words: CrucigramaRespuesta[]
}

export type LenguajeDetalles = {
  exerciseType: "wordAssociation" | "completeSentence"
  questionCount: number
  correctAnswers: number
  incorrectAnswers: number
  averageQuestionTime: number
} | {
  exerciseType: "synonymsAntonyms"
  questionCount: number
  synonymQuestions: number
  antonymQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  averageQuestionTime: number
} | {
  exerciseType: "simpleCrossword"
  wordCount: number
  solvedWords: number
  firstAttemptCorrectWords: number
  incorrectAttempts: number
  revealedWords: number
}

export function generarLenguaje(
  tipo: TipoLenguaje,
  nivel: Nivel,
): LenguajeInstancia {
  const configuracion = lenguajeConfiguraciones[tipo][nivel]
  if (tipo === "simpleCrossword")
    return {
      type: tipo,
      level: nivel,
      config: configuracion,
      questions: [],
      puzzle: mezclar(crucigramaCrucigramas[nivel])[0],
    }
  const fuente =
    tipo === "wordAssociation"
      ? asociaciones
      : tipo === "completeSentence"
        ? frases
        : sinonimoAntonimoPreguntas
  const conjunto = fuente.filter((pregunta) =>
    nivel === "easy"
      ? pregunta.tier === "direct"
      : nivel === "normal" || pregunta.tier === "contextual",
  )
  const seleccionado =
    tipo === "synonymsAntonyms"
      ? mezclar(
          ["synonym", "antonym"].flatMap((relacion) =>
            mezclar(
              conjunto.filter((pregunta) => pregunta.relation === relacion),
            ).slice(0, configuracion.questionCount / 2),
          ),
        )
      : mezclar(conjunto).slice(0, configuracion.questionCount)
  if (seleccionado.length !== configuracion.questionCount)
    throw new Error("No hay suficientes preguntas para este nivel.")
  return {
    type: tipo,
    level: nivel,
    config: configuracion,
    puzzle: null,
    questions: seleccionado.map((pregunta) => ({
      ...pregunta,
      options: mezclar([
        pregunta.answer,
        ...(nivel === "hard" || nivel === "veryHard"
          ? pregunta.distractors.slice().reverse()
          : pregunta.distractors
        ).slice(0, configuracion.optionCount - 1),
      ]),
    })),
  }
}

export function evaluarCrucigramaPalabra(
  respuesta: string,
  intentos: string[],
) {
  if (
    intentos.length < 1 ||
    intentos.length > 3 ||
    intentos.some(
      (valor) =>
        typeof valor !== "string" || !valor.trim() || valor.length > 30,
    )
  )
    throw new Error("Intentos inválidos.")
  const correcto = intentos.findIndex(
    (valor) => normalizarRespuesta(valor) === normalizarRespuesta(respuesta),
  )
  if (correcto >= 0 && correcto !== intentos.length - 1)
    throw new Error("Palabra ya resuelta.")
  if (correcto < 0 && intentos.length !== 3)
    throw new Error("Falta completar una palabra.")
  return {
    solved: correcto >= 0,
    firstAttemptCorrect: correcto === 0,
    incorrectAttempts: correcto < 0 ? 3 : correcto,
    revealed: correcto < 0,
  }
}

export function evaluarLenguaje(
  instancia: LenguajeInstancia,
  respuesta: unknown,
) {
  if (!respuesta || typeof respuesta !== "object")
    throw new Error("Respuesta inválida.")
  const entrada = respuesta as Partial<LenguajeRespuesta>
  const tiempo = entrada.actualResponseTimeSeconds
  if (
    typeof tiempo !== "number" ||
    !Number.isFinite(tiempo) ||
    tiempo <= 0 ||
    tiempo > 86400
  )
    throw new Error("Tiempo inválido.")
  let correcto = 0
  let detalles: LenguajeDetalles
  const total = instancia.config.questionCount
  if (instancia.type === "simpleCrossword") {
    if (
      !Array.isArray(entrada.words) ||
      entrada.words.length !== total ||
      new Set(entrada.words.map((palabra) => palabra?.wordId)).size !== total
    )
      throw new Error("Palabras inválidas.")
    let resueltoPalabras = 0
    let incorrectoIntentos = 0
    let mostradoPalabras = 0
    for (const palabra of instancia.puzzle!.words) {
      const envio = entrada.words.find(
        (elemento) => elemento?.wordId === palabra.id,
      )
      if (!envio || !Array.isArray(envio.attempts))
        throw new Error("Falta una palabra.")
      const resultado = evaluarCrucigramaPalabra(palabra.answer, envio.attempts)
      correcto += Number(resultado.firstAttemptCorrect)
      resueltoPalabras += Number(resultado.solved)
      incorrectoIntentos += resultado.incorrectAttempts
      mostradoPalabras += Number(resultado.revealed)
    }
    detalles = {
      exerciseType: "simpleCrossword",
      wordCount: total,
      solvedWords: resueltoPalabras,
      firstAttemptCorrectWords: correcto,
      incorrectAttempts: incorrectoIntentos,
      revealedWords: mostradoPalabras,
    }
  } else {
    if (
      !Array.isArray(entrada.answers) ||
      entrada.answers.length !== total ||
      new Set(entrada.answers.map((respuesta) => respuesta?.questionId))
        .size !== total
    )
      throw new Error("Respuestas incompletas.")
    let preguntaTiempo = 0
    for (const pregunta of instancia.questions) {
      const respuesta = entrada.answers.find(
        (respuesta) => respuesta?.questionId === pregunta.id,
      )
      if (
        !respuesta ||
        typeof respuesta.answer !== "string" ||
        !pregunta.options.includes(respuesta.answer) ||
        !Number.isFinite(respuesta.responseTimeSeconds) ||
        respuesta.responseTimeSeconds <= 0
      )
        throw new Error("Respuesta inválida.")
      preguntaTiempo += respuesta.responseTimeSeconds
      correcto += Number(respuesta.answer === pregunta.answer)
    }
    if (Math.abs(preguntaTiempo - tiempo) > 0.1)
      throw new Error("Los tiempos no coinciden.")
    const comun = {
      questionCount: total,
      correctAnswers: correcto,
      incorrectAnswers: total - correcto,
      averageQuestionTime: preguntaTiempo / total,
    }
    detalles =
      instancia.type === "synonymsAntonyms"
        ? {
            exerciseType: instancia.type,
            ...comun,
            synonymQuestions: instancia.questions.filter(
              (pregunta) => pregunta.relation === "synonym",
            ).length,
            antonymQuestions: instancia.questions.filter(
              (pregunta) => pregunta.relation === "antonym",
            ).length,
          }
        : { exerciseType: instancia.type, ...comun }
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
