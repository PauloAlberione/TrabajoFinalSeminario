export const TONOS_AVATAR = [
  "predeterminado",
  "claro",
  "medio-claro",
  "medio",
  "medio-oscuro",
  "oscuro",
] as const

export type TonoAvatar = typeof TONOS_AVATAR[number]

export const etiquetasTonos: Record<TonoAvatar, string> = {
  predeterminado: "Amarillo",
  claro: "Claro",
  "medio-claro": "Medio claro",
  medio: "Medio",
  "medio-oscuro": "Medio oscuro",
  oscuro: "Oscuro",
}

export function esTonoAvatar(valor: unknown): valor is TonoAvatar {
  return (
    typeof valor === "string" && TONOS_AVATAR.some((tono) => tono === valor)
  )
}

export function representarAvatar(
  genero?: "male" | "female",
  tono: TonoAvatar = "predeterminado",
) {
  const base = genero === "female" ? "👵" : genero === "male" ? "👴" : "🧓"
  const modificadores = ["", "🏻", "🏼", "🏽", "🏾", "🏿"]
  return base + modificadores[TONOS_AVATAR.indexOf(tono)]
}
