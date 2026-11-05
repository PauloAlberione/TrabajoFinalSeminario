import type { VisualElemento } from "../../../../compartido/atencionReconocimiento"

const formas: Record<VisualElemento["shape"], string> = {
  circle: "M50 12a38 38 0 1 0 0 76a38 38 0 1 0 0-76",
  square: "M15 15H85V85H15Z",
  triangle: "M50 10L92 85H8Z",
  diamond: "M50 5L95 50L50 95L5 50Z",
  arrow: "M50 5L90 45H65V92H35V45H10Z",
  star: "M50 6L63 35L95 38L71 59L78 91L50 74L22 91L29 59L5 38L37 35Z",
}
const nombres = {
  circle: "Círculo",
  square: "Cuadrado",
  triangle: "Triángulo",
  diamond: "Rombo",
  arrow: "Flecha",
  star: "Estrella",
}

export function describirSimbolo(elemento: VisualElemento) {
  return `${nombres[elemento.shape]}, ${
    elemento.fill === "solid" ? "relleno" : "contorno"
  }, ${elemento.size === "large" ? "grande" : "pequeño"}${
    elemento.rotation ? `, girado ${elemento.rotation} grados` : ""
  }`
}

export function SimboloVisual({ item: elemento }: { item: VisualElemento }) {
  return (
    <svg
      role="img"
      aria-label={describirSimbolo(elemento)}
      viewBox="0 0 100 100"
      width={elemento.size === "small" ? 32 : 52}
      height={elemento.size === "small" ? 32 : 52}
      style={{ flexShrink: 0 }}
    >
      <path
        d={formas[elemento.shape]}
        transform={`rotate(${elemento.rotation} 50 50)`}
        fill={elemento.fill === "solid" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
