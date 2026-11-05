import type { Nivel } from "../memoria"
import type { VisualElemento } from "../atencionReconocimiento"

export type TipoVelocidad =
  | "quickResponse"
  | "touchColor"
  | "quickClassification"
  | "visualReaction"

export interface VelocidadConfiguracion {
  questionCount: number
  timeoutMs: number
  expectedResponseMs: number
  optionCount: number
  waitMinimumMs: number
  waitMaximumMs: number
  targetTimeSeconds: number
}

interface BaseEnsayo {
  id: string
  expectedAnswer: string
  options: string[]
}

export type VelocidadEnsayo =
  | (BaseEnsayo & {
      kind: "quickResponse"
      pair: [VisualElemento, VisualElemento]
    })
  | (BaseEnsayo & {
      kind: "touchColor"
      requestedColor: string
    })
  | (BaseEnsayo & {
      kind: "quickClassification"
      itemId: string
      label: string
    })
  | (BaseEnsayo & {
      kind: "visualReaction"
      waitingMs: number
      position: "center" | "left" | "right"
    })

export interface VelocidadInstancia {
  type: TipoVelocidad
  level: Nivel
  config: VelocidadConfiguracion
  trials: VelocidadEnsayo[]
}

export interface VelocidadRespuesta {
  trialId: string
  status: "answered" | "timeout" | "falseStart"
  submittedAnswer: string | null
  responseTimeMs: number | null
}

export interface EntregaVelocidad {
  answers: VelocidadRespuesta[]
  actualResponseTimeSeconds: number
}

export interface VelocidadEnsayoResultado extends VelocidadRespuesta {
  trialNumber: number
  stimulusId: string
  expectedAnswer: string
  correct: boolean
  timeout: boolean
  falseStart: boolean
  effectiveTimeMs: number
}

interface VelocidadMetricas {
  totalTrials: number
  attempts: number
  correctAnswers: number
  incorrectAnswers: number
  timeouts: number
  falseStarts: number
  averageResponseTimeMs: number | null
  effectiveTimeSeconds: number
  trialResults: VelocidadEnsayoResultado[]
}

export type VelocidadDetalles =
  | (VelocidadMetricas & {
      exerciseType: "quickResponse" | "touchColor" | "quickClassification"
    })
  | (VelocidadMetricas & {
      exerciseType: "visualReaction"
      validReactions: number
      medianResponseTimeMs: number | null
      fastestResponseTimeMs: number | null
    })
