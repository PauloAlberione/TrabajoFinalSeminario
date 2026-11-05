import type { Operacion } from "./tipos"

export function aleatorioEntero(minimo: number, maximo: number) {
  return minimo + Math.floor(Math.random() * (maximo - minimo + 1))
}

export function calcularOperacion(
  operacion: Operacion,
  izquierda: number,
  derecha: number,
): number {
  switch (operacion) {
    case "addition":
      return izquierda + derecha
    case "subtraction":
      return izquierda - derecha
    case "multiplication":
      return izquierda * derecha
    case "division":
      if (derecha === 0 || izquierda % derecha !== 0)
        throw new Error("División inválida.")
      return izquierda / derecha
  }
}

export const operacionSimbolos: Record<Operacion, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
}

export function interpretarNumericoRespuesta(
  valor: string,
  permitirNegativo: boolean,
): number | null {
  const recortado = valor.trim().replace(/^−/, "-")
  if (
    recortado.length > 7 ||
    !(permitirNegativo ? /^-?\d+$/ : /^\d+$/).test(recortado)
  )
    return null
  const numero = Number(recortado)
  return Number.isSafeInteger(numero) && Math.abs(numero) <= 100000
    ? numero
    : null
}
