import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth"
import { autenticacionFirebase } from "./firebase"
import { api, limpiarEjercicioPropietarios } from "./api"
import { audioJuego } from "./audioJuego"

const pendienteClave = "menteclear:account-deletion"
export const ELIMINACION_PENDIENTE_EVENTO = "menteclear:deletion-pending"

export interface PendienteEliminacion {
  uid: string
  ticket: string
}

export function leerPendienteEliminacion(): PendienteEliminacion | null {
  try {
    const valor: unknown = JSON.parse(
      sessionStorage.getItem(pendienteClave) ?? "null",
    )
    if (
      valor &&
      typeof valor === "object" &&
      "uid" in valor &&
      "ticket" in valor &&
      typeof valor.uid === "string" &&
      typeof valor.ticket === "string"
    )
      return { uid: valor.uid, ticket: valor.ticket }
  } catch {
    /* Antes de iniciar una eliminación, el almacenamiento de sesión debe permitir escrituras. */
  }
  return null
}

export async function solicitudCuentaEliminacion(
  uid: string,
  contrasena: string,
) {
  const usuario = autenticacionFirebase?.currentUser
  if (!usuario || usuario.uid !== uid || !usuario.email)
    throw new Error("Volvé a iniciar sesión en tu cuenta.")
  await reauthenticateWithCredential(
    usuario,
    EmailAuthProvider.credential(usuario.email, contrasena),
  )
  await usuario.getIdToken(true)
  if (autenticacionFirebase?.currentUser?.uid !== uid)
    throw new Error("La sesión cambió. Volvé a iniciar sesión.")
  const { ticket: comprobante } = await api.prepararCuentaEliminacion()
  if (
    typeof comprobante !== "string" ||
    !/^[0-9a-f]{64}\.[0-9a-f]{64}$/.test(comprobante)
  )
    throw new Error("No se recibió un comprobante válido.")
  const pendiente = { uid, ticket: comprobante }
  sessionStorage.setItem(pendienteClave, JSON.stringify(pendiente))
  window.dispatchEvent(new Event(ELIMINACION_PENDIENTE_EVENTO))
}

export function limpiarEliminadoCuentaAlmacenamiento(uid: string) {
  for (const almacenamiento of [localStorage, sessionStorage]) {
    const claves = Array.from({ length: almacenamiento.length }, (_, indice) =>
      almacenamiento.key(indice),
    )
    for (const clave of claves)
      if (
        clave &&
        (clave.startsWith(`menteclear:exercise:${uid}:`) ||
          clave.startsWith("menteclear-logs-"))
      )
        almacenamiento.removeItem(clave)
  }
  limpiarEjercicioPropietarios()
  audioJuego.restablecer()
}

export async function completarLocalCuentaEliminacion(uid: string) {
  let advertencia = ""
  try {
    limpiarEliminadoCuentaAlmacenamiento(uid)
  } catch {
    advertencia =
      "No pudimos limpiar todo el almacenamiento local. Revisá los datos del sitio en este dispositivo."
  }
  if (autenticacionFirebase) await signOut(autenticacionFirebase)
  try {
    sessionStorage.removeItem(pendienteClave)
  } catch {
    advertencia =
      "La cuenta fue eliminada, pero no pudimos limpiar el comprobante local. Revisá los datos del sitio."
  }
  return advertencia
}
