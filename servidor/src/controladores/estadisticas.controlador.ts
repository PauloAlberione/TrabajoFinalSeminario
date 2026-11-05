import type { Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import type { EstadisticasRango } from "../../../compartido/estadisticas"
import { obtenerEstadisticas } from "../servicios/estadisticas.servicio"

export async function estadisticas(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  const { range: rango = "30", timeZone: tiempoZona = "UTC" } = solicitar.query
  if (
    Object.keys(solicitar.query).some(
      (clave) => !["range", "timeZone"].includes(clave),
    ) ||
    typeof rango !== "string" ||
    !["7", "30", "90", "all"].includes(rango) ||
    typeof tiempoZona !== "string" ||
    tiempoZona.length > 100
  ) {
    respuesta.status(400).json({ error: "Filtros de estadísticas inválidos." })
    return
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: tiempoZona }).format()
  } catch {
    respuesta.status(400).json({ error: "Zona horaria inválida." })
    return
  }
  try {
    respuesta.json(
      await obtenerEstadisticas(
        solicitar.userId,
        rango as EstadisticasRango,
        tiempoZona,
      ),
    )
  } catch (error) {
    console.error("statistics.read_failed", error)
    respuesta.status(503).json({
      error: "No pudimos cargar tus estadísticas. Intentá nuevamente.",
    })
  }
}
