import type { Nivel } from "../memoria"

export type TipoAtencion = "identifyElements" | "followObject" | "recognizePattern" | "hiddenFigure"

export interface VisualElemento {
  shape: "circle" | "square" | "triangle" | "diamond" | "arrow" | "star"
  rotation: number
  fill: "solid" | "outline"
  size: "large" | "small"
}

export type VisualPatronTipo =
  | "alternating"
  | "repeatingGroup"
  | "orientationCycle"
  | "sizeAlternation"
  | "dualAttribute"

export interface AtencionConfiguracion {
  questionCount: number
  targetTimeSeconds: number
  elementCount: number
  targetCount: number
  optionCount: number
  previewSeconds: number
  movementSeconds: number
  movementComplexity: number
  patternLength: number
  patterns: VisualPatronTipo[]
}

export interface BuscarRonda {
  id: string
  target: VisualElemento
  items: VisualElemento[]
  targetIndices: number[]
}

export interface Punto {
  x: number
  y: number
}

export interface SeguimientoObjeto {
  id: string
  waypoints: Punto[]
}

export interface SeguimientoRonda {
  id: string
  objects: SeguimientoObjeto[]
  targetId: string
}

export interface PatronRonda {
  id: string
  sequence: VisualElemento[]
  cycle: VisualElemento[]
  missingIndex: number
  correctAnswer: VisualElemento
  options: VisualElemento[]
  patternType: VisualPatronTipo
}

export type AtencionInstancia = {
  type: "identifyElements" | "hiddenFigure"
  level: Nivel
  config: AtencionConfiguracion
  rounds: BuscarRonda[]
} | {
  type: "followObject"
  level: Nivel
  config: AtencionConfiguracion
  rounds: SeguimientoRonda[]
} | {
  type: "recognizePattern"
  level: Nivel
  config: AtencionConfiguracion
  rounds: PatronRonda[]
}

export interface AtencionRespuesta {
  roundId: string
  selection: number[] | string
  responseTimeSeconds: number
}

export interface EntregaAtencion {
  answers: AtencionRespuesta[]
  actualResponseTimeSeconds: number
}

export type AtencionDetalles = {
  exerciseType: "identifyElements"
  rounds: number
  totalTargets: number
  correctSelections: number
  missedTargets: number
  falsePositiveSelections: number
  perfectRounds: number
} | {
  exerciseType: "followObject"
  rounds: number
  correctRounds: number
  incorrectRounds: number
  averageSelectionTime: number
  objectCount: number
  movementComplexity: number
} | {
  exerciseType: "recognizePattern"
  questionCount: number
  correctAnswers: number
  incorrectAnswers: number
  averageQuestionTime: number
  patternTypesPlayed: VisualPatronTipo[]
} | {
  exerciseType: "hiddenFigure"
  rounds: number
  figuresFound: number
  firstAttemptCorrect: number
  wrongAttempts: number
  revealedRounds: number
  averageFindTime: number
}
