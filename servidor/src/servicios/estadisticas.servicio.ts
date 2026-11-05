import {
  CATEGORIA_IDS,
  normalizarCategoria,
} from "../../../compartido/resultados"
import type { ElementoHistorial } from "../../../compartido/historial"
import type { Nivel } from "../../../compartido/memoria"
import type {
  EstadisticasRango,
  EstadisticaTotales,
  InformeEstadisticas,
  DiarioEstadisticas,
} from "../../../compartido/estadisticas"
import { recorrerResultados } from "../repositorios/resultado.repositorio"
import { obtenerProgreso } from "../repositorios/progreso.repositorio"

export function totalesVacios(): EstadisticaTotales {
  return {
    completedExercises: 0,
    completedSessions: 0,
    activeSeconds: 0,
    durationMeasurements: 0,
    correctAnswers: 0,
    errors: 0,
    accuracy: null,
    accuracyMeasurements: 0,
  }
}

function validoNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0
}

export function dayClave(fecha: Date, tiempoZona: string) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: tiempoZona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha)
  const parte = (tipo: string) =>
    partes.find((elemento) => elemento.type === tipo)!.value
  return `${parte("year")}-${parte("month")}-${parte("day")}`
}

function cambioDay(day: string, desplazamiento: number) {
  const fecha = new Date(`${day}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + desplazamiento)
  return fecha.toISOString().slice(0, 10)
}

export async function calcularEstadisticas(
  resultados: AsyncIterable<ElementoHistorial>,
  niveles: Partial<Record<string, Nivel>>,
  rango: EstadisticasRango,
  tiempoZona: string,
  ahora = new Date(),
): Promise<InformeEstadisticas> {
  const hoyClave = dayClave(ahora, tiempoZona)
  const diaSemana = new Date(`${hoyClave}T12:00:00Z`).getUTCDay()
  const semanaIniciar = cambioDay(hoyClave, -((diaSemana + 6) % 7))
  const mesIniciar = `${hoyClave.slice(0, 7)}-01`
  const rangoIniciar =
    rango === "all" ? null : cambioDay(hoyClave, 1 - Number(rango))
  const categorias = CATEGORIA_IDS.map((categoria) => ({
    ...totalesVacios(),
    category: categoria,
    currentLevel: niveles[categoria] ?? "easy",
    lastActivity: null as string | null,
  }))
  const dificultades = Object.fromEntries(
    (["easy", "normal", "hard", "veryHard"] as const).map((nivel) => [
      nivel,
      totalesVacios(),
    ]),
  ) as Record<Nivel, EstadisticaTotales>
  const historico = totalesVacios(),
    periodo = totalesVacios(),
    hoy = totalesVacios(),
    semana = totalesVacios(),
    mes = totalesVacios()
  const ultimoActividad = new Map<string, string>()
  const diario = new Map<string, DiarioEstadisticas>(),
    activoDias = new Set<string>()
  const sesionConjuntos = new WeakMap<EstadisticaTotales, Set<string>>()
  const agregar = (
    totales: EstadisticaTotales,
    resultado: ElementoHistorial,
  ) => {
    totales.completedExercises++
    let sesiones = sesionConjuntos.get(totales)
    if (!sesiones) {
      sesiones = new Set()
      sesionConjuntos.set(totales, sesiones)
    }
    sesiones.add(resultado.sessionId)
    totales.completedSessions = sesiones.size
    if (validoNumero(resultado.actualTimeSeconds)) {
      totales.activeSeconds += resultado.actualTimeSeconds
      totales.durationMeasurements++
    }
    if (
      validoNumero(resultado.correctAnswers) &&
      validoNumero(resultado.errors)
    ) {
      totales.correctAnswers += resultado.correctAnswers
      totales.errors += resultado.errors
      totales.accuracyMeasurements++
      const denominador = totales.correctAnswers + totales.errors
      totales.accuracy = denominador
        ? (totales.correctAnswers / denominador) * 100
        : null
    }
  }
  for await (const resultado of resultados) {
    const instante = new Date(resultado.completedAt)
    if (!Number.isFinite(instante.getTime()) || instante > ahora) continue
    const day = dayClave(instante, tiempoZona)
    agregar(historico, resultado)
    activoDias.add(day)
    const categoriaId = normalizarCategoria(
      String(resultado.cognitiveFunctionId),
    )
    if (
      !ultimoActividad.has(categoriaId) ||
      resultado.completedAt > ultimoActividad.get(categoriaId)!
    )
      ultimoActividad.set(categoriaId, resultado.completedAt)
    if (day === hoyClave) agregar(hoy, resultado)
    if (day >= semanaIniciar) agregar(semana, resultado)
    if (day >= mesIniciar) agregar(mes, resultado)
    if (rangoIniciar && day < rangoIniciar) continue
    agregar(periodo, resultado)
    if (!diario.has(day)) diario.set(day, { ...totalesVacios(), date: day })
    agregar(diario.get(day)!, resultado)
    const categoria = categorias.find(
      (elemento) =>
        elemento.category ===
        normalizarCategoria(String(resultado.cognitiveFunctionId)),
    )
    if (categoria) {
      agregar(categoria, resultado)
      if (
        !categoria.lastActivity ||
        resultado.completedAt > categoria.lastActivity
      )
        categoria.lastActivity = resultado.completedAt
    }
    if (
      resultado.difficultyBefore &&
      Object.hasOwn(dificultades, resultado.difficultyBefore)
    )
      agregar(dificultades[resultado.difficultyBefore], resultado)
  }
  let actualRacha = 0
  // La racha de ayer sigue vigente durante el día de hoy.
  let rachaDay = activoDias.has(hoyClave) ? hoyClave : cambioDay(hoyClave, -1)
  while (activoDias.has(rachaDay)) {
    actualRacha++
    rachaDay = cambioDay(rachaDay, -1)
  }
  // La serie histórica contiene días activos; los intervalos acotados incluyen días inactivos con precisión nula.
  if (rangoIniciar)
    for (let day = rangoIniciar; day <= hoyClave; day = cambioDay(day, 1))
      if (!diario.has(day)) diario.set(day, { ...totalesVacios(), date: day })
  const sugeridoCategoria = [...CATEGORIA_IDS].sort((izquierda, derecha) =>
    (ultimoActividad.get(izquierda) ?? "").localeCompare(
      ultimoActividad.get(derecha) ?? "",
    ),
  )[0]
  return {
    suggestedCategory: sugeridoCategoria,
    timeZone: tiempoZona,
    generatedAt: ahora.toISOString(),
    range: rango,
    lifetime: historico,
    period: periodo,
    today: hoy,
    week: semana,
    month: mes,
    currentStreak: actualRacha,
    activeDays: activoDias.size,
    categories: categorias,
    daily: [...diario.values()].sort((primero, segundo) =>
      primero.date.localeCompare(segundo.date),
    ),
    difficulties: dificultades,
  }
}

export async function obtenerEstadisticas(
  uid: string,
  rango: EstadisticasRango,
  tiempoZona: string,
) {
  const progreso = await Promise.all(
    CATEGORIA_IDS.map((categoria) => obtenerProgreso(uid, categoria)),
  )
  return calcularEstadisticas(
    recorrerResultados(uid),
    Object.fromEntries(
      progreso.map((elemento) => [
        elemento.cognitiveFunctionId,
        elemento.currentLevel,
      ]),
    ),
    rango,
    tiempoZona,
  )
}
