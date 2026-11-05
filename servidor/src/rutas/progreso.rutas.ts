import { Router } from "express"
import {
  obtenerFuncionProgreso,
  listaProgreso,
} from "../controladores/progreso.controlador"
import { exigirAutenticacion } from "../intermediarios/autenticacion.intermediario"

export const progresoEnrutador = Router()

progresoEnrutador.get("/", exigirAutenticacion, listaProgreso)

progresoEnrutador.get(
  "/:cognitiveFunctionId",
  exigirAutenticacion,
  obtenerFuncionProgreso,
)
