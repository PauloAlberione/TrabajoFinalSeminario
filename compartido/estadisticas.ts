import type { IdFuncionCognitiva } from "./resultados"
import type { Nivel } from "./memoria"

export type EstadisticasRango = "7" | "30" | "90" | "all"

export interface EstadisticaTotales {
  completedExercises: number
  completedSessions: number
  activeSeconds: number
  durationMeasurements: number
  correctAnswers: number
  errors: number
  accuracy: number | null
  accuracyMeasurements: number
}

export interface CategoriaEstadisticas extends EstadisticaTotales {
  category: IdFuncionCognitiva
  currentLevel: Nivel
  lastActivity: string | null
}

export interface DiarioEstadisticas extends EstadisticaTotales {
  date: string
}

export interface InformeEstadisticas {
  timeZone: string
  generatedAt: string
  range: EstadisticasRango
  lifetime: EstadisticaTotales
  period: EstadisticaTotales
  today: EstadisticaTotales
  week: EstadisticaTotales
  month: EstadisticaTotales
  currentStreak: number
  suggestedCategory: IdFuncionCognitiva
  activeDays: number
  categories: CategoriaEstadisticas[]
  daily: DiarioEstadisticas[]
  difficulties: Record<Nivel, EstadisticaTotales>
}
