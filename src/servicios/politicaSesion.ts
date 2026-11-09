export const DURACION_SESION_HORAS = 4
export const DURACION_SESION_RECORDADA_DIAS = 7
export const SESION_POR_VENCER_EVENTO = "menteclear:session-expiring"
export const CLAVE_SESION_ACCESO = "menteclear:auth:session"

export interface ControlSesion {
  version: 1
  uid: string
  inicio: number
  mantener: boolean
}

export function vencimientoSesion(sesion: ControlSesion): number {
  const duracion = sesion.mantener
    ? DURACION_SESION_RECORDADA_DIAS * 24
    : DURACION_SESION_HORAS
  return sesion.inicio + duracion * 60 * 60 * 1000
}

export function leerControlSesion(
  texto: string | null,
  uid: string,
  ahora = Date.now(),
): ControlSesion | null {
  try {
    const valor: unknown = JSON.parse(texto ?? "null")
    if (!valor || typeof valor !== "object") return null
    const sesion = valor as Partial<ControlSesion>
    if (
      sesion.version !== 1 ||
      sesion.uid !== uid ||
      typeof sesion.mantener !== "boolean" ||
      typeof sesion.inicio !== "number" ||
      !Number.isFinite(sesion.inicio) ||
      sesion.inicio <= 0 ||
      sesion.inicio > ahora
    )
      return null
    return sesion as ControlSesion
  } catch {
    return null
  }
}

export function sesionVigente(sesion: ControlSesion, ahora = Date.now()) {
  return ahora >= sesion.inicio && ahora < vencimientoSesion(sesion)
}

export interface AvisoVencimientoSesion {
  esperar: (operacion: Promise<unknown>) => void
}
