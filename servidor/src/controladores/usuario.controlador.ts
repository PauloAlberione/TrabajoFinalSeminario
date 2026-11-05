import type { Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import {
  crearPerfil,
  buscarPerfil,
  modificarPerfil,
} from "../servicios/usuario.servicio"
import { ErrorValidacionPerfil } from "../../../compartido/perfil"
import { PerfilNoEncontradoError } from "../repositorios/usuario.repositorio"

function fallo(error: unknown, respuesta: Response) {
  if (error instanceof ErrorValidacionPerfil) {
    respuesta.status(400).json({ error: error.message })
    return
  }
  if (error instanceof PerfilNoEncontradoError) {
    respuesta.status(404).json({ error: "Perfil no encontrado." })
    return
  }
  console.error("profile.request_failed", error)
  respuesta
    .status(503)
    .json({ error: "No pudimos acceder a tu perfil. Intentá nuevamente." })
}

export async function crearPerfilActual(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  try {
    respuesta
      .status(201)
      .json(await crearPerfil(solicitar.userId, solicitar.body))
  } catch (error) {
    fallo(error, respuesta)
  }
}

export async function obtenerPerfilActual(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  try {
    const perfil = await buscarPerfil(solicitar.userId)
    if (!perfil) {
      respuesta.status(404).json({ error: "Perfil no encontrado." })
      return
    }
    respuesta.json(perfil)
  } catch (error) {
    fallo(error, respuesta)
  }
}

export async function modificarPerfilActual(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  try {
    respuesta.json(await modificarPerfil(solicitar.userId, solicitar.body))
  } catch (error) {
    fallo(error, respuesta)
  }
}
