import type { VelocidadEnsayo } from "./tipos"
import { velocidadColores } from "./contenido"

export function coloresSolicitados(
  ensayo: Extract<VelocidadEnsayo, { kind: "touchColor" }>,
) {
  return ensayo.requestedColors ?? [ensayo.requestedColor]
}

export function respuestaVelocidadValida(
  ensayo: VelocidadEnsayo,
  respuesta: string,
) {
  if (ensayo.kind !== "touchColor") return ensayo.options.includes(respuesta)
  const colores = respuesta.split("|")
  return (
    colores.length === coloresSolicitados(ensayo).length &&
    new Set(colores).size === colores.length &&
    colores.every((color) => ensayo.options.includes(color))
  )
}

export function etiquetaRespuestaVelocidad(respuesta?: string) {
  if (!respuesta) return "Sin dato"
  return respuesta
    .split("|")
    .map((valor) => {
      if (valor === "react") return "Señal correcta"
      if (valor.startsWith("distractor-")) return "Señal distractora"
      return velocidadColores.find((color) => color.id === valor)?.name ?? valor
    })
    .join(" → ")
}
