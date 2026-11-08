import test from "node:test"
import assert from "node:assert/strict"
import type { ElementoHistorial } from "../../../compartido/historial"
import { calcularEstadisticas, dayClave } from "./estadisticas.servicio"
import { AlmacenHistorial } from "../pruebas/historialAlmacen"
import { recorrerResultados } from "../repositorios/resultado.repositorio"
import { Timestamp } from "firebase-admin/firestore"
import { estadisticas } from "../controladores/estadisticas.controlador"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import type { Response } from "express"

const ahora = new Date("2026-11-02T15:00:00Z")
const zona = "America/Argentina/Cordoba"

function resultado(
  id: string,
  extra: Partial<ElementoHistorial> = {},
): ElementoHistorial {
  return {
    id,
    sessionId: id,
    resultId: "completed",
    completedAt: "2026-11-02T12:00:00Z",
    cognitiveFunctionId: "memory",
    correctAnswers: 1,
    errors: 0,
    actualTimeSeconds: 20.25,
    difficultyBefore: "easy",
    ...extra,
  }
}

async function* flujo(elementos: ElementoHistorial[]) {
  yield* elementos
}

const calcular = (
  elementos: ElementoHistorial[],
  rango: "7" | "30" | "90" | "all" = "30",
) =>
  calcularEstadisticas(
    flujo(elementos),
    { memory: "hard", speed: "veryHard" },
    rango,
    zona,
    ahora,
  )

test("Las estadísticas cuentan ejercicios, sesiones distintas, precisión ponderada y segundos exactos", async () => {
  const informe = await calcular([
    resultado("a", {
      correctAnswers: 1,
      errors: 0,
      accuracy: 100,
      actualTimeSeconds: 29.9,
    }),
    resultado("b", {
      sessionId: "a",
      correctAnswers: 0,
      errors: 9,
      accuracy: 0,
      actualTimeSeconds: 29.9,
    }),
  ])
  assert.equal(informe.lifetime.completedExercises, 2)
  assert.equal(informe.lifetime.completedSessions, 1)
  assert.equal(informe.lifetime.accuracy, 10)
  assert.equal(informe.lifetime.activeSeconds, 59.8)
  assert.equal(informe.today.completedExercises, 2)
  assert.equal(informe.categories[0].accuracy, 10)
  assert.equal(informe.categories[0].currentLevel, "hard")
})

test("La ausencia de datos se distingue de precisión cero y denominadores nulos", async () => {
  const vacio = await calcular([])
  assert.equal(vacio.lifetime.accuracy, null)
  assert.equal(vacio.activeDays, 0)
  assert.equal(vacio.currentStreak, 0)
  assert.equal(vacio.daily.length, 30)
  assert.ok(
    vacio.daily.every(
      (day) => day.accuracy === null && day.completedExercises === 0,
    ),
  )
  const informe = await calcular(
    [resultado("zero", { correctAnswers: 0, errors: 3 })],
    "7",
  )
  assert.equal(informe.today.accuracy, 0)
  assert.equal(informe.daily.at(-2)!.accuracy, null)
  const denominador = await calcular([
    resultado("no-answer", { correctAnswers: 0, errors: 0 }),
  ])
  assert.equal(denominador.lifetime.accuracy, null)
})

test("Los meses y semanas desde el lunes respetan fechas locales, cambios de año y resultados futuros", async () => {
  const informe = await calcular([
    resultado("october-local", { completedAt: "2026-11-01T02:59:59Z" }),
    resultado("november-local", { completedAt: "2026-11-01T03:00:00Z" }),
    resultado("sunday-local", { completedAt: "2026-11-02T02:59:59Z" }),
    resultado("monday-local", { completedAt: "2026-11-02T03:00:00Z" }),
    resultado("future", { completedAt: "2026-11-03T03:00:00Z" }),
  ])
  assert.equal(informe.month.completedExercises, 3)
  assert.equal(informe.week.completedExercises, 1)
  assert.equal(informe.today.completedExercises, 1)
  assert.equal(informe.lifetime.completedExercises, 4)
  assert.equal(informe.activeDays, 3)
  assert.equal(informe.currentStreak, 3)
  const cambioDia = await calcularEstadisticas(
    flujo([
      resultado("old", { completedAt: "2025-12-31T23:59:59Z" }),
      resultado("new", { completedAt: "2026-01-01T00:00:00Z" }),
    ]),
    {},
    "7",
    "UTC",
    new Date("2026-01-01T12:00:00Z"),
  )
  assert.equal(cambioDia.month.completedExercises, 1)
  assert.equal(cambioDia.week.completedExercises, 2)
})

test("La racha cuenta días locales consecutivos y tolera el día actual sin actividad", async () => {
  const ayer = resultado("yesterday", { completedAt: "2026-11-01T12:00:00Z" })
  const previo = resultado("prior", { completedAt: "2026-10-31T12:00:00Z" })
  assert.equal(
    (
      await calcular([
        ayer,
        previo,
        { ...previo, id: "repeat", sessionId: "repeat" },
      ])
    ).currentStreak,
    2,
  )
  assert.equal((await calcular([previo])).currentStreak, 0)
  assert.equal((await calcular([resultado("today"), previo])).currentStreak, 1)
})

test("Las categorías y niveles usan valores reales sin mezclar unidades incompatibles de respuesta", async () => {
  const informe = await calcular([
    resultado("memory", {
      difficultyBefore: "easy",
      actualTimeSeconds: 90,
      actualResponseTimeSeconds: 5,
    }),
    resultado("speed", {
      cognitiveFunctionId: "speed",
      difficultyBefore: "veryHard",
      actualTimeSeconds: 1.5,
      averageResponseTimeMs: 350,
      correctAnswers: 0,
      errors: 3,
    }),
    resultado("legacy", {
      cognitiveFunctionId:
        "processingSpeed" as ElementoHistorial["cognitiveFunctionId"],
      difficultyBefore: "hard",
      actualTimeSeconds: 2.75,
      averageResponseTimeMs: 200,
      correctAnswers: 9,
      errors: 1,
    }),
  ])
  assert.equal(informe.lifetime.activeSeconds, 94.25)
  const velocidad = informe.categories.find(
    (categoria) => categoria.category === "speed",
  )!
  assert.equal(velocidad.completedExercises, 2)
  assert.equal(velocidad.accuracy, (9 / 13) * 100)
  assert.equal(velocidad.activeSeconds, 4.25)
  assert.equal(velocidad.currentLevel, "veryHard")
  assert.equal(informe.difficulties.easy.completedExercises, 1)
  assert.equal(informe.difficulties.veryHard.accuracy, 0)
  assert.equal(
    informe.categories.find((categoria) => categoria.category === "language")!
      .accuracy,
    null,
  )
  assert.equal("averageResponseTime" in informe.lifetime, false)
  assert.equal(informe.suggestedCategory, "language")
})

test("Los intervalos incluyen exactamente 7, 30 o 90 fechas y el histórico permanece completo", async () => {
  const elementos = [
    resultado("old", { completedAt: "2025-01-01T12:00:00Z" }),
    resultado("edge", { completedAt: "2026-10-27T03:00:00Z" }),
    resultado("before", { completedAt: "2026-10-27T02:59:59Z" }),
  ]
  const corto = await calcular(elementos, "7")
  assert.equal(corto.period.completedExercises, 1)
  assert.equal(corto.lifetime.completedExercises, 3)
  assert.equal(corto.daily.length, 7)
  assert.equal((await calcular(elementos, "30")).daily.length, 30)
  assert.equal((await calcular(elementos, "90")).daily.length, 90)
  const todos = await calcular(elementos, "all")
  assert.equal(todos.period.completedExercises, 3)
  assert.equal(todos.daily.length, 3)
})

test("Los tiempos ausentes o inválidos no se inventan y la precisión enviada no reemplaza los conteos", async () => {
  const informe = await calcular([
    resultado("invalid", {
      actualTimeSeconds: NaN,
      correctAnswers: undefined,
      errors: undefined,
    }),
    resultado("negative", { actualTimeSeconds: -1, correctAnswers: -1 }),
    resultado("measured", {
      actualTimeSeconds: 0.001,
      correctAnswers: 2,
      errors: 2,
      accuracy: 100,
    }),
  ])
  assert.equal(informe.lifetime.completedExercises, 3)
  assert.equal(informe.lifetime.durationMeasurements, 1)
  assert.equal(informe.lifetime.activeSeconds, 0.001)
  assert.equal(informe.lifetime.accuracyMeasurements, 1)
  assert.equal(informe.lifetime.accuracy, 50)
})

test("La agregación recorre todas las páginas y excluye cancelaciones y otros usuarios", async () => {
  const almacen = new AlmacenHistorial()
  for (let indice = 0; indice < 335; indice++) {
    const ruta = `users/owner/sessions/session-${indice}`
    almacen.documents.set(ruta, {
      status: indice < 205 ? "completed" : "cancelled",
    })
    almacen.documents.set(`${ruta}/results/completed`, {
      userId: "owner",
      cognitiveFunctionId: "memory",
      correctAnswers: 2,
      errors: 1,
      actualTimeSeconds: 0.5,
      completedAt: Timestamp.fromDate(new Date("2026-10-31T12:00:00Z")),
    })
  }
  const ajeno = "users/foreign/sessions/private"
  almacen.documents.set(ajeno, { status: "completed" })
  almacen.documents.set(`${ajeno}/results/completed`, {
    userId: "foreign",
    completedAt: Timestamp.fromDate(ahora),
  })
  const informe = await calcularEstadisticas(
    recorrerResultados("owner", {}, almacen.database),
    {},
    "all",
    zona,
    ahora,
  )
  assert.equal(informe.lifetime.completedExercises, 205)
  assert.equal(informe.lifetime.completedSessions, 205)
  assert.equal(informe.lifetime.activeSeconds, 102.5)
  assert.equal(informe.lifetime.accuracy, (2 / 3) * 100)
  assert.ok(almacen.reads.every((ruta) => ruta.startsWith("users/owner/")))
})

test("Las fechas por zona horaria contemplan cambios de hora sin asumir días de 24 horas", () => {
  assert.equal(
    dayClave(new Date("2026-03-08T04:59:59Z"), "America/New_York"),
    "2026-03-07",
  )
  assert.equal(
    dayClave(new Date("2026-03-08T05:00:00Z"), "America/New_York"),
    "2026-03-08",
  )
  assert.equal(
    dayClave(new Date("2026-03-09T04:00:00Z"), "America/New_York"),
    "2026-03-09",
  )
})

test("Las estadísticas rechazan solicitudes sin autenticación, UID ajeno e intervalos o zonas inválidos", async () => {
  for (const [solicitar, esperado] of [
    [{ query: {} }, 401],
    [{ userId: "owner", query: { userId: "other" } }, 400],
    [{ userId: "owner", query: { range: "100" } }, 400],
    [{ userId: "owner", query: { timeZone: "invalid-zone" } }, 400],
    [{ userId: "owner", query: { range: ["7"] } }, 400],
  ] as const) {
    let estado = 0
    const respuesta = {
      status(codigo: number) {
        estado = codigo
        return this
      },
      json() {},
    } as unknown as Response
    await estadisticas(solicitar as unknown as AutenticadoSolicitud, respuesta)
    assert.equal(estado, esperado)
  }
})
