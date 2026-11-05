import { esTonoAvatar } from "../../compartido/avatar"
import { sendEmailVerification } from "firebase/auth"
import { autenticacionFirebase } from "./firebase"
import { api } from "./api"
import type { NivelDificultad, Genero } from "../tipos/ejercicios"

export type Dificultad = NivelDificultad

export type {
  RecordatorioFrecuencia,
  PreferenciasAccesibilidad,
} from "../../compartido/perfil"

import type { PreferenciasAccesibilidad } from "../../compartido/perfil"
import { leerPreferenciasAccesibilidad } from "../../compartido/perfil"

export interface PerfilUsuario {
  pais?: string
  zonaHoraria?: string
  tonoAvatar?: import("../../compartido/avatar").TonoAvatar
  uid: string
  nombre: string
  apellido: string
  email: string
  fechaNacimiento: string
  gender?: Genero
  fechaRegistro?: unknown
  preferenciasAccesibilidad: PreferenciasAccesibilidad
  rachaActual: number
  mejorRacha: number
  ultimoAcceso?: unknown
  diasActivos: number
}

function mapaPerfil(datos: Record<string, unknown>): PerfilUsuario {
  return {
    pais: typeof datos.countryCode === "string" ? datos.countryCode : undefined,
    zonaHoraria:
      typeof datos.timeZone === "string" ? datos.timeZone : undefined,
    tonoAvatar: esTonoAvatar(datos.avatarTone) ? datos.avatarTone : undefined,
    uid: String(datos.id ?? datos.uid ?? ""),
    nombre: String(datos.firstName ?? datos.nombre ?? ""),
    apellido: String(datos.lastName ?? datos.apellido ?? ""),
    email: String(datos.email ?? ""),
    fechaNacimiento: String(datos.birthDate ?? datos.fechaNacimiento ?? ""),
    gender: datos.gender as PerfilUsuario["gender"],
    fechaRegistro: datos.createdAt ?? datos.fechaRegistro,
    preferenciasAccesibilidad: leerPreferenciasAccesibilidad(
      datos.accessibilityPreferences,
      datos.preferenciasAccesibilidad,
    ),
    rachaActual: Number(datos.rachaActual ?? 0),
    mejorRacha: Number(datos.mejorRacha ?? 0),
    ultimoAcceso: datos.ultimoAcceso,
    diasActivos: Number(datos.diasActivos ?? 0),
  }
}

export async function obtenerPerfilUsuario(uid: string) {
  try {
    return mapaPerfil(
      await api.obtenerPerfilEfectivo<Record<string, unknown>>(),
    )
  } catch (error) {
    if (error instanceof Error && error.name === "BackendHttpError404")
      return null
    throw error
  }
}

export async function crearPerfilUsuario(perfil: {
  nombre: string
  apellido: string
  email: string
  fechaNacimiento: string
  gender: Genero
}) {
  return mapaPerfil(
    (await api.crearPerfil({
      firstName: perfil.nombre,
      lastName: perfil.apellido,
      email: perfil.email,
      birthDate: perfil.fechaNacimiento,
      gender: perfil.gender,
    })) as Record<string, unknown>,
  )
}

export async function actualizarPerfilUsuario(
  uid: string,
  cambios: import("../../compartido/perfil").CambiosPerfil,
) {
  return mapaPerfil(
    (await api.actualizarPerfil(cambios)) as Record<string, unknown>,
  )
}

export async function registroUsuarioAcceso(uid: string) {
  return undefined
}

export async function enviarRecordatorioVerificacion() {
  const usuario = autenticacionFirebase?.currentUser
  if (!usuario) throw new Error("Autenticación requerida.")
  await usuario.reload()
  if (!usuario.emailVerified) await sendEmailVerification(usuario)
}
