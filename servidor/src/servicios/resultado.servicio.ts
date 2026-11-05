import {
  tiposVelocidad,
  type TipoVelocidad,
} from "../../../compartido/velocidad"
import {
  tiposAtencion,
  type TipoAtencion,
} from "../../../compartido/atencionReconocimiento"
import { tiposCalculo, type TipoCalculo } from "../../../compartido/calculo"
import { tiposLenguaje, type TipoLenguaje } from "../../../compartido/lenguaje"
import { tiposMemoria, type TipoMemoria } from "../../../compartido/memoria"
import { procesarSesionResultado } from "./resultadoEjercicio.servicio"
import type {
  IdFuncionCognitiva,
  EjercicioResultadoEntrada,
  EjercicioTipo,
} from "../tipos/dominio"

export type { SesionResultadoSolicitud } from "../../../compartido/resultados"

import type { SesionResultadoSolicitud } from "../../../compartido/resultados"

interface AnteriorResultadoSolicitud extends EjercicioResultadoEntrada {
  exerciseId: string
  exerciseType: Exclude<EjercicioTipo, TipoMemoria | TipoLenguaje | TipoCalculo | TipoAtencion | TipoVelocidad>
  cognitiveFunctionId: IdFuncionCognitiva
  sessionId?: string
}

export type ProcesarResultadoSolicitud = SesionResultadoSolicitud | AnteriorResultadoSolicitud

function esSesionResultado(
  solicitar: ProcesarResultadoSolicitud,
): solicitar is SesionResultadoSolicitud {
  return (
    tiposMemoria.includes(solicitar.exerciseType as TipoMemoria) ||
    tiposLenguaje.includes(solicitar.exerciseType as TipoLenguaje) ||
    tiposCalculo.includes(solicitar.exerciseType as TipoCalculo) ||
    tiposAtencion.includes(solicitar.exerciseType as TipoAtencion) ||
    tiposVelocidad.includes(solicitar.exerciseType as TipoVelocidad)
  )
}

export async function procesarEjercicioResultado(
  idUsuario: string,
  solicitar: ProcesarResultadoSolicitud,
) {
  if (esSesionResultado(solicitar))
    return procesarSesionResultado(idUsuario, solicitar)
  throw new Error(
    "Iniciá un ejercicio desde su tarjeta para registrar el resultado.",
  )
}
