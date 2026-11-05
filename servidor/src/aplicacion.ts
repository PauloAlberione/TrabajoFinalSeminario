import { recordatorioEnrutador } from "./rutas/recordatorio.rutas"
import express from "express"
import { estadisticasEnrutador } from "./rutas/estadisticas.rutas"
import { resultadoEnrutador } from "./rutas/resultado.rutas"
import { usuarioEnrutador } from "./rutas/usuario.rutas"
import { progresoEnrutador } from "./rutas/progreso.rutas"
import { sesionEnrutador } from "./rutas/sesion.rutas"
import { errorManejador } from "./intermediarios/manejadorErrores"

export const aplicacion = express()

aplicacion.use((solicitar, respuesta, siguiente) => {
  const solicitudOrigen = solicitar.header("origin")
  const permitidoOrigenes = (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean)
  if (
    solicitudOrigen &&
    (permitidoOrigenes.includes(solicitudOrigen) ||
      permitidoOrigenes.includes("*"))
  )
    respuesta.header("Access-Control-Allow-Origin", solicitudOrigen)
  respuesta.header("Vary", "Origin")
  respuesta.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  )
  respuesta.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
  if (solicitar.method === "OPTIONS") {
    respuesta.sendStatus(204)
    return
  }
  siguiente()
})

aplicacion.use(express.json({ limit: "256kb" }))

aplicacion.get("/health", (solicitud, respuesta) =>
  respuesta.json({ ok: true }),
)

aplicacion.use("/api/reminders", recordatorioEnrutador)

aplicacion.use("/api/statistics", estadisticasEnrutador)

aplicacion.use("/api/results", resultadoEnrutador)

aplicacion.use("/api/users", usuarioEnrutador)

aplicacion.use("/api/progress", progresoEnrutador)

aplicacion.use("/api/sessions", sesionEnrutador)

aplicacion.use(errorManejador)
