import {
  cancelarSesionPendiente,
  CancelacionSesionError,
} from "../servicios/cancelacionSesion.servicio"
import {
  listarCancelaciones,
  obtenerCancelacion,
  ConsultaCanceladasError,
} from "../servicios/cancelacionSesion.servicio"
import type { Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import {
  cambiarSesionEstado,
  iniciarSesion,
  obtenerSesion,
  recuperarSesion,
  comenzarSesionGuardar,
  obtenerPendienteSesiones,
} from "../servicios/sesion.servicio"

export async function crearSesion(
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
      .json(
        await iniciarSesion(
          solicitar.userId,
          solicitar.body?.exerciseType,
          solicitar.body?.resumable === true,
        ),
      )
  } catch {
    respuesta.status(400).json({
      error:
        "No se pudo iniciar la sesión. Revisá el ejercicio e intentá nuevamente.",
    })
  }
}

export async function modificarSesion(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  try {
    respuesta.json(
      await cambiarSesionEstado(
        solicitar.userId,
        String(solicitar.params.sessionId),
        solicitar.body.status,
        solicitar.body.checkpoint,
        solicitar.body.ownerToken,
      ),
    )
  } catch (error) {
    respuesta
      .status(400)
      .json({ error: "No se pudo cambiar el estado de la sesión." })
  }
}

export async function leerSesion(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  try {
    respuesta.json(
      await obtenerSesion(
        solicitar.userId!,
        String(solicitar.params.sessionId),
      ),
    )
  } catch {
    respuesta.status(404).json({ error: "No pudimos recuperar la sesión." })
  }
}

export async function reservaSesion(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  try {
    respuesta.json(
      await recuperarSesion(
        solicitar.userId!,
        String(solicitar.params.sessionId),
      ),
    )
  } catch {
    respuesta
      .status(409)
      .json({ error: "Esta sesión ya terminó o no se puede recuperar." })
  }
}

export async function guardarSesion(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  try {
    respuesta.json(
      await comenzarSesionGuardar(
        solicitar.userId!,
        String(solicitar.params.sessionId),
        solicitar.body.result,
        solicitar.body.ownerToken,
      ),
    )
  } catch {
    respuesta.status(409).json({
      error:
        "No pudimos proteger el guardado. Revisá si la sesión sigue abierta en otra pestaña.",
    })
  }
}

export async function pendienteSesiones(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  try {
    respuesta.json(await obtenerPendienteSesiones(solicitar.userId!))
  } catch {
    respuesta
      .status(503)
      .json({ error: "No pudimos consultar las sesiones pendientes." })
  }
}

export async function cancelarPendiente(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  if (
    !solicitar.body ||
    Object.keys(solicitar.body).some(
      (clave) => !["checkpoint", "ownerToken"].includes(clave),
    )
  ) {
    respuesta.status(400).json({ error: "Solicitud de cancelación inválida." })
    return
  }
  respuesta.setHeader("Cache-Control", "no-store")
  try {
    respuesta.json(
      await cancelarSesionPendiente(
        solicitar.userId,
        String(solicitar.params.sessionId),
        solicitar.body.checkpoint,
        solicitar.body.ownerToken,
      ),
    )
  } catch (error) {
    respuesta
      .status(error instanceof CancelacionSesionError ? error.status : 400)
      .json({
        error:
          error instanceof CancelacionSesionError
            ? error.message
            : "No pudimos cancelar la actividad. Conservamos el avance; intentá nuevamente.",
      })
  }
}

export async function canceladas(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  respuesta.setHeader("Cache-Control", "no-store")
  try {
    respuesta.json(await listarCancelaciones(solicitar.userId, solicitar.query))
  } catch (error) {
    respuesta
      .status(error instanceof ConsultaCanceladasError ? 400 : 503)
      .json({
        error:
          error instanceof ConsultaCanceladasError
            ? error.message
            : "No pudimos consultar las actividades canceladas.",
      })
  }
}

export async function detalleCancelada(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  respuesta.setHeader("Cache-Control", "no-store")
  try {
    const actividad = await obtenerCancelacion(
      solicitar.userId,
      String(solicitar.params.sessionId),
    )
    if (!actividad) {
      respuesta
        .status(404)
        .json({ error: "No encontramos esta actividad cancelada." })
      return
    }
    respuesta.json(actividad)
  } catch {
    respuesta
      .status(400)
      .json({ error: "No pudimos consultar el avance guardado." })
  }
}
