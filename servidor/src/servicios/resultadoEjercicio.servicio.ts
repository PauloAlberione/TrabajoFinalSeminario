import type {
  AdaptacionEstado,
  ResumenEjercicio,
  EjercicioResultadoRegistro,
} from "../../../compartido/resultados"
import { leerProgresoGuardado } from "../repositorios/progreso.repositorio"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { determinarAjusteDificultad } from "./dificultadAdaptativa.servicio"
import { transaccionarEjercicioResultado } from "../repositorios/finalizacionEjercicio.repositorio"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
import type { AlmacenadoProgreso } from "../repositorios/progreso.repositorio"
import type { SesionResultadoSolicitud } from "./resultado.servicio"
import type { Nivel } from "../../../compartido/memoria"

export function prepararSesionResultado(
  ejercicio: InstanciaEjercicio,
  almacenadoProgreso: Partial<AlmacenadoProgreso>,
  respuesta: unknown,
  adaptacionEstado: AdaptacionEstado = "applied",
) {
  const evaluacion = obtenerEjercicioEstrategia(
    ejercicio.type,
  ).evaluateResponse(ejercicio, respuesta, 0)
  const progreso = leerProgresoGuardado(
    ejercicio.cognitiveFunctionId,
    almacenadoProgreso,
  )
  const calculado = determinarAjusteDificultad(
    progreso,
    evaluacion,
    evaluacion.responseTimeEfficiency,
  )
  const adaptacion =
    adaptacionEstado === "applied"
      ? calculado
      : {
          ...calculado,
          previousLevel: progreso.currentLevel,
          currentLevel: progreso.currentLevel,
          promotionStreak: progreso.promotionStreak,
          demotionStreak: progreso.demotionStreak,
          decision: "maintain" as const,
        }
  const dificultadAntes = (ejercicio.payload as { level: Nivel }).level
  const resumen: ResumenEjercicio = {
    adaptationStatus: adaptacionEstado,
    ...adaptacion,
    difficultyBefore: dificultadAntes,
    exerciseName: ejercicio.prompt,
    ...evaluacion,
  }
  const siguienteProgreso = {
    cognitiveFunctionId: ejercicio.cognitiveFunctionId,
    currentLevel: adaptacion.currentLevel,
    promotionStreak: adaptacion.promotionStreak,
    demotionStreak: adaptacion.demotionStreak,
    totalExercises: progreso.totalExercises + 1,
    totalSessions: progreso.totalSessions + 1,
    averageAccuracy:
      (progreso.averageAccuracy * progreso.totalExercises +
        adaptacion.metrics.accuracy) /
      (progreso.totalExercises + 1),
    averageTime:
      (progreso.averageTime * progreso.totalExercises +
        evaluacion.actualTimeSeconds) /
      (progreso.totalExercises + 1),
    lastPerformanceScore: adaptacion.metrics.performanceScore,
  }
  return {
    summary: resumen,
    nextProgress: siguienteProgreso,
    record: {
      adaptationStatus: adaptacionEstado,
      timingSource: "clientActiveTime",
      ...evaluacion,
      ...adaptacion.metrics,
      exerciseId: ejercicio.id,
      exerciseName: ejercicio.prompt,
      exerciseType: ejercicio.type,
      cognitiveFunctionId: ejercicio.cognitiveFunctionId,
      difficultyBefore: dificultadAntes,
      difficultyAfter: adaptacion.currentLevel,
      adaptationDecision: adaptacion.decision,
    } satisfies EjercicioResultadoRegistro,
  }
}

export async function procesarSesionResultado(
  idUsuario: string,
  solicitar: SesionResultadoSolicitud,
) {
  if (
    ![
      "memory",
      "language",
      "calculation",
      "attentionRecognition",
      "speed",
    ].includes(solicitar.cognitiveFunctionId)
  )
    throw new Error("Categoría inválida.")
  if (
    typeof solicitar.sessionId !== "string" ||
    !/^[\w-]+$/.test(solicitar.sessionId)
  )
    throw new Error("Sesión inválida.")
  return transaccionarEjercicioResultado(
    idUsuario,
    solicitar.sessionId,
    (ejercicio) => {
      if (
        ejercicio.type !== solicitar.exerciseType ||
        solicitar.cognitiveFunctionId !== ejercicio.cognitiveFunctionId ||
        solicitar.exerciseId !== ejercicio.id
      )
        throw new Error("El ejercicio no corresponde a la sesión.")
    },
    (ejercicio, progreso, adaptacionEstado, guardadoRespuesta) =>
      prepararSesionResultado(
        ejercicio,
        progreso,
        guardadoRespuesta ?? solicitar.response,
        adaptacionEstado,
      ),
    solicitar.cognitiveFunctionId,
    undefined,
    solicitar.ownerToken,
  )
}
