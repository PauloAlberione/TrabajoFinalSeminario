import { verificarCuentaModificable } from "./eliminacionCuenta.repositorio"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import type { AdaptacionEstado, IdFuncionCognitiva } from "../tipos/dominio"

export interface AlmacenadoProgreso extends AdaptacionEstado {
  cognitiveFunctionId: IdFuncionCognitiva
  totalExercises: number
  totalSessions: number
  averageAccuracy: number
  averageTime: number
  lastPerformanceScore: number
  updatedAt?: unknown
}

export function leerProgresoGuardado(
  idFuncionCognitiva: IdFuncionCognitiva,
  datos: Partial<AlmacenadoProgreso> = {},
): AlmacenadoProgreso {
  return {
    ...datos,
    cognitiveFunctionId: idFuncionCognitiva,
    currentLevel: datos.currentLevel ?? "easy",
    promotionStreak: Number(datos.promotionStreak ?? 0),
    demotionStreak: Number(datos.demotionStreak ?? 0),
    totalExercises: Number(datos.totalExercises ?? 0),
    totalSessions: Number(datos.totalSessions ?? 0),
    averageAccuracy: Number(datos.averageAccuracy ?? 0),
    averageTime: Number(datos.averageTime ?? 0),
    lastPerformanceScore: Number(datos.lastPerformanceScore ?? 0),
  }
}

export async function obtenerProgreso(
  idUsuario: string,
  idFuncionCognitiva: IdFuncionCognitiva,
  baseDatos = obtenerFirestoreAdmin(),
): Promise<AlmacenadoProgreso> {
  const referencia = baseDatos.doc(
    `users/${idUsuario}/progress/${idFuncionCognitiva}`,
  )
  return baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, baseDatos)
    const actual = await transaccion.get(referencia)
    if (actual.exists || idFuncionCognitiva !== "speed")
      return leerProgresoGuardado(idFuncionCognitiva, actual.data())
    const anterior = await transaccion.get(
      baseDatos.doc(`users/${idUsuario}/progress/processingSpeed`),
    )
    // Conserva el progreso canónico y el documento anterior: sus historiales pueden superponerse.
    if (anterior.exists)
      transaccion.set(referencia, {
        ...anterior.data(),
        cognitiveFunctionId: "speed",
        migratedFrom: "processingSpeed",
      })
    return leerProgresoGuardado("speed", anterior.data())
  })
}
