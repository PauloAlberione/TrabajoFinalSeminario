export interface PuntoControlEjercicio<State = Record<string, unknown>> {
  sequence?: number
  writerToken?: string
  version: 1
  exerciseId: string
  phase: string
  step: number
  activeSeconds: number
  state: State
}

export const SESION_ARRENDAMIENTO_MS = 30000

export type EstadoSesion = "created" | "active" | "paused" | "saving" | "completed" | "cancelled"

export function efectivoSesionEstado(
  sesion: {
    status: string
    leaseExpiresAt?: number
  },
  ahora = Date.now(),
) {
  return sesion.status === "active" &&
    sesion.leaseExpiresAt !== undefined &&
    sesion.leaseExpiresAt <= ahora
    ? "paused"
    : sesion.status
}

export function verificarSesionPropietario(
  sesion: { ownerToken?: unknown },
  token: unknown,
) {
  if (sesion.ownerToken && sesion.ownerToken !== token)
    throw new Error(
      "Esta sesión se recuperó en otra pestaña. Volvé a abrirla para continuar.",
    )
}
