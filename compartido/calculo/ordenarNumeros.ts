import { mezclar, type Nivel } from "../memoria"
import { ordenConfiguraciones } from "./configuraciones"
import { aleatorioEntero } from "./matematicas"
import type { OrdenRonda } from "./tipos"

export function generarOrdenNumeros(nivel: Nivel): OrdenRonda[] {
  const configuracion = ordenConfiguraciones[nivel]
  const direcciones = mezclar(
    Array.from({ length: configuracion.questionCount }, (_, indice) =>
      indice < configuracion.descendingRounds
        ? "descending" as const
        : "ascending" as const,
    ),
  )
  return direcciones.map((direccion, indice) => {
    const tramo = (configuracion.numbersPerRound - 1) * configuracion.gapMaximum
    const maximoIniciar =
      nivel === "veryHard" && indice === 0
        ? -tramo
        : configuracion.maximum - tramo
    const valores = [aleatorioEntero(configuracion.minimum, maximoIniciar)]
    for (let posicion = 1; posicion < configuracion.numbersPerRound; posicion++)
      valores.push(
        valores[posicion - 1] +
          aleatorioEntero(configuracion.gapMinimum, configuracion.gapMaximum),
      )
    const esperado =
      direccion === "ascending" ? valores : valores.slice().reverse()
    const mixto = mezclar(valores)
    // La ronda debe exigir ordenar, aunque la mezcla produzca por azar una secuencia ordenada.
    if (mixto.every((valor, posicion) => valor === esperado[posicion]))
      [mixto[0], mixto[1]] = [mixto[1], mixto[0]]
    return {
      id: `order-${indice}`,
      direction: direccion,
      values: mixto,
      expected: esperado,
    }
  })
}
