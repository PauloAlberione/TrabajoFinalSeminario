import { exportarResultadosPdf } from "../controladores/exportacionPdf.controlador"
import { Router } from "express"
import {
  crearResultado,
  obtenerResultados,
  obtenerResultadoDetalle,
} from "../controladores/resultado.controlador"
import { exigirAutenticacion } from "../intermediarios/autenticacion.intermediario"

export const resultadoEnrutador = Router()

resultadoEnrutador.post("/", exigirAutenticacion, crearResultado)

resultadoEnrutador.get("/", exigirAutenticacion, obtenerResultados)

resultadoEnrutador.get(
  "/export/pdf",
  exigirAutenticacion,
  exportarResultadosPdf,
)

resultadoEnrutador.get(
  "/:sessionId/:resultId",
  exigirAutenticacion,
  obtenerResultadoDetalle,
)
