export const DIFICULTAD_NIVELES = [
  "easy",
  "normal",
  "hard",
  "veryHard",
] as const

export type NivelDificultad = typeof DIFICULTAD_NIVELES[number]

export type Genero = "male" | "female"

export const etiquetaDificultad: Record<NivelDificultad, string> = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  veryHard: "Muy difícil",
}
