import type { ErrorRequestHandler } from "express"

export const errorManejador: ErrorRequestHandler = (
  error,
  solicitud,
  respuesta,
  siguiente,
) => {
  respuesta.status(500).json({ error: "No se pudo completar la operación." })
}
