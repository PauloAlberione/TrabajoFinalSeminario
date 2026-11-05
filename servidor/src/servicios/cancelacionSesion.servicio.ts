import {
  listarSesionesCanceladas,
  obtenerSesionCancelada,
} from "../repositorios/cancelaciones.repositorio"
import { presentarCancelacion } from "./avanceParcial.servicio"
import { modificarEjercicioSesion } from "../repositorios/sesion.repositorio"
import { validarPuntoControl } from "./sesionPuntoControl"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
import type { PuntoControlEjercicio } from "../../../compartido/sesionEjercicio"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"

export class CancelacionSesionError extends Error {
  constructor(
    mensaje: string,
    public status = 409,
  ) {
    super(mensaje)
  }
}

export function cambiosCancelacion(
  actual: Record<string, unknown>,
  puntoLocal?: unknown,
  token?: unknown,
  origen: "pendingList" | "exercise" = "pendingList",
): Record<string, unknown> {
  if (actual.status === "cancelled") return {}
  if (actual.status === "saving" || actual.pendingResult)
    throw new CancelacionSesionError(
      "El resultado ya está en proceso de guardado. Recuperá la actividad para completar el envío.",
    )
  if (!["created", "active", "paused"].includes(String(actual.status)))
    throw new CancelacionSesionError(
      "Esta actividad ya terminó y no se puede cancelar.",
    )
  let punto = actual.checkpoint as PuntoControlEjercicio | undefined
  if (
    puntoLocal !== undefined &&
    typeof token === "string" &&
    token === actual.ownerToken &&
    (puntoLocal as PuntoControlEjercicio | null)?.writerToken === token
  ) {
    const local = validarPuntoControl(
      actual.exercise as InstanciaEjercicio,
      puntoLocal,
    )
    if (
      !punto ||
      punto.writerToken !== token ||
      Number(local.sequence ?? 0) > Number(punto.sequence ?? -1)
    )
      punto = { ...local, writerToken: token }
  }
  return {
    status: "cancelled",
    leaseExpiresAt: 0,
    cancellation: { version: 1, origin: origen },
    ...(punto ? { checkpoint: punto } : {}),
  }
}

export async function cancelarSesionPendiente(
  uid: string,
  id: string,
  puntoLocal?: unknown,
  token?: unknown,
  baseDatos = obtenerFirestoreAdmin(),
) {
  if (!/^[\w-]+$/.test(id))
    throw new CancelacionSesionError("Actividad inválida.", 400)
  const sesion = await modificarEjercicioSesion(
    uid,
    id,
    (actual) => cambiosCancelacion(actual, puntoLocal, token),
    baseDatos,
  )
  return { id: sesion.id, status: sesion.status }
}

export { ConsultaCanceladasError } from "../repositorios/cancelaciones.repositorio"

export async function listarCancelaciones(
  uid: string,
  consulta: Record<string, unknown> = {},
  baseDatos = obtenerFirestoreAdmin(),
) {
  const pagina = await listarSesionesCanceladas(uid, consulta, baseDatos)
  return {
    ...pagina,
    items: pagina.items.map((documento) =>
      presentarCancelacion(documento.id, documento.data),
    ),
  }
}

export async function obtenerCancelacion(
  uid: string,
  id: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  const documento = await obtenerSesionCancelada(uid, id, baseDatos)
  return documento
    ? presentarCancelacion(documento.id, documento.data, true)
    : null
}
