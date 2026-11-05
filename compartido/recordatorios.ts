export interface ConfiguracionRecordatorios {
  enabled: boolean
  frequency: "daily" | "weekly" | "weekdays"
  time: string
  timeZone: string
  weekdays: number[]
}

export interface RecordatorioPreferenciasRespuesta {
  settings: ConfiguracionRecordatorios
  status: "disabled" | "notConfigured" | "awaitingScheduler" | "unverified" | "deliveryError" | "ready"
}

export const PREDETERMINADO_RECORDATORIOS: ConfiguracionRecordatorios = {
  enabled: false,
  frequency: "daily",
  time: "10:00",
  timeZone: "America/Argentina/Cordoba",
  weekdays: [1],
}

export class RecordatorioValidacionError extends Error {}

export function validarRecordatorioAjustes(
  entrada: unknown,
): ConfiguracionRecordatorios {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada))
    throw new RecordatorioValidacionError(
      "Configuración de recordatorios inválida.",
    )
  const datos = entrada as Record<string, unknown>
  if (
    Object.keys(datos).length !==
      Object.keys(PREDETERMINADO_RECORDATORIOS).length ||
    Object.keys(datos).some(
      (clave) =>
        !Object.prototype.hasOwnProperty.call(
          PREDETERMINADO_RECORDATORIOS,
          clave,
        ),
    )
  )
    throw new RecordatorioValidacionError(
      "Guardá la configuración completa sin campos adicionales.",
    )
  if (
    typeof datos.enabled !== "boolean" ||
    !["daily", "weekly", "weekdays"].includes(String(datos.frequency))
  )
    throw new RecordatorioValidacionError(
      "Frecuencia de recordatorios inválida.",
    )
  if (
    typeof datos.time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(datos.time)
  )
    throw new RecordatorioValidacionError("Ingresá una hora válida.")
  if (typeof datos.timeZone !== "string" || datos.timeZone.length > 100)
    throw new RecordatorioValidacionError("Zona horaria inválida.")
  try {
    new Intl.DateTimeFormat("en", { timeZone: datos.timeZone }).format()
  } catch {
    throw new RecordatorioValidacionError("Zona horaria inválida.")
  }
  if (
    !Array.isArray(datos.weekdays) ||
    datos.weekdays.length < 1 ||
    datos.weekdays.length > 7 ||
    datos.weekdays.some(
      (day) => !Number.isInteger(day) || day < 0 || day > 6,
    ) ||
    new Set(datos.weekdays).size !== datos.weekdays.length ||
    (datos.frequency === "weekly" && datos.weekdays.length !== 1)
  )
    throw new RecordatorioValidacionError(
      "Elegí los días del recordatorio; para frecuencia semanal elegí un solo día.",
    )
  return {
    enabled: datos.enabled,
    frequency: datos.frequency as ConfiguracionRecordatorios["frequency"],
    time: datos.time,
    timeZone: datos.timeZone,
    weekdays: [...datos.weekdays].sort(),
  }
}

export function leerRecordatorioAjustes(
  valor: unknown,
): ConfiguracionRecordatorios {
  try {
    return validarRecordatorioAjustes(valor)
  } catch {
    return {
      ...PREDETERMINADO_RECORDATORIOS,
      weekdays: [...PREDETERMINADO_RECORDATORIOS.weekdays],
    }
  }
}
