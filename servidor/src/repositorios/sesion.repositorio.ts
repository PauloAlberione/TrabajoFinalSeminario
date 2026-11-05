import { verificarCuentaModificable } from "./eliminacionCuenta.repositorio"
import { leerProgresoGuardado } from "./progreso.repositorio"
import type { IdFuncionCognitiva, NivelDificultad } from "../tipos/dominio"
import { randomUUID } from "node:crypto"
import {
  verificarSesionPropietario,
  efectivoSesionEstado,
  SESION_ARRENDAMIENTO_MS,
} from "../../../compartido/sesionEjercicio"
import { FieldValue } from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"

export type { EstadoSesion } from "../../../compartido/sesionEjercicio"

export async function crearSesion(idUsuario: string) {
  const baseDatos = obtenerFirestoreAdmin(),
    referencia = baseDatos.collection(`users/${idUsuario}/sessions`).doc()
  await baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, baseDatos)
    transaccion.set(referencia, {
      status: "created",
      startedAt: FieldValue.serverTimestamp(),
      exerciseCount: 0,
      activeSeconds: 0,
    })
  })
  return { id: referencia.id, status: "created" }
}

export async function crearEjercicioSesion(
  idUsuario: string,
  categoria: IdFuncionCognitiva,
  generar: (
    nivel: NivelDificultad,
  ) => import("../tipos/ejercicios").InstanciaEjercicio,
  baseDatos = obtenerFirestoreAdmin(),
  recuperable = false,
) {
  const referencia = baseDatos.collection(`users/${idUsuario}/sessions`).doc()
  const propietarioToken = recuperable ? randomUUID() : undefined
  const progresoReferencia = baseDatos.doc(
    `users/${idUsuario}/progress/${categoria}`,
  )
  return baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, baseDatos)
    const instantanea = await transaccion.get(progresoReferencia)
    const progreso = leerProgresoGuardado(categoria, instantanea.data())
    const ejercicio = generar(progreso.currentLevel)
    transaccion.set(referencia, {
      status: "created",
      startedAt: FieldValue.serverTimestamp(),
      exerciseCount: 0,
      exercise: ejercicio,
      progressVersion: progreso.totalExercises,
      ...(propietarioToken
        ? { ownerToken: propietarioToken, checkpoint: null }
        : {}),
    })
    return {
      id: referencia.id,
      exercise: ejercicio,
      ...(propietarioToken ? { ownerToken: propietarioToken } : {}),
    }
  })
}

export async function actualizarSesion(
  idUsuario: string,
  idSesion: string,
  datos: Record<string, unknown>,
  validar?: (actual: Record<string, unknown>) => void,
) {
  const referencia = obtenerFirestoreAdmin().doc(
    `users/${idUsuario}/sessions/${idSesion}`,
  )
  return obtenerFirestoreAdmin().runTransaction(async (transaccion) => {
    await verificarCuentaModificable(
      transaccion,
      idUsuario,
      obtenerFirestoreAdmin(),
    )
    const instantanea = await transaccion.get(referencia)
    if (!instantanea.exists) throw new Error("Sesión inexistente.")
    const actual = instantanea.data()!
    validar?.(actual)
    transaccion.update(referencia, {
      ...datos,
      ...(datos.status === "cancelled"
        ? { endedAt: FieldValue.serverTimestamp() }
        : {}),
    })
    return { id: idSesion, ...actual, ...datos }
  })
}

export async function leerEjercicioSesion(
  idUsuario: string,
  idSesion: string,
  baseDatos = obtenerFirestoreAdmin(),
): Promise<Record<string, unknown> & {
  id: string
  status: string
}> {
  const referencia = baseDatos.doc(`users/${idUsuario}/sessions/${idSesion}`)
  return baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, baseDatos)
    const instantanea = await transaccion.get(referencia)
    const datos = instantanea.data()
    if (!datos) throw new Error("Sesión inexistente.")
    const estado = efectivoSesionEstado(
      datos as {
        status: string
        leaseExpiresAt?: number
      },
    )
    if (estado !== datos.status)
      transaccion.update(referencia, { status: estado })
    return { ...datos, id: idSesion, status: estado }
  })
}

export async function modificarEjercicioSesion(
  idUsuario: string,
  idSesion: string,
  cambiar: (sesion: Record<string, unknown>) => Record<string, unknown>,
  baseDatos = obtenerFirestoreAdmin(),
): Promise<Record<string, unknown> & {
  id: string
}> {
  const referencia = baseDatos.doc(`users/${idUsuario}/sessions/${idSesion}`)
  return baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, baseDatos)
    const instantanea = await transaccion.get(referencia)
    if (!instantanea.exists) throw new Error("Sesión inexistente.")
    const actual = instantanea.data()!
    const cambios = cambiar(actual)
    if (Object.keys(cambios).length === 0) return { ...actual, id: idSesion }
    transaccion.update(referencia, {
      ...cambios,
      ...(cambios.status === "cancelled"
        ? { endedAt: FieldValue.serverTimestamp() }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { ...actual, ...cambios, id: idSesion }
  })
}

export { verificarSesionPropietario, SESION_ARRENDAMIENTO_MS }

export async function listaRecuperableSesiones(
  idUsuario: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  const instantanea = await baseDatos
    .collection(`users/${idUsuario}/sessions`)
    .where("status", "in", ["created", "active", "paused", "saving"])
    .limit(100)
    .get()
  const sesiones = instantanea.docs.filter(
    (elemento) =>
      ["created", "active", "paused", "saving"].includes(
        elemento.data().status,
      ) && elemento.data().exercise,
  )
  const recuperables = await Promise.all(
    sesiones.map(async (elemento) => {
      const sesion = await leerEjercicioSesion(
        idUsuario,
        elemento.id,
        baseDatos,
      )
      const ejercicio =
        sesion.exercise as import("../tipos/ejercicios").InstanciaEjercicio
      return {
        id: elemento.id,
        status: sesion.status,
        exerciseType: ejercicio.type,
        exerciseName: ejercicio.prompt,
      }
    }),
  )
  return recuperables.filter((sesion) =>
    ["created", "active", "paused", "saving"].includes(sesion.status),
  )
}
