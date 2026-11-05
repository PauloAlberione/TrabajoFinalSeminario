import datos from "./datos/zonasPorPais.json" with { type: "json" }

// Tabla nacional de IANA (zone.tab), consultada el 03/11/2026. Conserva asociaciones por país.
// Los desfases y cambios estacionales se resuelven con Intl, no con horas fijas.
export const zonasPorPais: Readonly<Record<string, readonly string[]>> = datos

export function zonasDelPais(pais: string): readonly string[] {
  return Object.prototype.hasOwnProperty.call(zonasPorPais, pais)
    ? zonasPorPais[pais]
    : []
}

export function nombrePais(codigo: string): string {
  return new Intl.DisplayNames(["es"], { type: "region" }).of(codigo) ?? codigo
}

export const paisesDisponibles = Object.keys(zonasPorPais)
  .map((codigo) => ({ codigo, nombre: nombrePais(codigo) }))
  .sort((primero, segundo) =>
    primero.nombre.localeCompare(segundo.nombre, "es"),
  )

export function nombreRegion(zona: string): string {
  const nombres: Record<string, string> = {
    Buenos_Aires: "Buenos Aires",
    Cordoba: "Córdoba",
    Tucuman: "Tucumán",
    Mexico_City: "Ciudad de México",
    Sao_Paulo: "São Paulo",
    Bogota: "Bogotá",
    Cancun: "Cancún",
    Easter: "Isla de Pascua",
    Canary: "Islas Canarias",
  }
  const ciudad = zona.split("/").at(-1) ?? zona
  return nombres[ciudad] ?? ciudad.replace(/_/g, " ")
}

export function zonaValidaParaPais(pais: string, zona: string): boolean {
  return zonasDelPais(pais).includes(zona)
}

export function paisDeZona(zona: string): string | undefined {
  return Object.entries(zonasPorPais).find(([, zonas]) =>
    zonas.includes(zona),
  )?.[0]
}

export function requiereRegion(pais: string, ahora = new Date()): boolean {
  const zonas = zonasDelPais(pais)
  if (zonas.length < 2) return false
  const firma = (zona: string) =>
    Array.from({ length: 24 }, (_, mes) => {
      const fecha = new Date(
        Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + mes, 15, 12),
      )
      return new Intl.DateTimeFormat("en", {
        timeZone: zona,
        timeZoneName: "longOffset",
      })
        .formatToParts(fecha)
        .find((parte) => parte.type === "timeZoneName")?.value
    }).join("|")
  return new Set(zonas.map(firma)).size > 1
}
