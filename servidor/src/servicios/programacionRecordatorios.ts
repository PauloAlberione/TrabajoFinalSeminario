import type { ConfiguracionRecordatorios } from "../../../compartido/recordatorios"

function localPartes(fecha: Date, tiempoZona: string) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: tiempoZona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha)
  const valor = (clave: string) =>
    Number(partes.find((parte) => parte.type === clave)!.value)
  return {
    year: valor("year"),
    month: valor("month"),
    day: valor("day"),
    hour: valor("hour"),
    minute: valor("minute"),
  }
}

export function recordatorioLocalFecha(fecha: Date, tiempoZona: string) {
  const { year: anio, month: mes, day } = localPartes(fecha, tiempoZona)
  return `${anio}-${String(mes).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function siguienteRecordatorio(
  ajustes: ConfiguracionRecordatorios,
  despues: Date,
): Date {
  const local = localPartes(despues, ajustes.timeZone)
  const [hora, minuto] = ajustes.time.split(":").map(Number)
  for (
    let dayDesplazamiento = 0;
    dayDesplazamiento <= 15;
    dayDesplazamiento++
  ) {
    const day = new Date(
      Date.UTC(local.year, local.month - 1, local.day + dayDesplazamiento),
    )
    if (
      ajustes.frequency !== "daily" &&
      !ajustes.weekdays.includes(day.getUTCDay())
    )
      continue
    const objetivo = Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      hora,
      minuto,
    )
    const candidatos: number[] = []
    for (const desplazamiento of [-12, 0, 12]) {
      const muestra = new Date(objetivo + desplazamiento * 3600000)
      const partes = localPartes(muestra, ajustes.timeZone)
      const zonaDesplazamiento =
        Date.UTC(
          partes.year,
          partes.month - 1,
          partes.day,
          partes.hour,
          partes.minute,
        ) - muestra.getTime()
      const candidato = objetivo - zonaDesplazamiento
      const efectivo = localPartes(new Date(candidato), ajustes.timeZone)
      if (
        efectivo.year === day.getUTCFullYear() &&
        efectivo.month === day.getUTCMonth() + 1 &&
        efectivo.day === day.getUTCDate() &&
        efectivo.hour === hora &&
        efectivo.minute === minuto
      )
        candidatos.push(candidato)
    }
    // Una hora repetida por cambio horario tiene una sola ocurrencia; una hora local inexistente se omite.
    const primero = Math.min(...candidatos)
    if (Number.isFinite(primero) && primero > despues.getTime())
      return new Date(primero)
  }
  throw new Error("No reminder occurrence found")
}
