import { getAuth } from "firebase-admin/auth"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import {
  reservaCuentaEliminacion,
  eliminarCuentaDocumentos,
  finalizarCuentaEliminacion,
  pendienteCuentaEliminaciones,
  leerEliminacionComprobante,
} from "../repositorios/eliminacionCuenta.repositorio"

export class RecienteAutenticacionError extends Error {}

export function verificarRecienteAutenticacion(
  autenticacionTiempo: unknown,
  ahora = Date.now(),
) {
  if (
    typeof autenticacionTiempo !== "number" ||
    !Number.isFinite(autenticacionTiempo) ||
    autenticacionTiempo * 1000 > ahora + 30000 ||
    ahora - autenticacionTiempo * 1000 > 300000
  )
    throw new RecienteAutenticacionError(
      "Volvé a verificar tu contraseña para eliminar la cuenta.",
    )
}

export interface CuentaEliminacionAutenticacion {
  updateUser(uid: string, ajustes: { disabled: boolean }): Promise<unknown>
  revokeRefreshTokens(uid: string): Promise<unknown>
  deleteUser(uid: string): Promise<unknown>
}

function faltanteCuenta(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "auth/user-not-found"
  )
}

export async function ejecutarCuentaEliminacion(
  id: string,
  baseDatos = obtenerFirestoreAdmin(),
  autenticacion: CuentaEliminacionAutenticacion = getAuth(),
  eliminarDocumentos = eliminarCuentaDocumentos,
) {
  const reserva = await reservaCuentaEliminacion(id, new Date(), baseDatos)
  if (reserva.status === "completed") return { status: "completed" as const }
  if (reserva.status === "busy") return { status: "pending" as const }
  try {
    try {
      await autenticacion.updateUser(reserva.uid, { disabled: true })
      await autenticacion.revokeRefreshTokens(reserva.uid)
    } catch (error) {
      if (!faltanteCuenta(error)) throw error
    }
    await eliminarDocumentos(reserva.uid, baseDatos)
    try {
      await autenticacion.deleteUser(reserva.uid)
    } catch (error) {
      if (!faltanteCuenta(error)) throw error
    }
    const confirmado = await finalizarCuentaEliminacion(
      id,
      reserva.uid,
      reserva.owner,
      true,
      baseDatos,
    )
    return { status: confirmado ? "completed" as const : "pending" as const }
  } catch {
    await finalizarCuentaEliminacion(
      id,
      reserva.uid,
      reserva.owner,
      false,
      baseDatos,
    )
    return { status: "pending" as const }
  }
}

export async function continuarCuentaEliminacion(
  comprobante: unknown,
  baseDatos = obtenerFirestoreAdmin(),
  autenticacion: CuentaEliminacionAutenticacion = getAuth(),
) {
  const { id } = await leerEliminacionComprobante(
    comprobante,
    new Date(),
    baseDatos,
  )
  return ejecutarCuentaEliminacion(id, baseDatos, autenticacion)
}

export async function reintentarPendienteEliminaciones(
  baseDatos = obtenerFirestoreAdmin(),
) {
  const iniciado = Date.now(),
    ids = await pendienteCuentaEliminaciones(baseDatos)
  let completado = 0,
    procesado = 0
  for (const id of ids) {
    if (Date.now() - iniciado > 190000) break
    procesado++
    if ((await ejecutarCuentaEliminacion(id, baseDatos)).status === "completed")
      completado++
  }
  return { processed: procesado, completed: completado }
}
