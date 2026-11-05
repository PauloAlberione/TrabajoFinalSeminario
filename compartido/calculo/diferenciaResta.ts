import { mezclar, type Nivel } from "../memoria"
import { restaConfiguraciones } from "./configuraciones"
import { aleatorioEntero } from "./matematicas"
import type { RestaPregunta } from "./tipos"

export function generarRestaDiferencia(nivel: Nivel): RestaPregunta[] {
  const configuracion = restaConfiguraciones[nivel]
  const modos = mezclar(
    Array.from({ length: configuracion.questionCount }, (_, indice) =>
      indice % 2 ? "difference" as const : "direct" as const,
    ),
  )
  return modos.map((modo, indice) => {
    let izquierda = aleatorioEntero(
      configuracion.minimum,
      configuracion.maximum,
    )
    let derecha = aleatorioEntero(configuracion.minimum, configuracion.maximum)
    if (modo === "difference" && nivel !== "easy")
      derecha = Math.max(
        configuracion.minimum,
        Math.min(configuracion.maximum, izquierda + aleatorioEntero(1, 12)),
      )
    if (modo === "direct" && !configuracion.allowNegative)
      [izquierda, derecha] = [
        Math.max(izquierda, derecha),
        Math.min(izquierda, derecha),
      ]
    if (modo === "direct" && configuracion.allowNegative && indice % 2 === 0)
      [izquierda, derecha] = [
        Math.min(izquierda, derecha),
        Math.max(izquierda, derecha),
      ]
    const operandos: [number, number] = [izquierda, derecha]
    const respuesta =
      modo === "difference"
        ? Math.abs(izquierda - derecha)
        : izquierda - derecha
    const consigna =
      modo === "difference"
        ? `¿Cuál es la diferencia entre ${izquierda} y ${derecha}?`
        : `¿Cuánto es ${izquierda} − ${derecha < 0 ? `(${derecha})` : derecha}?`
    return {
      id: `subtraction-${indice}`,
      mode: modo,
      operands: operandos,
      prompt: consigna,
      answer: respuesta,
    }
  })
}
