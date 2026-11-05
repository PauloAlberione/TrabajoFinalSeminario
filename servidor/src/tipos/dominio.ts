export const DIFICULTAD_NIVELES = [
  "easy",
  "normal",
  "hard",
  "veryHard",
] as const

export type NivelDificultad = typeof DIFICULTAD_NIVELES[number]

export const ADAPTACION_DECISIONES = [
  "increase",
  "maintain",
  "decrease",
] as const

export type AdaptacionDecision = typeof ADAPTACION_DECISIONES[number]

export type { IdFuncionCognitiva } from "../../../compartido/resultados"

export type EjercicioTipo =
  | import("../../../compartido/velocidad").TipoVelocidad
  | import("../../../compartido/atencionReconocimiento").TipoAtencion
  | import("../../../compartido/calculo").TipoCalculo
  | import("../../../compartido/lenguaje").TipoLenguaje
  | import("../../../compartido/memoria").TipoMemoria
  | "memoryPairs"
  | "wordAssociation"
  | "mentalCalculation"
  | "identifyElements"
  | "quickResponse"

export type {
  EjercicioResultadoEntrada,
  DesempenoMetricas,
} from "../../../compartido/resultados"

import type { DesempenoMetricas } from "../../../compartido/resultados"

export interface AdaptacionEstado {
  currentLevel: NivelDificultad
  promotionStreak: number
  demotionStreak: number
}

export interface AdaptacionResultado extends AdaptacionEstado {
  previousLevel: NivelDificultad
  decision: AdaptacionDecision
  metrics: DesempenoMetricas
}
