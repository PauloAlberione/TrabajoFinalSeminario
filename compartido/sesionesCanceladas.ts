import type { IdFuncionCognitiva } from "./resultados"
import type { Nivel } from "./memoria"

export interface ActividadPendiente {
  id: string
  status: string
  exerciseType: string
  exerciseName: string
}

export interface RespuestaParcial {
  label: string
  response: string
  status: "submitted" | "draft" | "timeout" | "falseStart"
  responseTimeSeconds?: number
}

export interface AvanceParcial {
  activeSeconds: number
  step: number
  totalSteps: number
  recordedResponses: number
  description?: string
  responses?: RespuestaParcial[]
  drafts?: RespuestaParcial[]
}

export interface ActividadCancelada {
  id: string
  status: "cancelled"
  exerciseName: string
  exerciseType: string
  cognitiveFunctionId?: IdFuncionCognitiva
  difficultyLevel?: Nivel
  startedAt: string | null
  endedAt: string | null
  partialProgress: AvanceParcial | null
}

export interface PaginaCanceladas {
  items: ActividadCancelada[]
  nextCursor: string | null
  hasMore: boolean
}
