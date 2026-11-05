import {
  tiempoEficiencia as calcularTiempoEficiencia,
  MINIMO_EVALUABLE_RESPUESTA_SEGUNDOS,
} from "../../../compartido/medicionTiempo"
import {
  DIFICULTAD_NIVELES,
  type AdaptacionResultado,
  type AdaptacionEstado,
  type EjercicioResultadoEntrada,
  type DesempenoMetricas,
} from "../tipos/dominio"

export const UMBRALES_ADAPTACION = {
  promotionAccuracy: 80,
  promotionScore: 80,
  demotionAccuracy: 50,
  demotionScore: 55,
  consecutiveResults: 2,
  accuracyWeight: 0.8,
  timeWeight: 0.2,
} as const

function validarResultado(resultado: EjercicioResultadoEntrada) {
  if (
    !Number.isFinite(resultado.correctAnswers) ||
    !Number.isFinite(resultado.errors) ||
    resultado.correctAnswers < 0 ||
    resultado.errors < 0
  )
    throw new Error("Las respuestas deben ser números no negativos.")
  if (
    !Number.isFinite(resultado.totalQuestions) ||
    resultado.totalQuestions <= 0
  )
    throw new Error("totalQuestions debe ser mayor que cero.")
  if (resultado.correctAnswers + resultado.errors !== resultado.totalQuestions)
    throw new Error("Las respuestas no coinciden con totalQuestions.")
  if (
    !Number.isFinite(resultado.actualTimeSeconds) ||
    resultado.actualTimeSeconds < 0 ||
    resultado.actualTimeSeconds > 86400
  )
    throw new Error("El tiempo debe ser un número no negativo.")
  if (
    !Number.isFinite(resultado.targetTimeSeconds) ||
    resultado.targetTimeSeconds <= 0
  )
    throw new Error("targetTimeSeconds debe ser mayor que cero.")
}

export function calcularMetricasRendimiento(
  resultado: EjercicioResultadoEntrada,
  respuestaTiempoEficiencia?: number,
): DesempenoMetricas {
  validarResultado(resultado)
  const precision = (resultado.correctAnswers / resultado.totalQuestions) * 100
  if (
    respuestaTiempoEficiencia !== undefined &&
    (!Number.isFinite(respuestaTiempoEficiencia) ||
      respuestaTiempoEficiencia < 0 ||
      respuestaTiempoEficiencia > 100)
  )
    throw new Error("Eficiencia temporal inválida.")
  const tiempoEficiencia =
    resultado.actualTimeSeconds < MINIMO_EVALUABLE_RESPUESTA_SEGUNDOS
      ? 0
      : (respuestaTiempoEficiencia ??
        calcularTiempoEficiencia(
          resultado.actualTimeSeconds,
          resultado.targetTimeSeconds,
        ))
  return {
    ...resultado,
    accuracy: precision,
    timeEfficiency: tiempoEficiencia,
    performanceScore:
      precision * UMBRALES_ADAPTACION.accuracyWeight +
      tiempoEficiencia * UMBRALES_ADAPTACION.timeWeight,
  }
}

function siguienteNivel(
  nivelActual: typeof DIFICULTAD_NIVELES[number],
  direccion: 1 | -1,
) {
  const indiceActual = DIFICULTAD_NIVELES.indexOf(nivelActual)
  return DIFICULTAD_NIVELES[
    Math.max(
      0,
      Math.min(DIFICULTAD_NIVELES.length - 1, indiceActual + direccion),
    )
  ]
}

export function determinarAjusteDificultad(
  estado: AdaptacionEstado,
  resultado: EjercicioResultadoEntrada,
  respuestaTiempoEficiencia?: number,
): AdaptacionResultado {
  if (!DIFICULTAD_NIVELES.includes(estado.currentLevel))
    throw new Error("Nivel de dificultad desconocido.")
  const metricas = calcularMetricasRendimiento(
    resultado,
    respuestaTiempoEficiencia,
  )
  const cumpleParaAscenso =
    metricas.accuracy >= UMBRALES_ADAPTACION.promotionAccuracy &&
    metricas.performanceScore >= UMBRALES_ADAPTACION.promotionScore
  const cumpleParaDescenso =
    metricas.accuracy < UMBRALES_ADAPTACION.demotionAccuracy ||
    metricas.performanceScore < UMBRALES_ADAPTACION.demotionScore
  if (!cumpleParaAscenso && !cumpleParaDescenso)
    return {
      previousLevel: estado.currentLevel,
      currentLevel: estado.currentLevel,
      promotionStreak: 0,
      demotionStreak: 0,
      decision: "maintain",
      metrics: metricas,
    }
  if (cumpleParaAscenso) {
    const rachaAscenso = estado.promotionStreak + 1
    if (rachaAscenso >= UMBRALES_ADAPTACION.consecutiveResults)
      return {
        previousLevel: estado.currentLevel,
        currentLevel: siguienteNivel(estado.currentLevel, 1),
        promotionStreak: 0,
        demotionStreak: 0,
        decision: estado.currentLevel === "veryHard" ? "maintain" : "increase",
        metrics: metricas,
      }
    return {
      previousLevel: estado.currentLevel,
      currentLevel: estado.currentLevel,
      promotionStreak: rachaAscenso,
      demotionStreak: 0,
      decision: "maintain",
      metrics: metricas,
    }
  }
  const rachaDescenso = estado.demotionStreak + 1
  if (rachaDescenso >= UMBRALES_ADAPTACION.consecutiveResults)
    return {
      previousLevel: estado.currentLevel,
      currentLevel: siguienteNivel(estado.currentLevel, -1),
      promotionStreak: 0,
      demotionStreak: 0,
      decision: estado.currentLevel === "easy" ? "maintain" : "decrease",
      metrics: metricas,
    }
  return {
    previousLevel: estado.currentLevel,
    currentLevel: estado.currentLevel,
    promotionStreak: 0,
    demotionStreak: rachaDescenso,
    decision: "maintain",
    metrics: metricas,
  }
}
