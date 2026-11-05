import type { Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import { obtenerProgreso } from "../repositorios/progreso.repositorio"
import {
  CATEGORIA_IDS,
  normalizarCategoria,
  type IdFuncionCognitiva,
} from "../../../compartido/resultados"

const funciones: readonly IdFuncionCognitiva[] = CATEGORIA_IDS

export async function listaProgreso(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (!solicitar.userId) {
    respuesta.status(401).json({ error: "Autenticación requerida." })
    return
  }
  respuesta.json(
    await Promise.all(
      funciones.map((funcionId) =>
        obtenerProgreso(solicitar.userId!, funcionId),
      ),
    ),
  )
}

export async function obtenerFuncionProgreso(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  if (
    !solicitar.userId ||
    !funciones.includes(
      normalizarCategoria(
        String(solicitar.params.cognitiveFunctionId),
      ) as IdFuncionCognitiva,
    )
  ) {
    respuesta.status(400).json({ error: "Función cognitiva inválida." })
    return
  }
  respuesta.json(
    await obtenerProgreso(
      solicitar.userId,
      normalizarCategoria(
        String(solicitar.params.cognitiveFunctionId),
      ) as IdFuncionCognitiva,
    ),
  )
}
