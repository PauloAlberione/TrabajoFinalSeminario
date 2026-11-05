import type { MemoriaDetalles, Nivel } from "./memoria"
import type { LenguajeDetalles } from "./lenguaje"
import type { CalculoDetalles } from "./calculo"
import type { AtencionDetalles } from "./atencionReconocimiento"
import type { VelocidadDetalles } from "./velocidad"

export const CATEGORIA_IDS = [
  "memory",
  "language",
  "calculation",
  "attentionRecognition",
  "speed",
] as const

export type IdFuncionCognitiva = typeof CATEGORIA_IDS[number]

export function normalizarCategoria(id: string): string {
  return id === "processingSpeed" ? "speed" : id
}

export type DetallesEjercicio =
  | MemoriaDetalles
  | LenguajeDetalles
  | CalculoDetalles
  | AtencionDetalles
  | VelocidadDetalles

export type AdaptacionEstado = "applied" | "outdatedProgress" | "outdatedLevel" | "legacySession"

export interface EjercicioEvaluacion {
  correctAnswers: number
  errors: number
  totalQuestions: number
  accuracy: number
  actualTimeSeconds: number
  actualResponseTimeSeconds: number
  targetTimeSeconds: number
  responseTimeEfficiency?: number
  details?: DetallesEjercicio
}

export type EjercicioResultadoEntrada = Pick<EjercicioEvaluacion, "correctAnswers" | "errors" | "totalQuestions" | "actualTimeSeconds" | "targetTimeSeconds">

export interface DesempenoMetricas extends EjercicioResultadoEntrada {
  accuracy: number
  timeEfficiency: number
  performanceScore: number
}

export interface ResumenEjercicio extends EjercicioEvaluacion {
  exerciseName: string
  difficultyBefore: Nivel
  currentLevel: Nivel
  previousLevel: Nivel
  promotionStreak: number
  demotionStreak: number
  decision: "increase" | "maintain" | "decrease"
  metrics: DesempenoMetricas
  adaptationStatus: AdaptacionEstado
}

export interface EjercicioResultadoRegistro extends EjercicioEvaluacion {
  exerciseId: string
  exerciseName: string
  exerciseType: DetallesEjercicio["exerciseType"] | "memoryPairs"
  cognitiveFunctionId: IdFuncionCognitiva
  difficultyBefore: Nivel
  difficultyAfter: Nivel
  adaptationDecision: ResumenEjercicio["decision"]
  adaptationStatus: AdaptacionEstado
  timeEfficiency: number
  performanceScore: number
  timingSource: "clientActiveTime"
}

export interface PersistidoEjercicioResultado
  extends EjercicioResultadoRegistro {
  userId: string
  sessionId: string
  startedAt: unknown
  completedAt: unknown
  createdAt: unknown
  summary: ResumenEjercicio
}

export interface SesionResultadoSolicitud {
  ownerToken?: string
  exerciseId: string
  exerciseType: DetallesEjercicio["exerciseType"]
  cognitiveFunctionId: IdFuncionCognitiva
  sessionId: string
  response: unknown
}

export interface HistoricoResultado
  extends Partial<EjercicioResultadoRegistro> {
  id: string
  createdAt?: string
  sessionId?: string
  startedAt?: unknown
  completedAt?: unknown
  summary?: ResumenEjercicio
  attempts?: number
  averageResponseTimeMs?: number | null
  timeouts?: number
  falseStarts?: number
}
