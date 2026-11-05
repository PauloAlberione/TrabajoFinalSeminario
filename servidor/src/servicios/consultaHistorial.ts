import { HistorialConsultaError } from "../utilidades/consultaHistorial"

export { HistorialConsultaError } from "../utilidades/consultaHistorial"

import {
  CATEGORIA_IDS,
  normalizarCategoria,
} from "../../../compartido/resultados"
import { DIFICULTAD_NIVELES } from "../tipos/dominio"
import { tiposMemoria } from "../../../compartido/memoria"
import { tiposLenguaje } from "../../../compartido/lenguaje"
import { tiposCalculo } from "../../../compartido/calculo"
import { tiposAtencion } from "../../../compartido/atencionReconocimiento"
import { tiposVelocidad } from "../../../compartido/velocidad"
import type { ConsultaHistorial } from "../../../compartido/historial"

export function interpretarHistorialConsulta(
  entrada: Record<string, unknown>,
): ConsultaHistorial & {
  paginated: boolean
} {
  const claves = [
    "category",
    "exercise",
    "difficulty",
    "from",
    "to",
    "cursor",
    "limit",
    "includeDetails",
    "paginated",
  ]
  if (Object.keys(entrada).some((clave) => !claves.includes(clave)))
    throw new HistorialConsultaError("Filtro de historial inválido.")
  for (const valor of Object.values(entrada))
    if (typeof valor !== "string")
      throw new HistorialConsultaError("Filtro de historial inválido.")
  const categoria = entrada.category
    ? normalizarCategoria(String(entrada.category))
    : undefined
  if (
    categoria &&
    !CATEGORIA_IDS.includes(categoria as typeof CATEGORIA_IDS[number])
  )
    throw new HistorialConsultaError("Categoría inválida.")
  const tipos: string[] = [
    ...tiposMemoria,
    ...tiposLenguaje,
    ...tiposCalculo,
    ...tiposAtencion,
    ...tiposVelocidad,
    "memoryPairs",
  ]
  if (entrada.exercise && !tipos.includes(String(entrada.exercise)))
    throw new HistorialConsultaError("Ejercicio inválido.")
  if (
    entrada.difficulty &&
    !DIFICULTAD_NIVELES.includes(
      entrada.difficulty as typeof DIFICULTAD_NIVELES[number],
    )
  )
    throw new HistorialConsultaError("Dificultad inválida.")
  const paginado = entrada.paginated === "true"
  if (
    entrada.paginated !== undefined &&
    !["true", "false"].includes(String(entrada.paginated))
  )
    throw new HistorialConsultaError("Formato de consulta inválido.")
  if (
    entrada.includeDetails !== undefined &&
    !["true", "false"].includes(String(entrada.includeDetails))
  )
    throw new HistorialConsultaError("Formato de consulta inválido.")
  const limite =
    entrada.limit === undefined ? (paginado ? 20 : 100) : Number(entrada.limit)
  if (!Number.isInteger(limite) || limite < 1 || limite > 100)
    throw new HistorialConsultaError(
      "El tamaño de página debe estar entre 1 y 100.",
    )
  const fechas: {
    from?: string
    to?: string
  } = {}
  for (const clave of ["from", "to"] as const)
    if (entrada[clave]) {
      const valor = String(entrada[clave])
      if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(valor) ||
        !Number.isFinite(Date.parse(valor))
      )
        throw new HistorialConsultaError("Fecha inválida.")
      const interpretado = new Date(valor)
      if (
        interpretado.getUTCFullYear() < 1 ||
        interpretado.toISOString().slice(0, 10) !== valor.slice(0, 10)
      )
        throw new HistorialConsultaError("Fecha inválida.")
      fechas[clave] = interpretado.toISOString()
    }
  if (fechas.from && fechas.to && fechas.from >= fechas.to)
    throw new HistorialConsultaError(
      "La fecha inicial debe ser anterior a la final.",
    )
  if (
    entrada.cursor &&
    (String(entrada.cursor).length > 3000 ||
      !/^[\w-]+$/.test(String(entrada.cursor)))
  )
    throw new HistorialConsultaError("Cursor inválido.")
  return {
    paginated: paginado,
    limit: limite,
    category: categoria as ConsultaHistorial["category"],
    exercise: entrada.exercise as string | undefined,
    difficulty: entrada.difficulty as ConsultaHistorial["difficulty"],
    ...fechas,
    cursor: entrada.cursor as string | undefined,
    includeDetails:
      entrada.includeDetails === undefined
        ? !paginado
        : entrada.includeDetails === "true",
  }
}
