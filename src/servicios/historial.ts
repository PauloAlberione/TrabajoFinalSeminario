import { api } from "./api"
import type {
  PaginaHistorial,
  ConsultaHistorial,
  ElementoHistorial,
} from "../../compartido/historial"

export function obtenerEjercicioHistorial(
  consulta: ConsultaHistorial,
  senal?: AbortSignal,
) {
  return api.obtenerResultados<PaginaHistorial>(
    { ...consulta, paginated: true },
    senal,
  )
}

export function obtenerEjercicioHistorialDetalle(
  idSesion: string,
  resultadoId: string,
  senal?: AbortSignal,
) {
  return api.obtenerResultadoDetalle<ElementoHistorial>(
    idSesion,
    resultadoId,
    senal,
  )
}
