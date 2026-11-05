import {
  cancelarPendiente,
  canceladas,
  detalleCancelada,
} from "../controladores/sesion.controlador"
import { Router } from "express"
import {
  modificarSesion,
  crearSesion,
  leerSesion,
  reservaSesion,
  guardarSesion,
  pendienteSesiones,
} from "../controladores/sesion.controlador"
import { exigirAutenticacion } from "../intermediarios/autenticacion.intermediario"

export const sesionEnrutador = Router()

sesionEnrutador.post("/", exigirAutenticacion, crearSesion)

sesionEnrutador.patch("/:sessionId", exigirAutenticacion, modificarSesion)

sesionEnrutador.get("/cancelled", exigirAutenticacion, canceladas)

sesionEnrutador.get(
  "/cancelled/:sessionId",
  exigirAutenticacion,
  detalleCancelada,
)

sesionEnrutador.post(
  "/:sessionId/cancel",
  exigirAutenticacion,
  cancelarPendiente,
)

sesionEnrutador.get("/:sessionId", exigirAutenticacion, leerSesion)

sesionEnrutador.post("/:sessionId/recover", exigirAutenticacion, reservaSesion)

sesionEnrutador.post("/:sessionId/save", exigirAutenticacion, guardarSesion)

sesionEnrutador.get("/", exigirAutenticacion, pendienteSesiones)
