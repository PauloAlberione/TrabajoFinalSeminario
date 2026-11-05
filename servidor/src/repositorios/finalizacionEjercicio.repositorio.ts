import { verificarCuentaModificable } from "./eliminacionCuenta.repositorio"
import { verificarSesionPropietario } from "../../../compartido/sesionEjercicio"
import type { RegistroResultado } from "./resultado.repositorio"
import type { AdaptacionEstado } from "../../../compartido/resultados"
import { leerProgresoGuardado } from "./progreso.repositorio"
import { FieldValue } from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
import type { AlmacenadoProgreso } from "./progreso.repositorio"
import type { prepararSesionResultado } from "../servicios/resultadoEjercicio.servicio"

type PreparadoResultado = ReturnType<typeof prepararSesionResultado>

export async function transaccionarEjercicioResultado(
  idUsuario: string,
  idSesion: string,
  validarEjercicio: (ejercicio: InstanciaEjercicio) => void,
  preparar: (
    ejercicio: InstanciaEjercicio,
    progreso: Partial<AlmacenadoProgreso>,
    adaptacionEstado: AdaptacionEstado,
    guardadoRespuesta?: unknown,
  ) => PreparadoResultado,
  idFuncionCognitiva: import("../../../compartido/resultados").IdFuncionCognitiva,
  bd = obtenerFirestoreAdmin(),
  propietarioToken?: string,
) {
  const sesionReferencia = bd.doc(`users/${idUsuario}/sessions/${idSesion}`)
  const progresoReferencia = bd.doc(
    `users/${idUsuario}/progress/${idFuncionCognitiva}`,
  )
  const resultadoReferencia = sesionReferencia
    .collection("results")
    .doc("completed")
  return bd.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, bd)
    const [sesionInstantanea, progresoInstantanea, resultadoInstantanea] =
      await Promise.all([
        transaccion.get(sesionReferencia),
        transaccion.get(progresoReferencia),
        transaccion.get(resultadoReferencia),
      ])
    const sesion = sesionInstantanea.data()
    if (!sesion) throw new Error("Sesión inexistente.")
    const ejercicio = sesion.exercise as InstanciaEjercicio | undefined
    if (!ejercicio) throw new Error("Ejercicio inexistente.")
    if (ejercicio.cognitiveFunctionId !== idFuncionCognitiva)
      throw new Error("La categoría no corresponde a la sesión.")
    validarEjercicio(ejercicio)
    if (resultadoInstantanea.exists)
      return resultadoInstantanea.data()!
        .summary as PreparadoResultado["summary"]
    verificarSesionPropietario(sesion, propietarioToken)
    if (sesion.ownerToken && sesion.status !== "saving")
      throw new Error("Protegé el guardado antes de enviar el resultado.")
    if (!["active", "saving"].includes(sesion.status))
      throw new Error("La sesión no está activa.")
    const anterior =
      idFuncionCognitiva === "speed" && !progresoInstantanea.exists
        ? await transaccion.get(
            bd.doc(`users/${idUsuario}/progress/processingSpeed`),
          )
        : undefined
    const progreso = leerProgresoGuardado(
      idFuncionCognitiva,
      progresoInstantanea.data() ?? anterior?.data(),
    )
    const nivel = (ejercicio.payload as { level: string }).level
    const adaptacionEstado: AdaptacionEstado =
      sesion.progressVersion === undefined
        ? "legacySession"
        : nivel !== progreso.currentLevel
          ? "outdatedLevel"
          : sesion.progressVersion !== progreso.totalExercises
            ? "outdatedProgress"
            : "applied"
    const {
      summary: resumen,
      nextProgress: siguienteProgreso,
      record: registro,
    } = preparar(
      ejercicio,
      progreso,
      adaptacionEstado,
      sesion.status === "saving" ? sesion.pendingResult?.response : undefined,
    )
    const marcaTiempo = FieldValue.serverTimestamp()
    transaccion.set(resultadoReferencia, {
      ...registro,
      userId: idUsuario,
      sessionId: idSesion,
      startedAt: sesion.startedAt,
      completedAt: marcaTiempo,
      createdAt: marcaTiempo,
      summary: resumen,
    } satisfies RegistroResultado)
    transaccion.update(sesionReferencia, {
      status: "completed",
      endedAt: marcaTiempo,
      exerciseCount: 1,
    })
    transaccion.set(
      progresoReferencia,
      { ...siguienteProgreso, updatedAt: marcaTiempo },
      {
        merge: true,
      },
    )
    return resumen
  })
}
