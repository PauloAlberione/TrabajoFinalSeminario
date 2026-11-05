import type { Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import {
  procesarEjercicioResultado,
  type ProcesarResultadoSolicitud,
} from "../servicios/resultado.servicio"
import {
  obtenerHistorial,
  obtenerHistorialDetalle,
} from "../servicios/historial.servicio"
import { HistorialConsultaError } from "../servicios/consultaHistorial"

export async function crearResultado(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  try {
    const resultado = await procesarEjercicioResultado(
      solicitar.userId,
      solicitar.body as ProcesarResultadoSolicitud,
    )
    respuesta.status(201).json(resultado)
  } catch (error) {
    respuesta.status(400).json({
      error:
        "No se pudo guardar el resultado. Revisá la sesión e intentá nuevamente.",
    })
  }
}

export async function obtenerResultados(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  try {
    respuesta.json(await obtenerHistorial(solicitar.userId, solicitar.query))
  } catch (error) {
    if (error instanceof HistorialConsultaError) {
      respuesta.status(400).json({ error: error.message })
      return
    }
    console.error("history.load_failed", error)
    respuesta
      .status(503)
      .json({ error: "No pudimos cargar tu historial. Intentá nuevamente." })
  }
}

export async function obtenerResultadoDetalle(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  try {
    const resultado = await obtenerHistorialDetalle(
      solicitar.userId,
      String(solicitar.params.sessionId),
      String(solicitar.params.resultId),
    )
    if (!resultado) {
      respuesta
        .status(404)
        .json({ error: "No encontramos este resultado en tu historial." })
      return
    }
    respuesta.json(resultado)
  } catch (error) {
    if (error instanceof HistorialConsultaError) {
      respuesta.status(400).json({ error: error.message })
      return
    }
    console.error("history.detail_failed", error)
    respuesta
      .status(503)
      .json({ error: "No pudimos cargar el detalle. Intentá nuevamente." })
  }
}
