import { cambiosCancelacion } from "./cancelacionSesion.servicio"
import { efectivoSesionEstado } from "../../../compartido/sesionEjercicio"
import { randomUUID } from "node:crypto"
import { validarPuntoControl } from "./sesionPuntoControl"
import {
  modificarEjercicioSesion,
  leerEjercicioSesion,
  listaRecuperableSesiones,
  verificarSesionPropietario,
  SESION_ARRENDAMIENTO_MS,
} from "../repositorios/sesion.repositorio"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
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
import {
  crearSesion,
  type EstadoSesion,
  crearEjercicioSesion,
} from "../repositorios/sesion.repositorio"
import { obtenerProgreso } from "../repositorios/progreso.repositorio"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { tiposMemoria, type TipoMemoria } from "../../../compartido/memoria"

export async function iniciarSesion(
  idUsuario: string,
  ejercicioTipo?: unknown,
  recuperable = false,
) {
  if (ejercicioTipo === undefined) return crearSesion(idUsuario)
  if (
    ![
      ...tiposMemoria,
      ...tiposLenguaje,
      ...tiposCalculo,
      ...tiposAtencion,
      ...tiposVelocidad,
    ].includes(
      ejercicioTipo as TipoMemoria | TipoLenguaje | TipoCalculo | TipoAtencion | TipoVelocidad,
    )
  )
    throw new Error("Ejercicio inválido.")
  const estrategia = obtenerEjercicioEstrategia(
    ejercicioTipo as TipoMemoria | TipoLenguaje | TipoCalculo | TipoAtencion | TipoVelocidad,
  )
  await obtenerProgreso(idUsuario, estrategia.cognitiveFunctionId)
  return crearEjercicioSesion(
    idUsuario,
    estrategia.cognitiveFunctionId,
    (nivel) => estrategia.generateExercise(nivel),
    undefined,
    recuperable,
  )
}

function validoSesionId(id: string) {
  if (!/^[\w-]+$/.test(id)) throw new Error("Sesión inválida.")
}

export async function obtenerSesion(idUsuario: string, idSesion: string) {
  validoSesionId(idSesion)
  return leerEjercicioSesion(idUsuario, idSesion)
}

export function sesionCambios(
  actual: Record<string, unknown>,
  estado: unknown,
  puntoControl: unknown,
  token: unknown,
) {
  verificarSesionPropietario(actual, token)
  const transiciones: Record<string, string[]> = {
    created: ["active", "paused", "cancelled"],
    active: ["active", "paused", "completed", "cancelled"],
    paused: ["paused", "active", "cancelled"],
    saving: [],
    completed: [],
    cancelled: ["cancelled"],
  }
  if (
    typeof estado !== "string" ||
    !transiciones[String(actual.status)]?.includes(estado)
  )
    throw new Error("Cambio de estado inválido.")
  if (actual.status === "cancelled" && estado === "cancelled") return {}
  if (actual.exercise && estado === "completed")
    throw new Error("Finalizá enviando el resultado.")
  const guardado =
    puntoControl === undefined
      ? {}
      : {
          checkpoint: {
            ...validarPuntoControl(
              actual.exercise as InstanciaEjercicio,
              puntoControl,
            ),
            writerToken: String(actual.ownerToken ?? ""),
          },
        }
  if (
    guardado.checkpoint &&
    actual.checkpoint &&
    (actual.checkpoint as {
      writerToken?: string
    }).writerToken === actual.ownerToken &&
    Number(guardado.checkpoint.sequence ?? 0) <=
      Number(
        (actual.checkpoint as {
          sequence?: number
        }).sequence ?? -1,
      )
  )
    throw new Error("Estado desactualizado.")
  if (estado === "cancelled")
    return {
      ...guardado,
      ...cambiosCancelacion(
        { ...actual, ...guardado },
        undefined,
        undefined,
        "exercise",
      ),
    }
  return {
    ...guardado,
    status: estado,
    ...(estado === "active"
      ? { leaseExpiresAt: Date.now() + SESION_ARRENDAMIENTO_MS }
      : {}),
  }
}

export async function cambiarSesionEstado(
  idUsuario: string,
  idSesion: string,
  estado: EstadoSesion,
  puntoControl?: unknown,
  token?: unknown,
) {
  validoSesionId(idSesion)
  return modificarEjercicioSesion(idUsuario, idSesion, (actual) =>
    sesionCambios(actual, estado, puntoControl, token),
  )
}

export function recuperacionCambios(actual: Record<string, unknown>) {
  if (
    !["created", "active", "paused", "saving"].includes(String(actual.status))
  )
    throw new Error("Esta sesión ya terminó.")
  return {
    status: actual.status === "saving" ? "saving" : "paused",
    ownerToken: randomUUID(),
    leaseExpiresAt: 0,
  }
}

export async function recuperarSesion(idUsuario: string, idSesion: string) {
  validoSesionId(idSesion)
  let anteriorPropietarioToken: unknown
  const recuperado = await modificarEjercicioSesion(
    idUsuario,
    idSesion,
    (actual) => {
      anteriorPropietarioToken = actual.ownerToken
      return recuperacionCambios(actual)
    },
  )
  return { ...recuperado, previousOwnerToken: anteriorPropietarioToken }
}

export function guardandoCambios(
  actual: Record<string, unknown>,
  resultado: unknown,
  token: unknown,
) {
  verificarSesionPropietario(actual, token)
  if (actual.status === "completed") return {}
  if (actual.status === "saving") return {}
  if (
    efectivoSesionEstado(
      actual as {
        status: string
        leaseExpiresAt?: number
      },
    ) !== "active"
  )
    throw new Error("La sesión no está activa.")
  const solicitar = resultado as {
    exerciseId?: unknown
    exerciseType?: unknown
    cognitiveFunctionId?: unknown
    response?: unknown
  }
  const ejercicio = actual.exercise as InstanciaEjercicio
  if (
    !solicitar ||
    solicitar.exerciseId !== ejercicio.id ||
    solicitar.exerciseType !== ejercicio.type ||
    solicitar.cognitiveFunctionId !== ejercicio.cognitiveFunctionId
  )
    throw new Error("Ejercicio inválido.")
  // Valida la respuesta final antes de bloquear la cancelación; aquí no se guardan resultados ni progresión.
  obtenerEjercicioEstrategia(ejercicio.type).evaluateResponse(
    ejercicio,
    solicitar.response,
    0,
  )
  return {
    status: "saving",
    pendingResult: {
      exerciseId: ejercicio.id,
      exerciseType: ejercicio.type,
      cognitiveFunctionId: ejercicio.cognitiveFunctionId,
      response: solicitar.response,
    },
  }
}

export async function comenzarSesionGuardar(
  idUsuario: string,
  idSesion: string,
  resultado: unknown,
  token: unknown,
) {
  validoSesionId(idSesion)
  return modificarEjercicioSesion(idUsuario, idSesion, (actual) =>
    guardandoCambios(actual, resultado, token),
  )
}

export async function obtenerPendienteSesiones(idUsuario: string) {
  return listaRecuperableSesiones(idUsuario)
}
