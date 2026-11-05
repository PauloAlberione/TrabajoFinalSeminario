import {
  prepararEliminacion,
  continuarEliminacion,
  reintentarEliminaciones,
} from "../controladores/eliminacionCuenta.controlador"
import { exigirEliminacionProgramador } from "../intermediarios/programadorEliminacion.intermediario"
import { exportarPersonalDatos } from "../controladores/exportacionDatosPersonales.controlador"
import { Router } from "express"
import {
  obtenerPerfilActual,
  modificarPerfilActual,
  crearPerfilActual,
} from "../controladores/usuario.controlador"
import { exigirAutenticacion } from "../intermediarios/autenticacion.intermediario"

export const usuarioEnrutador = Router()

usuarioEnrutador.post("/profile", exigirAutenticacion, crearPerfilActual)

usuarioEnrutador.get("/me", exigirAutenticacion, obtenerPerfilActual)

usuarioEnrutador.patch("/me", exigirAutenticacion, modificarPerfilActual)

usuarioEnrutador.get("/me/export", exigirAutenticacion, exportarPersonalDatos)

usuarioEnrutador.post(
  "/me/deletion/prepare",
  exigirAutenticacion,
  prepararEliminacion,
)

usuarioEnrutador.post("/me/deletion/continue", continuarEliminacion)

usuarioEnrutador.post(
  "/deletion-jobs/dispatch",
  exigirEliminacionProgramador,
  reintentarEliminaciones,
)
