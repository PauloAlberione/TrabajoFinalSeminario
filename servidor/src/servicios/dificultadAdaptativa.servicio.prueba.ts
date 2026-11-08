import assert from "node:assert/strict"
import test from "node:test"
import {
  calcularMetricasRendimiento,
  determinarAjusteDificultad,
} from "./dificultadAdaptativa.servicio"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"

const alto = {
  correctAnswers: 9,
  errors: 1,
  totalQuestions: 10,
  actualTimeSeconds: 20,
  targetTimeSeconds: 40,
}
const bajo = {
  correctAnswers: 3,
  errors: 7,
  totalQuestions: 10,
  actualTimeSeconds: 40,
  targetTimeSeconds: 20,
}

test("El progreso nuevo comienza en easy y asciende tras dos resultados altos", () => {
  const inicial = {
    currentLevel: "easy" as const,
    promotionStreak: 0,
    demotionStreak: 0,
  }
  const primero = determinarAjusteDificultad(inicial, alto)
  assert.equal(primero.currentLevel, "easy")
  assert.equal(primero.promotionStreak, 1)
  const segundo = determinarAjusteDificultad(primero, alto)
  assert.equal(segundo.currentLevel, "normal")
  assert.equal(segundo.promotionStreak, 0)
})

test("Los ascensos y descensos respetan los límites", () => {
  let resultado = determinarAjusteDificultad(
    { currentLevel: "hard", promotionStreak: 1, demotionStreak: 0 },
    alto,
  )
  assert.equal(resultado.currentLevel, "veryHard")
  resultado = determinarAjusteDificultad(
    { currentLevel: "veryHard", promotionStreak: 1, demotionStreak: 0 },
    alto,
  )
  assert.equal(resultado.currentLevel, "veryHard")
  resultado = determinarAjusteDificultad(
    { currentLevel: "normal", promotionStreak: 0, demotionStreak: 1 },
    bajo,
  )
  assert.equal(resultado.currentLevel, "easy")
  resultado = determinarAjusteDificultad(
    { currentLevel: "easy", promotionStreak: 0, demotionStreak: 1 },
    bajo,
  )
  assert.equal(resultado.currentLevel, "easy")
})

test("Mantener el nivel reinicia las rachas y rechaza tiempos inválidos", () => {
  const resultado = determinarAjusteDificultad(
    { currentLevel: "normal", promotionStreak: 1, demotionStreak: 1 },
    {
      correctAnswers: 7,
      errors: 3,
      totalQuestions: 10,
      actualTimeSeconds: 30,
      targetTimeSeconds: 30,
    },
  )
  assert.equal(resultado.decision, "maintain")
  assert.equal(resultado.promotionStreak, 0)
  assert.equal(resultado.demotionStreak, 0)
  assert.throws(() =>
    calcularMetricasRendimiento({ ...alto, actualTimeSeconds: -1 }),
  )
})

test("El rendimiento usa tiempo normalizado y las estrategias tienen configuraciones progresivas", () => {
  const metricas = calcularMetricasRendimiento({
    correctAnswers: 8,
    errors: 2,
    totalQuestions: 10,
    actualTimeSeconds: 20,
    targetTimeSeconds: 40,
  })
  assert.equal(metricas.accuracy, 80)
  assert.equal(metricas.timeEfficiency, 100)
  assert.equal(metricas.performanceScore, 84)
  const estrategia = obtenerEjercicioEstrategia("memoryPairs")
  assert.ok(
    estrategia.getDifficultyConfig("veryHard").questionCount >
      estrategia.getDifficultyConfig("easy").questionCount,
  )
  assert.throws(() =>
    calcularMetricasRendimiento({
      correctAnswers: 11,
      errors: 0,
      totalQuestions: 10,
      actualTimeSeconds: 1,
      targetTimeSeconds: 1,
    }),
  )
})
