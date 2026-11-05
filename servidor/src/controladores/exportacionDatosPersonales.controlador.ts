import { createReadStream } from "node:fs"
import { pipeline } from "node:stream/promises"
import type { Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import { crearPersonalDatosExportar } from "../servicios/exportacionDatosPersonales.servicio"

export function crearPersonalDatosExportarControlador(
  exportador = crearPersonalDatosExportar,
) {
  return async (solicitar: AutenticadoSolicitud, respuesta: Response) => {
    if (!solicitar.userId) {
      respuesta.status(401).json({ error: "Autenticación requerida." })
      return
    }
    if (Object.keys(solicitar.query).length) {
      respuesta.status(400).json({
        error:
          "La exportación solo admite los datos de tu propia cuenta, sin parámetros.",
      })
      return
    }
    const abortar = new AbortController()
    const alCerrar = () => {
      if (!respuesta.writableFinished) abortar.abort()
    }
    respuesta.on("close", alCerrar)
    let archivo: Awaited<ReturnType<typeof crearPersonalDatosExportar>> | undefined
    try {
      archivo = await exportador(solicitar.userId, abortar.signal)
      respuesta.set({
        "Content-Type": "application/json; charset=utf-8",
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
      console.error("personal_data.export_failed", error)
      respuesta.status(503).json({
        error: "No pudimos preparar la copia de tus datos. Intentá nuevamente.",
      })
    } finally {
      respuesta.off("close", alCerrar)
      await archivo?.cleanup()
    }
  }
}

export const exportarPersonalDatos = crearPersonalDatosExportarControlador()
