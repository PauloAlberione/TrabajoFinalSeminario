import { verificarCuentaModificable } from "./eliminacionCuenta.repositorio"
import { FieldValue } from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"

export class PerfilNoEncontradoError extends Error {}

export async function crearPerfilUsuario(
  idUsuario: string,
  perfil: Record<string, unknown>,
  baseDatos = obtenerFirestoreAdmin(),
) {
  const referencia = baseDatos.doc(`users/${idUsuario}`)
  await baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, baseDatos)
    const instantanea = await transaccion.get(referencia)
    if (!instantanea.exists)
      transaccion.set(referencia, {
        ...perfil,
        createdAt: FieldValue.serverTimestamp(),
      })
  })
  return obtenerPerfilUsuario(idUsuario, baseDatos)
}

export async function obtenerPerfilUsuario(
  idUsuario: string,
  baseDatos = obtenerFirestoreAdmin(),
): Promise<Record<string, unknown> | null> {
  const instantanea = await baseDatos.doc(`users/${idUsuario}`).get()
  return instantanea.exists ? { ...instantanea.data(), id: idUsuario } : null
}

export async function actualizarPerfilUsuario(
  idUsuario: string,
  perfil: Record<string, unknown> | ((
    anterior: Record<string, unknown>,
  ) => Record<string, unknown>),
  baseDatos = obtenerFirestoreAdmin(),
) {
  const referencia = baseDatos.doc(`users/${idUsuario}`)
  await baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, idUsuario, baseDatos)
    const instantanea = await transaccion.get(referencia)
    if (!instantanea.exists)
      throw new PerfilNoEncontradoError("Perfil no encontrado.")
    transaccion.update(referencia, {
      ...(typeof perfil === "function" ? perfil(instantanea.data()!) : perfil),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
  return obtenerPerfilUsuario(idUsuario, baseDatos)
}
