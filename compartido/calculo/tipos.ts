import type { Nivel } from "../memoria"

export type TipoCalculo = "mentalCalculation" | "numberSequence" | "orderNumbers" | "subtractionDifference"

export type Operacion = "addition" | "subtraction" | "multiplication" | "division"

export type SecuenciaPatron =
  | "constantAdd"
  | "constantSubtract"
  | "multiply"
  | "alternating"
  | "increasingDifference"
  | "mixed"

export interface BaseConfiguracion {
  questionCount: number
  targetTimeSeconds: number
}

export interface MentalConfiguracion extends BaseConfiguracion {
  minimum: number
  maximum: number
  factorMaximum: number
  operations: Operacion[]
  twoStepEvery: number
}

export interface SecuenciaConfiguracion extends BaseConfiguracion {
  lengths: number[]
  optionCount: number
  minimumStep: number
  maximumStep: number
  patterns: SecuenciaPatron[]
}

export interface OrdenConfiguracion extends BaseConfiguracion {
  numbersPerRound: number
  minimum: number
  maximum: number
  gapMinimum: number
  gapMaximum: number
  descendingRounds: number
}

export interface RestaConfiguracion extends BaseConfiguracion {
  minimum: number
  maximum: number
  allowNegative: boolean
}

export interface NumericoPregunta {
  id: string
  prompt: string
  answer: number
  operands: number[]
  operation: Operacion
  secondOperation?: Operacion
}

export interface RestaPregunta {
  id: string
  prompt: string
  answer: number
  operands: [number, number]
  mode: "direct" | "difference"
}

export interface SecuenciaRegla {
  pattern: SecuenciaPatron
  start: number
  step: number
  alternateStep: number
}

export interface SecuenciaPregunta {
  id: string
  rule: SecuenciaRegla
  values: number[]
  missingIndex: number
  answer: number
  options: number[]
}

export interface OrdenRonda {
  id: string
  direction: "ascending" | "descending"
  values: number[]
  expected: number[]
}

export type CalculoInstancia = {
  type: "mentalCalculation"
  level: Nivel
  config: MentalConfiguracion
  questions: NumericoPregunta[]
} | {
  type: "numberSequence"
  level: Nivel
  config: SecuenciaConfiguracion
  questions: SecuenciaPregunta[]
} | {
  type: "orderNumbers"
  level: Nivel
  config: OrdenConfiguracion
  questions: OrdenRonda[]
} | {
  type: "subtractionDifference"
  level: Nivel
  config: RestaConfiguracion
  questions: RestaPregunta[]
}

export interface CalculoRespuesta {
  questionId: string
  answer: number | number[]
  responseTimeSeconds: number
}

export interface EntregaCalculo {
  answers: CalculoRespuesta[]
  actualResponseTimeSeconds: number
}

interface PreguntaDetalles {
  questionCount: number
  correctAnswers: number
  incorrectAnswers: number
  averageQuestionTime: number
}

export type CalculoDetalles = PreguntaDetalles & {
  exerciseType: "mentalCalculation"
  correctByOperation: Record<Operacion, number>
  errorsByOperation: Record<Operacion, number>
} | PreguntaDetalles & {
  exerciseType: "numberSequence"
  patternTypesPlayed: SecuenciaPatron[]
} | PreguntaDetalles & {
  exerciseType: "subtractionDifference"
  directSubtractionQuestions: number
  differenceQuestions: number
  correctDirectSubtractions: number
  correctDifferences: number
} | {
  exerciseType: "orderNumbers"
  rounds: number
  numbersPerRound: number
  totalPositions: number
  correctPositions: number
  incorrectPositions: number
  perfectRounds: number
  ascendingRounds: number
  descendingRounds: number
}
