import { Router } from "express"
import { exigirAutenticacion } from "../intermediarios/autenticacion.intermediario"
import { exigirRecordatorioProgramador } from "../intermediarios/programador.intermediario"
import {
  obtenerRecordatorios,
  modificarRecordatorios,
  ejecutarRecordatorios,
  darBajaRecordatorios,
} from "../controladores/recordatorio.controlador"

export const recordatorioEnrutador = Router()

recordatorioEnrutador.get("/me", exigirAutenticacion, obtenerRecordatorios)

recordatorioEnrutador.patch("/me", exigirAutenticacion, modificarRecordatorios)

recordatorioEnrutador.post(
  "/dispatch",
  exigirRecordatorioProgramador,
  ejecutarRecordatorios,
)

recordatorioEnrutador.get("/unsubscribe", darBajaRecordatorios)

recordatorioEnrutador.post("/unsubscribe", darBajaRecordatorios)
