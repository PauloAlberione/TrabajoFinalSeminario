import type { IdFuncionCognitiva, HistoricoResultado } from "./resultados"
import type { Nivel as NivelDificultad } from "./memoria"

export interface FiltrosHistorial {
  category?: IdFuncionCognitiva
  exercise?: string
  difficulty?: NivelDificultad
  from?: string
  to?: string
}

export interface ConsultaHistorial extends FiltrosHistorial {
  cursor?: string
  limit?: number
  includeDetails?: boolean
}

export interface ElementoHistorial
  extends Omit<HistoricoResultado, "completedAt"> {
  completionDateSource?: "createdAt" | "sessionEndedAt" | "completedAt"
  sessionId: string
  resultId: string
  completedAt: string
}

export interface PaginaHistorial {
  items: ElementoHistorial[]
  nextCursor: string | null
  hasMore: boolean
}
