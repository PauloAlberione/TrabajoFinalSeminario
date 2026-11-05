import { randomUUID } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { siguienteRecordatorio } from "./programacionRecordatorios"
import { leerRecordatorioAjustes } from "../../../compartido/recordatorios"
import { Timestamp } from "firebase-admin/firestore"
import {
  crearPerfilUsuario,
  obtenerPerfilUsuario,
  actualizarPerfilUsuario,
} from "../repositorios/usuario.repositorio"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import {
  PREDETERMINADO_PREFERENCIAS,
  leerPreferenciasAccesibilidad,
  ErrorValidacionPerfil,
  validarCambiosPerfil,
} from "../../../compartido/perfil"

interface Cuenta {
  email?: string
  metadata: { creationTime?: string }
}

const obtenerCuenta = (uid: string): Promise<Cuenta> => getAuth().getUser(uid)

function isoFecha(valor: unknown): string | undefined {
  const fecha =
    valor instanceof Timestamp
      ? valor.toDate()
      : valor instanceof Date
        ? valor
        : typeof valor === "string"
          ? new Date(valor)
          : null
  return fecha && Number.isFinite(fecha.getTime())
    ? fecha.toISOString()
    : undefined
}

export async function buscarPerfil(
  idUsuario: string,
  baseDatos = obtenerFirestoreAdmin(),
  lectorCuenta = obtenerCuenta,
) {
  const [perfil, cuenta] = await Promise.all([
    obtenerPerfilUsuario(idUsuario, baseDatos),
    lectorCuenta(idUsuario),
  ])
  if (!perfil) return null
  const correo = cuenta.email ?? ""
  if (perfil.email !== correo)
    await actualizarPerfilUsuario(idUsuario, { email: correo }, baseDatos)
  return {
    id: idUsuario,
    firstName: perfil.firstName ?? perfil.nombre ?? "",
    lastName: perfil.lastName ?? perfil.apellido ?? "",
    email: correo,
    birthDate: perfil.birthDate ?? perfil.fechaNacimiento ?? "",
    gender: perfil.gender,
    ...(perfil.countryCode
      ? { countryCode: perfil.countryCode, timeZone: perfil.timeZone }
      : {}),
    ...(perfil.avatarTone ? { avatarTone: perfil.avatarTone } : {}),
    createdAt:
      isoFecha(perfil.createdAt ?? perfil.fechaRegistro) ??
      isoFecha(cuenta.metadata.creationTime) ??
      null,
    accessibilityPreferences: leerPreferenciasAccesibilidad(
      perfil.accessibilityPreferences,
      perfil.preferenciasAccesibilidad,
    ),
  }
}

export async function crearPerfil(
  idUsuario: string,
  entrada: unknown,
  baseDatos = obtenerFirestoreAdmin(),
  lectorCuenta = obtenerCuenta,
) {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada))
    throw new ErrorValidacionPerfil("Perfil inválido.")
  const { email: correo, ...campos } = entrada as Record<string, unknown>
  const validado = validarCambiosPerfil(campos, true)
  const cuenta = await lectorCuenta(idUsuario)
  if (
    correo !== undefined &&
    (typeof correo !== "string" ||
      correo.trim().toLowerCase() !== cuenta.email?.toLowerCase())
  )
    throw new ErrorValidacionPerfil(
      "El correo debe coincidir con el de la cuenta autenticada.",
    )
  await crearPerfilUsuario(
    idUsuario,
    {
      ...validado,
      email: cuenta.email ?? "",
      accessibilityPreferences: {
        ...PREDETERMINADO_PREFERENCIAS,
        ...validado.accessibilityPreferences,
      },
    },
    baseDatos,
  )
  return buscarPerfil(idUsuario, baseDatos, lectorCuenta)
}

export async function modificarPerfil(
  idUsuario: string,
  entrada: unknown,
  baseDatos = obtenerFirestoreAdmin(),
  lectorCuenta = obtenerCuenta,
) {
  const validado = validarCambiosPerfil(entrada)
  const campos: Record<string, unknown> = {}
  for (const [clave, valor] of Object.entries(validado)) {
    if (clave === "accessibilityPreferences")
      for (const [preferencia, ajuste] of Object.entries(valor))
        campos[`accessibilityPreferences.${preferencia}`] = ajuste
    else campos[clave] = valor
  }
  if (validado.accessibilityPreferences?.recordatorios === false) {
    campos["reminderPreferences.enabled"] = false
    campos.reminderNextAt = null
    campos.reminderOccurrenceAt = null
    campos.reminderVersion = randomUUID()
  }
  await actualizarPerfilUsuario(
    idUsuario,
    (anterior) => {
      if (!validado.countryCode) return campos
      const ajustes = {
        ...leerRecordatorioAjustes(anterior.reminderPreferences),
        ...(validado.accessibilityPreferences?.recordatorios === false
          ? { enabled: false }
          : {}),
        timeZone: validado.timeZone!,
      }
      const programado = ajustes.enabled
        ? Timestamp.fromDate(siguienteRecordatorio(ajustes, new Date()))
        : null
      return {
        ...campos,
        reminderPreferences: ajustes,
        reminderVersion: randomUUID(),
        reminderNextAt: programado,
        reminderOccurrenceAt: programado,
      }
    },
    baseDatos,
  )
  return buscarPerfil(idUsuario, baseDatos, lectorCuenta)
}
