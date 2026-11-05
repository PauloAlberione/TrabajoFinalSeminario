import { zonasDelPais, zonaValidaParaPais } from "./ubicacion"
import { esTonoAvatar, type TonoAvatar } from "./avatar"

export const RECORDATORIO_FRECUENCIAS = [
  "daily",
  "every-2-days",
  "every-3-days",
  "every-4-days",
  "every-5-days",
  "every-6-days",
  "weekly",
  "biweekly",
  "monthly",
] as const

export type RecordatorioFrecuencia = typeof RECORDATORIO_FRECUENCIAS[number]

export interface PreferenciasAccesibilidad {
  tamanoTexto: "normal" | "grande" | "extra"
  altoContraste: boolean
  instruccionesAmpliadas: boolean
  sonidos: boolean
  volumenSonidos: number
  recordatorios: boolean
  frecuenciaRecordatorio: RecordatorioFrecuencia
}

export const PREDETERMINADO_PREFERENCIAS: PreferenciasAccesibilidad = {
  tamanoTexto: "normal",
  altoContraste: false,
  instruccionesAmpliadas: false,
  sonidos: true,
  volumenSonidos: 30,
  recordatorios: true,
  frecuenciaRecordatorio: "daily",
}

export interface CambiosPerfil {
  countryCode?: string
  timeZone?: string
  avatarTone?: TonoAvatar
  firstName?: string
  lastName?: string
  birthDate?: string
  gender?: "male" | "female"
  accessibilityPreferences?: Partial<PreferenciasAccesibilidad>
}

export class ErrorValidacionPerfil extends Error {}

function objeto(valor: unknown): Record<string, unknown> {
  if (
    !valor ||
    typeof valor !== "object" ||
    Array.isArray(valor) ||
    Object.getPrototypeOf(valor) !== Object.prototype
  )
    throw new ErrorValidacionPerfil("El perfil debe ser un objeto válido.")
  return valor as Record<string, unknown>
}

function nombre(valor: unknown, etiqueta: string) {
  if (typeof valor !== "string")
    throw new ErrorValidacionPerfil(`${etiqueta} es obligatorio.`)
  const texto = valor.trim().normalize("NFC")
  if (
    texto.length < 1 ||
    texto.length > 80 ||
    !/^[\p{L}\p{M}][\p{L}\p{M} '\u2019-]*$/u.test(texto)
  )
    throw new ErrorValidacionPerfil(
      `${etiqueta} debe tener entre 1 y 80 caracteres y contener solo letras, espacios, apóstrofes o guiones.`,
    )
  return texto
}

export function fechaNacimientoValida(
  valor: string,
  hoy = new Date(),
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number(valor.slice(0, 4)) < 1)
    return false
  const fecha = new Date(`${valor}T12:00:00Z`)
  if (
    !Number.isFinite(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== valor
  )
    return false
  const actual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`
  return valor <= actual
}

export function calcularEdad(
  fechaNacimiento: string,
  hoy = new Date(),
): number | null {
  if (!fechaNacimientoValida(fechaNacimiento, hoy)) return null
  const [anio, mes, day] = fechaNacimiento.split("-").map(Number)
  return (
    hoy.getFullYear() -
    anio -
    (hoy.getMonth() + 1 < mes ||
    (hoy.getMonth() + 1 === mes && hoy.getDate() < day)
      ? 1
      : 0)
  )
}

export function validarCambiosPerfil(
  entrada: unknown,
  creacion = false,
  hoy = new Date(),
): CambiosPerfil {
  const datos = objeto(entrada)
  const permitido = [
    "countryCode",
    "timeZone",
    "avatarTone",
    "firstName",
    "lastName",
    "birthDate",
    "gender",
    "accessibilityPreferences",
  ]
  if (
    Object.keys(datos).length === 0 ||
    Object.keys(datos).some((clave) => !permitido.includes(clave))
  )
    throw new ErrorValidacionPerfil("El perfil contiene campos no permitidos.")
  const salida: CambiosPerfil = {}
  if ("countryCode" in datos || "timeZone" in datos) {
    if (
      typeof datos.countryCode !== "string" ||
      !zonasDelPais(datos.countryCode).length
    )
      throw new ErrorValidacionPerfil("Elegí un país válido.")
    const zonas = zonasDelPais(datos.countryCode)
    const zona = datos.timeZone ?? (zonas.length === 1 ? zonas[0] : undefined)
    if (
      typeof zona !== "string" ||
      !zonaValidaParaPais(datos.countryCode, zona)
    )
      throw new ErrorValidacionPerfil(
        "Elegí una región o ciudad del país seleccionado.",
      )
    salida.countryCode = datos.countryCode
    salida.timeZone = zona
  }
  if ("avatarTone" in datos) {
    if (!esTonoAvatar(datos.avatarTone))
      throw new ErrorValidacionPerfil("El tono del avatar no es válido.")
    salida.avatarTone = datos.avatarTone
  }

  if (creacion || Object.prototype.hasOwnProperty.call(datos, "firstName"))
    salida.firstName = nombre(datos.firstName, "El nombre")
  if (creacion || Object.prototype.hasOwnProperty.call(datos, "lastName"))
    salida.lastName = nombre(datos.lastName, "El apellido")
  if (Object.prototype.hasOwnProperty.call(datos, "birthDate")) {
    if (
      typeof datos.birthDate !== "string" ||
      (datos.birthDate !== "" && !fechaNacimientoValida(datos.birthDate, hoy))
    )
      throw new ErrorValidacionPerfil(
        "La fecha de nacimiento debe ser una fecha real, no futura, con formato AAAA-MM-DD.",
      )
    salida.birthDate = datos.birthDate
  }
  if (Object.prototype.hasOwnProperty.call(datos, "gender")) {
    if (datos.gender !== "male" && datos.gender !== "female")
      throw new ErrorValidacionPerfil("La opción de género no es válida.")
    salida.gender = datos.gender
  }
  if (Object.prototype.hasOwnProperty.call(datos, "accessibilityPreferences")) {
    const preferencias = objeto(datos.accessibilityPreferences)
    if (
      !Object.keys(preferencias).length ||
      Object.keys(preferencias).some(
        (clave) =>
          !Object.prototype.hasOwnProperty.call(
            PREDETERMINADO_PREFERENCIAS,
            clave,
          ),
      )
    )
      throw new ErrorValidacionPerfil(
        "Las preferencias contienen campos no permitidos.",
      )
    const validado: Partial<PreferenciasAccesibilidad> = {}
    for (const [clave, valor] of Object.entries(preferencias)) {
      if (clave === "tamanoTexto") {
        if (
          !["normal", "grande", "extra"].includes(String(valor)) ||
          typeof valor !== "string"
        )
          throw new ErrorValidacionPerfil("El tamaño de texto no es válido.")
        validado.tamanoTexto =
          (valor as PreferenciasAccesibilidad["tamanoTexto"])
      } else if (clave === "volumenSonidos") {
        if (
          typeof valor !== "number" ||
          !Number.isInteger(valor) ||
          valor < 0 ||
          valor > 100
        )
          throw new ErrorValidacionPerfil(
            "El volumen debe ser un número entero entre 0 y 100.",
          )
        validado.volumenSonidos = valor
      } else if (clave === "frecuenciaRecordatorio") {
        if (!RECORDATORIO_FRECUENCIAS.includes(valor as RecordatorioFrecuencia))
          throw new ErrorValidacionPerfil(
            "La frecuencia de recordatorios no es válida.",
          )
        validado.frecuenciaRecordatorio = (valor as RecordatorioFrecuencia)
      } else {
        if (typeof valor !== "boolean")
          throw new ErrorValidacionPerfil(
            "Las preferencias deben contener valores verdaderos o falsos.",
          )
        validado[
          (clave as "altoContraste" | "instruccionesAmpliadas" | "sonidos" | "recordatorios")
        ] = valor
      }
    }
    salida.accessibilityPreferences = validado
  }
  return salida
}

export function leerPreferenciasAccesibilidad(
  valor: unknown,
  anterior?: unknown,
): PreferenciasAccesibilidad {
  const preferencias = { ...PREDETERMINADO_PREFERENCIAS }
  const campos = {
    ...(anterior && typeof anterior === "object" && !Array.isArray(anterior)
      ? anterior
      : {}),
    ...(valor && typeof valor === "object" && !Array.isArray(valor)
      ? valor
      : {}),
  }
  for (const clave of Object.keys(PREDETERMINADO_PREFERENCIAS)) {
    if (!Object.prototype.hasOwnProperty.call(campos, clave)) continue
    try {
      const validado = validarCambiosPerfil({
        accessibilityPreferences: {
          [clave]: (campos as Record<string, unknown>)[clave],
        },
      })
      Object.assign(preferencias, validado.accessibilityPreferences)
    } catch (error) {
      if (!(error instanceof ErrorValidacionPerfil)) throw error
    }
  }
  return preferencias
}
