import { mezclar, type Nivel } from "../memoria"
import { secuenciaConfiguraciones } from "./configuraciones"
import { aleatorioEntero } from "./matematicas"
import type { SecuenciaPregunta, SecuenciaRegla } from "./tipos"

export function secuenciaValores(
  regla: SecuenciaRegla,
  longitud: number,
): number[] {
  const valores = [regla.start]
  for (let indice = 1; indice < longitud; indice++) {
    const anterior = valores[indice - 1]
    switch (regla.pattern) {
      case "constantAdd":
        valores.push(anterior + regla.step)
        break
      case "constantSubtract":
        valores.push(anterior - regla.step)
        break
      case "multiply":
        valores.push(anterior * regla.step)
        break
      case "alternating":
        valores.push(anterior + (indice % 2 ? regla.step : regla.alternateStep))
        break
      case "increasingDifference":
        valores.push(anterior + regla.step + indice - 1)
        break
      case "mixed":
        valores.push(indice % 2 ? anterior * 2 : anterior + regla.alternateStep)
        break
    }
  }
  return valores
}

export function generarNumeroSecuencias(nivel: Nivel): SecuenciaPregunta[] {
  const configuracion = secuenciaConfiguraciones[nivel]
  const patrones = mezclar(configuracion.patterns)
  return Array.from({ length: configuracion.questionCount }, (_, indice) => {
    const longitud =
      configuracion.lengths[indice % configuracion.lengths.length]
    const patron = patrones[indice % patrones.length]
    const paso =
      patron === "multiply"
        ? aleatorioEntero(2, nivel === "normal" ? 2 : 3)
        : aleatorioEntero(configuracion.minimumStep, configuracion.maximumStep)
    const regla: SecuenciaRegla = {
      pattern: patron,
      step: paso,
      alternateStep: paso + aleatorioEntero(1, 3),
      start:
        patron === "constantSubtract"
          ? paso * (longitud - 1) + aleatorioEntero(1, 20)
          : aleatorioEntero(1, 12),
    }
    const valores = secuenciaValores(regla, longitud)
    const faltanteIndice =
      nivel === "easy" || indice % 3 === 0
        ? longitud - 1
        : aleatorioEntero(1, longitud - 2)
    const respuesta = valores[faltanteIndice]
    const distancia = nivel === "easy" ? 2 : 1
    const distractores = [1, -1, 2, -2, 3, -3, 4, -4, 5]
      .map((desplazamiento) => respuesta + desplazamiento * distancia)
      .filter((valor) => valor >= 0)
      .slice(0, configuracion.optionCount - 1)
    const opciones = mezclar([respuesta, ...distractores])
    return {
      id: `sequence-${indice}`,
      rule: regla,
      values: valores,
      missingIndex: faltanteIndice,
      answer: respuesta,
      options: opciones,
    }
  })
}
