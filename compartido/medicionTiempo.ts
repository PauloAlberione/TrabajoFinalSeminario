// Las mediciones inferiores a un milisegundo se conservan, pero no permiten puntuar el tiempo con fiabilidad.
export const MINIMO_EVALUABLE_RESPUESTA_SEGUNDOS = 0.001

export function tiempoEficiencia(
  efectivoSegundos: number,
  objetivoSegundos: number,
) {
  if (
    !Number.isFinite(efectivoSegundos) ||
    efectivoSegundos < 0 ||
    efectivoSegundos > 86400 ||
    !Number.isFinite(objetivoSegundos) ||
    objetivoSegundos <= 0
  )
    throw new Error("Tiempo inválido.")
  return efectivoSegundos < MINIMO_EVALUABLE_RESPUESTA_SEGUNDOS
    ? 0
    : Math.min(100, (objetivoSegundos / efectivoSegundos) * 100)
}
