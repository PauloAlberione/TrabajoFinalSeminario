import { Router } from "express"
import { estadisticas } from "../controladores/estadisticas.controlador"
import { exigirAutenticacion } from "../intermediarios/autenticacion.intermediario"

export const estadisticasEnrutador = Router()

estadisticasEnrutador.get("/", exigirAutenticacion, estadisticas)
