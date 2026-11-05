import type { Request, Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import {
  verificarRecienteAutenticacion,
  continuarCuentaEliminacion,
  RecienteAutenticacionError,
  reintentarPendienteEliminaciones,
} from "../servicios/eliminacionCuenta.servicio"
import {
  prepararCuentaEliminacion,
  EliminacionComprobanteError,
  CuentaEliminacionBloqueadoError,
} from "../repositorios/eliminacionCuenta.repositorio"

export async function prepararEliminacion(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  respuesta.setHeader("Cache-Control", "no-store")
  if (!solicitar.userId) {
    respuesta.sendStatus(401)
    return
  }
  if (
    !solicitar.body ||
    typeof solicitar.body !== "object" ||
    Array.isArray(solicitar.body) ||
    Object.keys(solicitar.body).length !== 1 ||
    solicitar.body.confirmed !== true ||
    Object.keys(solicitar.query).length
  ) {
    respuesta.status(400).json({
      error: "Confirmá expresamente la eliminación sin indicar otra cuenta.",
    })
    return
  }
  try {
    verificarRecienteAutenticacion(solicitar.authTime)
    respuesta.json({
      ticket: await prepararCuentaEliminacion(solicitar.userId),
    })
  } catch (error) {
    respuesta
      .status(
        error instanceof RecienteAutenticacionError
          ? 401
          : error instanceof CuentaEliminacionBloqueadoError
            ? 409
            : 503,
      )
      .json({
        error:
          error instanceof RecienteAutenticacionError
            ? error.message
            : "No pudimos preparar la eliminación. Reintentá.",
      })
  }
}

export async function continuarEliminacion(
  solicitar: Request,
  respuesta: Response,
) {
  respuesta.setHeader("Cache-Control", "no-store")
  if (
    !solicitar.body ||
    typeof solicitar.body !== "object" ||
    Array.isArray(solicitar.body) ||
    Object.keys(solicitar.body).length !== 1 ||
    !("ticket" in solicitar.body) ||
    Object.keys(solicitar.query).length
  ) {
    respuesta.status(400).json({ error: "Solicitud de eliminación inválida." })
    return
  }
  try {
    const resultado = await continuarCuentaEliminacion(solicitar.body.ticket)
    respuesta
      .status(resultado.status === "completed" ? 200 : 202)
      .json(resultado)
  } catch (error) {
    respuesta
      .status(error instanceof EliminacionComprobanteError ? 401 : 503)
      .json({
        error:
          error instanceof EliminacionComprobanteError
            ? "El comprobante de eliminación no es válido o venció."
            : "No pudimos confirmar la eliminación. Conservá el comprobante y reintentá.",
      })
  }
}

export async function reintentarEliminaciones(
  solicitud: Request,
  respuesta: Response,
) {
  try {
    respuesta.json(await reintentarPendienteEliminaciones())
  } catch {
    console.error("account_deletion.retry_failed")
    respuesta.status(503).json({
      error: "No se pudieron reintentar las eliminaciones pendientes.",
    })
  }
}
