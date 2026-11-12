import type { Nivel } from "../memoria"
import type { VisualElemento } from "../atencionReconocimiento"
import { visualConjunto } from "../atencionReconocimiento/generacion"

export function generarComparaciones(
  nivel: Nivel,
  cantidad: number,
  iguales: boolean,
  indice: number,
) {
  const conjunto = visualConjunto(
    nivel === "easy" || nivel === "normal" ? "easy" : "normal",
  ).filter(
    (elemento) =>
      nivel === "easy" ||
      nivel === "normal" ||
      elemento.shape === "arrow" ||
      elemento.shape === "triangle",
  )
  return Array.from(
    { length: cantidad },
    (_, posicion): [VisualElemento, VisualElemento] => {
      const primero = conjunto[(indice + posicion * 3) % conjunto.length]
      if (iguales || posicion !== indice % cantidad) return [primero, primero]
      const segundo: VisualElemento =
        nivel === "easy"
          ? conjunto[(indice + posicion * 3 + 1) % conjunto.length]
          : nivel === "normal"
            ? { ...primero, fill: "outline" }
            : nivel === "veryHard" && indice % 2
              ? { ...primero, size: "small" }
              : { ...primero, rotation: (primero.rotation + 90) % 360 }
      return [primero, segundo]
    },
  )
}
