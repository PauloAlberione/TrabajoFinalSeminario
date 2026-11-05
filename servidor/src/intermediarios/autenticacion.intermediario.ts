import type { NextFunction, Request, Response } from "express"
import { getAuth } from "firebase-admin/auth"
import { getApps } from "firebase-admin/app"
import { esCuentaEliminando } from "../repositorios/eliminacionCuenta.repositorio"

export interface AutenticadoSolicitud extends Request {
  userId?: string
  authTime?: number
}

export function autenticacionProteccion(
  verificar: (
    token: string,
    comprobarRevocado: boolean,
  ) => Promise<{
    uid: string
    auth_time: number
  }> = (token, comprobarRevocado) =>
    getAuth().verifyIdToken(token, comprobarRevocado),
  eliminando = esCuentaEliminando,
  preparar = () => getApps().length > 0,
) {
  return async (
    solicitar: AutenticadoSolicitud,
    respuesta: Response,
    siguiente: NextFunction,
  ) => {
    const encabezado = solicitar.header("authorization")
    if (!encabezado?.startsWith("Bearer ") || !preparar()) {
      respuesta.status(401).json({ error: "Autenticación requerida." })
      return
    }
    try {
      const token = await verificar(encabezado.slice(7), true)
      if (await eliminando(token.uid)) {
        respuesta
          .status(403)
          .json({ error: "La cuenta está en proceso de eliminación." })
        return
      }
      solicitar.userId = token.uid
      solicitar.authTime = token.auth_time
      siguiente()
    } catch {
      console.error("auth.token_verification_failed")
      respuesta.status(401).json({ error: "Token inválido." })
    }
  }
}

export const exigirAutenticacion = autenticacionProteccion()
