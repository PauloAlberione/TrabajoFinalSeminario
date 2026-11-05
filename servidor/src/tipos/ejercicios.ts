export type { EjercicioEvaluacion } from "../../../compartido/resultados"

import type { EjercicioEvaluacion } from "../../../compartido/resultados"
import type {
  IdFuncionCognitiva,
  NivelDificultad,
  EjercicioTipo,
} from "./dominio"

export interface InstanciaEjercicio {
  id: string
  type: EjercicioTipo
  cognitiveFunctionId: IdFuncionCognitiva
  prompt: string
  payload: unknown
  targetTimeSeconds: number
}

export interface DificultadConfiguracion {
  targetTimeSeconds: number
  questionCount: number
}

export interface EjercicioEstrategia {
  readonly type: EjercicioTipo
  readonly cognitiveFunctionId: IdFuncionCognitiva
  generateExercise(nivel: NivelDificultad): InstanciaEjercicio
  evaluateResponse(
    instancia: InstanciaEjercicio,
    respuesta: unknown,
    efectivoTiempoSegundos: number,
  ): EjercicioEvaluacion
  getDifficultyConfig(nivel: NivelDificultad): DificultadConfiguracion
}
