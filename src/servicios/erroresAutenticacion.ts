import { REQUISITOS_CONTRASENA } from "./politicaContrasena"

export function mensajeErrorFirebase(error: unknown): string {
  const codigo = codigoErrorFirebase(error)
  if (error instanceof Error && error.name === "BackendUnavailableError")
    return error.message
  if (error instanceof Error && error.name === "BackendConfigurationError")
    return "El backend no está configurado. Define VITE_BACKEND_URL y levanta el servidor antes de registrarte."
  if (error instanceof Error && error.name.startsWith("BackendHttpError"))
    return `No se pudo guardar tu perfil: ${error.message}`
  if (codigo.includes("operation-not-allowed"))
    return "El acceso con correo y contraseña todavía no está habilitado en Firebase."
  if (codigo.includes("invalid-api-key"))
    return "La configuración de Firebase no es válida. Revisa las variables de entorno."
  if (codigo.includes("unauthorized-domain"))
    return "Este dominio todavía no está autorizado en Firebase Authentication."
  if (codigo.includes("network-request-failed"))
    return "No se pudo conectar con Firebase. Comprueba tu conexión."
  if (codigo.includes("permission-denied"))
    return "Firebase rechazó el acceso. Revisa las reglas de Firestore."
  if (codigo.includes("failed-precondition"))
    return "Firestore todavía no está disponible o no tiene una base creada."
  if (
    codigo.includes("invalid-credential") ||
    codigo.includes("wrong-password") ||
    codigo.includes("user-not-found")
  )
    return "El correo o la contraseña no son correctos."
  if (codigo.includes("email-already-in-use"))
    return "Ya existe una cuenta con ese correo electrónico."
  if (codigo.includes("invalid-email"))
    return "Introduce un correo electrónico válido."
  if (
    codigo.includes("weak-password") ||
    codigo.includes("password-does-not-meet-requirements")
  )
    return REQUISITOS_CONTRASENA
  if (codigo.includes("too-many-requests"))
    return "Se hicieron demasiados intentos. Espera unos minutos y vuelve a intentarlo."
  return "No pudimos completar la operación. Comprueba tu conexión e inténtalo nuevamente."
}

export function codigoErrorFirebase(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "unknown"
}
