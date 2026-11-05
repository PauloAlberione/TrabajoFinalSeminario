import { createReadStream } from "node:fs"
import { pipeline } from "node:stream/promises"
import type { Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import {
  crearResultadosPdf,
  interpretarPdfExportarConsulta,
  PdfExportarError,
} from "../servicios/exportacionPdf.servicio"
import { HistorialConsultaError } from "../utilidades/consultaHistorial"

export function crearPdfExportarControlador(exportador = crearResultadosPdf) {
  return async function exportResultsPdf(
    solicitar: AutenticadoSolicitud,
    respuesta: Response,
  ) {
    if (!solicitar.userId) {
      respuesta.status(401).json({ error: "Autenticación requerida." })
      return
    }
    const abortar = new AbortController()
    const alCerrar = () => {
      if (!respuesta.writableFinished) abortar.abort()
    }
    respuesta.on("close", alCerrar)
    let archivo: Awaited<ReturnType<typeof crearResultadosPdf>> | undefined
    try {
      const consulta = interpretarPdfExportarConsulta(solicitar.query)
      archivo = await exportador(solicitar.userId, consulta, abortar.signal)
      respuesta.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${archivo.filename}"`,
        "Content-Length": String(archivo.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      })
      await pipeline(createReadStream(archivo.path), respuesta, {
        signal: abortar.signal,
      })
    } catch (error) {
      if (abortar.signal.aborted || respuesta.destroyed) return
      if (respuesta.headersSent) {
        respuesta.destroy()
        return
      }
      if (
        error instanceof HistorialConsultaError ||
        error instanceof PdfExportarError
      ) {
        respuesta
          .status(error instanceof PdfExportarError ? error.status : 400)
          .json({ error: error.message })
        return
      }
      console.error("pdf.export_failed", error)
      respuesta
        .status(503)
        .json({ error: "No pudimos generar el PDF. Intentá nuevamente." })
    } finally {
      respuesta.off("close", alCerrar)
      await archivo?.cleanup()
    }
  }
}

export const exportarResultadosPdf = crearPdfExportarControlador()
