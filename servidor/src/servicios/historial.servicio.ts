import {
  obtenerResultado,
  listaResultadoPagina,
} from "../repositorios/resultado.repositorio"
import { interpretarHistorialConsulta } from "./consultaHistorial"

export async function obtenerHistorial(
  uid: string,
  entrada: Record<string, unknown>,
) {
  const opciones = interpretarHistorialConsulta(entrada)
  const pagina = await listaResultadoPagina(uid, opciones)
  return opciones.paginated ? pagina : pagina.items
}

export async function obtenerHistorialDetalle(
  uid: string,
  idSesion: string,
  resultadoId: string,
) {
  return obtenerResultado(uid, idSesion, resultadoId)
}
