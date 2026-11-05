import { mezclar } from "../memoria"
import { mentalConfiguraciones } from "./configuraciones"
import {
  calcularOperacion,
  operacionSimbolos,
  aleatorioEntero,
} from "./matematicas"
import type { Nivel } from "../memoria"
import type { NumericoPregunta } from "./tipos"

export function generarMentalCalculo(nivel: Nivel): NumericoPregunta[] {
  const configuracion = mentalConfiguraciones[nivel]
  const operaciones = mezclar(configuracion.operations)
  return Array.from({ length: configuracion.questionCount }, (_, indice) => {
    const operacion = operaciones[indice % operaciones.length]
    let izquierda = aleatorioEntero(
      configuracion.minimum,
      configuracion.maximum,
    )
    let derecha = aleatorioEntero(configuracion.minimum, configuracion.maximum)
    if (operacion === "subtraction")
      [izquierda, derecha] = [
        Math.max(izquierda, derecha),
        Math.min(izquierda, derecha),
      ]
    if (operacion === "multiplication" || operacion === "division") {
      izquierda = aleatorioEntero(2, configuracion.factorMaximum)
      derecha = aleatorioEntero(2, configuracion.factorMaximum)
      if (operacion === "division") izquierda *= derecha
    }
    const respuesta = calcularOperacion(operacion, izquierda, derecha)
    const expresion = `${izquierda} ${operacionSimbolos[operacion]} ${derecha}`
    if (
      configuracion.twoStepEvery &&
      (indice + 1) % configuracion.twoStepEvery === 0
    ) {
      const finalOperando = aleatorioEntero(2, 5)
      return {
        id: `mental-${indice}`,
        operation: operacion,
        secondOperation: "addition",
        operands: [izquierda, derecha, finalOperando],
        prompt: `(${expresion}) + ${finalOperando}`,
        answer: calcularOperacion("addition", respuesta, finalOperando),
      }
    }
    return {
      id: `mental-${indice}`,
      operation: operacion,
      operands: [izquierda, derecha],
      prompt: expresion,
      answer: respuesta,
    }
  })
}
