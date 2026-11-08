import test from "node:test"
import assert from "node:assert/strict"
import { Timestamp } from "firebase-admin/firestore"
import { AlmacenHistorial } from "../pruebas/historialAlmacen"
import {
  listaResultadoPagina,
  obtenerResultado,
  recorrerResultados,
} from "../repositorios/resultado.repositorio"
import {
  interpretarHistorialConsulta,
  HistorialConsultaError,
} from "./consultaHistorial"
import {
  obtenerResultados,
  obtenerResultadoDetalle,
} from "../controladores/resultado.controlador"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import type { Response } from "express"

function agregar(
  almacen: AlmacenHistorial,
  uid: string,
  id: string,
  estado = "completed",
  extra: Record<string, unknown> = {},
) {
  const ruta = `users/${uid}/sessions/${id}`
  almacen.documents.set(ruta, { status: estado })
  almacen.documents.set(`${ruta}/results/completed`, {
    userId: uid,
    exerciseId: "wordList",
    exerciseName: "Lista de palabras",
    exerciseType: "wordList",
    cognitiveFunctionId: "memory",
    difficultyBefore: "easy",
    correctAnswers: 4,
    errors: 1,
    accuracy: 80,
    actualTimeSeconds: 0.25,
    completedAt: Timestamp.fromDate(new Date("2025-01-01T12:00:00Z")),
    createdAt: Timestamp.fromDate(new Date("2025-01-01T12:00:00Z")),
    ...extra,
  })
  return `${ruta}/results/completed`
}

test("La paginación supera 100 sesiones, excluye cancelaciones antes del límite y desempata fechas", async () => {
  const almacen = new AlmacenHistorial()
  for (let indice = 0; indice < 140; indice++)
    agregar(almacen, "owner", `valid-${String(indice).padStart(3, "0")}`)
  for (let indice = 0; indice < 200; indice++)
    agregar(almacen, "owner", `zz-cancelled-${indice}`, "cancelled")
  agregar(almacen, "other-user", "foreign")
  const ids: string[] = []
  let cursor: string | undefined,
    solicitudes = 0
  do {
    const pagina = await listaResultadoPagina(
      "owner",
      { limit: 17, cursor },
      almacen.database,
    )
    assert.ok(pagina.items.length <= 17)
    ids.push(...pagina.items.map((elemento) => elemento.sessionId))
    cursor = pagina.nextCursor ?? undefined
    assert.ok(++solicitudes < 20)
  } while (cursor)
  assert.equal(ids.length, 140)
  assert.equal(new Set(ids).size, 140)
  assert.deepEqual(ids, [...ids].sort().reverse())
  assert.equal(
    almacen.reads.some((ruta) => ruta.includes("other-user")),
    false,
  )
})

test("Los filtros combinan categoría, ejercicio, dificultad y límites inclusivos o exclusivos de fecha", async () => {
  const almacen = new AlmacenHistorial()
  for (let day = 1; day <= 5; day++)
    agregar(almacen, "owner", `day-${day}`, "completed", {
      exerciseType: "visualReaction",
      cognitiveFunctionId: day === 3 ? "processingSpeed" : "speed",
      difficultyBefore: "hard",
      completedAt: Timestamp.fromDate(new Date(`2025-01-0${day}T00:00:00Z`)),
    })
  agregar(almacen, "owner", "wrong-category")
  agregar(almacen, "owner", "wrong-level", "completed", {
    cognitiveFunctionId: "speed",
    exerciseType: "visualReaction",
    difficultyBefore: "normal",
  })
  const opciones = interpretarHistorialConsulta({
    paginated: "true",
    category: "speed",
    exercise: "visualReaction",
    difficulty: "hard",
    from: "2025-01-02T00:00:00Z",
    to: "2025-01-05T00:00:00Z",
    limit: "2",
  })
  const primero = await listaResultadoPagina(
    "owner",
    opciones,
    almacen.database,
  )
  assert.deepEqual(
    primero.items.map((elemento) => elemento.sessionId),
    ["day-4", "day-3"],
  )
  assert.equal(primero.items[1].cognitiveFunctionId, "speed")
  const segundo = await listaResultadoPagina(
    "owner",
    { ...opciones, cursor: primero.nextCursor! },
    almacen.database,
  )
  assert.deepEqual(
    segundo.items.map((elemento) => elemento.sessionId),
    ["day-2"],
  )
  assert.equal(segundo.hasMore, false)
  assert.deepEqual([...new Set(almacen.reads)], [
    "users/owner/sessions/day-4",
    "users/owner/sessions/day-3",
    "users/owner/sessions/day-2",
  ])
})

test("Los cursores están vinculados al usuario y filtros y rechazan manipulaciones de rutas", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "owner", "one")
  agregar(almacen, "owner", "two")
  const pagina = await listaResultadoPagina(
    "owner",
    { limit: 1 },
    almacen.database,
  )
  await assert.rejects(
    listaResultadoPagina(
      "another",
      { limit: 1, cursor: pagina.nextCursor! },
      almacen.database,
    ),
    HistorialConsultaError,
  )
  await assert.rejects(
    listaResultadoPagina(
      "owner",
      { limit: 1, category: "memory", cursor: pagina.nextCursor! },
      almacen.database,
    ),
    HistorialConsultaError,
  )
  await assert.rejects(
    listaResultadoPagina("owner", { cursor: "invalid" }, almacen.database),
    HistorialConsultaError,
  )
  const falsificado = JSON.parse(
    Buffer.from(pagina.nextCursor!, "base64url").toString(),
  )
  falsificado.after.path = "users/another/sessions/one/results/completed"
  await assert.rejects(
    listaResultadoPagina(
      "owner",
      {
        limit: 1,
        cursor: Buffer.from(JSON.stringify(falsificado)).toString("base64url"),
      },
      almacen.database,
    ),
    HistorialConsultaError,
  )
})

test("El cursor conserva un corte estable e ignora nuevas finalizaciones entre páginas", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "owner", "one")
  agregar(almacen, "owner", "two")
  const primero = await listaResultadoPagina(
    "owner",
    { limit: 1 },
    almacen.database,
  )
  const cursor = JSON.parse(
    Buffer.from(primero.nextCursor!, "base64url").toString(),
  )
  agregar(almacen, "owner", "new", "completed", {
    completedAt: new Timestamp(
      cursor.cutoff.seconds + 1,
      cursor.cutoff.nanoseconds,
    ),
  })
  const segundo = await listaResultadoPagina(
    "owner",
    { limit: 1, cursor: primero.nextCursor! },
    almacen.database,
  )
  assert.equal(segundo.items.length, 1)
  assert.notEqual(segundo.items[0].sessionId, "new")
  assert.notEqual(segundo.items[0].id, primero.items[0].id)
  assert.equal(segundo.hasMore, false)
})

test("El detalle respeta propiedad y estado completado y conserva mediciones específicas exactas", async () => {
  const almacen = new AlmacenHistorial()
  const detalles = {
    exerciseType: "visualReaction",
    attempts: 3,
    timeouts: 1,
    falseStarts: 1,
    averageResponseTimeMs: 221.345,
    medianResponseTimeMs: 220.5,
    fastestResponseTimeMs: 215.123,
    trialResults: [
      { trialId: "trial-1", responseTimeMs: 221.345, correct: true },
    ],
  }
  agregar(almacen, "owner", "speed", "completed", {
    exerciseType: "visualReaction",
    cognitiveFunctionId: "speed",
    details: detalles,
  })
  agregar(almacen, "other", "private")
  agregar(almacen, "owner", "cancelled", "cancelled")
  const resultado = await obtenerResultado(
    "owner",
    "speed",
    "completed",
    almacen.database,
  )
  assert.deepEqual(resultado?.details, detalles)
  assert.equal(resultado?.averageResponseTimeMs, 221.345)
  assert.equal(resultado?.actualTimeSeconds, 0.25)
  assert.equal(
    await obtenerResultado("owner", "private", "completed", almacen.database),
    null,
  )
  assert.equal(
    await obtenerResultado("owner", "cancelled", "completed", almacen.database),
    null,
  )
  await assert.rejects(
    obtenerResultado("owner", "../other", "completed", almacen.database),
    HistorialConsultaError,
  )
  const lista = await listaResultadoPagina(
    "owner",
    { includeDetails: false },
    almacen.database,
  )
  assert.equal(lista.items[0].details, undefined)
  assert.equal(lista.items[0].attempts, 3)
  const completo = await listaResultadoPagina(
    "owner",
    { includeDetails: true },
    almacen.database,
  )
  assert.deepEqual(completo.items[0].details, detalles)
})

test("Los historiales vacíos no tienen cursor y no se inventan campos ausentes", async () => {
  const almacen = new AlmacenHistorial()
  assert.deepEqual(await listaResultadoPagina("owner", {}, almacen.database), {
    items: [],
    hasMore: false,
    nextCursor: null,
  })
  const ruta = agregar(almacen, "owner", "old")
  const datos = almacen.documents.get(ruta)!
  delete datos.correctAnswers
  delete datos.actualTimeSeconds
  const pagina = await listaResultadoPagina("owner", {}, almacen.database)
  assert.equal(pagina.items[0].correctAnswers, undefined)
  assert.equal(pagina.items[0].actualTimeSeconds, undefined)
  assert.equal(pagina.items[0].attempts, undefined)
  assert.equal(
    (
      await listaResultadoPagina(
        "owner",
        { category: "language" },
        almacen.database,
      )
    ).items.length,
    0,
  )
})

test("Se excluye un resultado con userId falsificado en una ruta privada ajena", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "foreign", "wrong", "completed", { userId: "owner" })
  agregar(almacen, "owner", "right")
  const pagina = await listaResultadoPagina("owner", {}, almacen.database)
  assert.deepEqual(
    pagina.items.map((elemento) => elemento.sessionId),
    ["right"],
  )
  assert.equal(
    almacen.reads.some((ruta) => ruta.includes("foreign")),
    false,
  )
})

test("La búsqueda acotada continúa entre registros antiguos inconsistentes sin truncar el historial", async () => {
  const almacen = new AlmacenHistorial()
  for (let indice = 0; indice < 1001; indice++)
    agregar(
      almacen,
      "owner",
      `zz-${String(indice).padStart(4, "0")}`,
      "cancelled",
    )
  agregar(almacen, "owner", "valid")
  const primero = await listaResultadoPagina("owner", {}, almacen.database)
  assert.equal(primero.items.length, 0)
  assert.equal(primero.hasMore, true)
  const segundo = await listaResultadoPagina(
    "owner",
    { cursor: primero.nextCursor! },
    almacen.database,
  )
  assert.deepEqual(
    segundo.items.map((elemento) => elemento.sessionId),
    ["valid"],
  )
  assert.equal(segundo.hasMore, false)
})

test("El iterador del servidor recorre todas las páginas para estadísticas y exportaciones", async () => {
  const almacen = new AlmacenHistorial()
  for (let indice = 0; indice < 125; indice++)
    agregar(almacen, "owner", `session-${indice}`)
  let cantidad = 0
  for await (const elemento of recorrerResultados(
    "owner",
    {},
    almacen.database,
  )) {
    assert.equal(elemento.cognitiveFunctionId, "memory")
    cantidad++
  }
  assert.equal(cantidad, 125)
})

test("La consulta rechaza filtros, fechas, límites y UID arbitrarios inválidos", () => {
  for (const consulta of [
    { category: "unknown" },
    { difficulty: "extreme" },
    { exercise: "fake" },
    { limit: "101" },
    { limit: "0" },
    { from: "2025-02-30T00:00:00Z" },
    { from: "2025-02-03T00:00:00Z", to: "2025-02-01T00:00:00Z" },
    { userId: "other" },
    { category: ["memory", "speed"] },
  ])
    assert.throws(
      () => interpretarHistorialConsulta(consulta),
      HistorialConsultaError,
    )
  assert.equal(
    interpretarHistorialConsulta({ category: "processingSpeed" }).category,
    "speed",
  )
})

test("Los controladores de historial y detalle exigen autenticación antes de acceder al repositorio", async () => {
  let estado = 0,
    cuerpo: unknown
  const respuesta = {
    status: (valor: number) => {
      estado = valor
      return respuesta
    },
    json: (valor: unknown) => {
      cuerpo = valor
      return respuesta
    },
  } as unknown as Response
  await obtenerResultados(
    { query: { userId: "foreign" } } as unknown as AutenticadoSolicitud,
    respuesta,
  )
  assert.equal(estado, 401)
  assert.deepEqual(cuerpo, { error: "Autenticación requerida." })
  await obtenerResultadoDetalle(
    {
      params: { sessionId: "foreign", resultId: "completed" },
    } as unknown as AutenticadoSolicitud,
    respuesta,
  )
  assert.equal(estado, 401)
})

test("La actualización del historial anterior conserva fechas, puntuaciones y dificultad registradas", async () => {
  const { completarCamposHistorial } = await import(
    "../repositorios/completarHistorial"
  )
  const creado = Timestamp.fromDate(new Date("2025-01-01T00:00:00Z"))
  const resultado = {
    createdAt: creado,
    accuracy: 85,
    difficultyBefore: "hard",
  }
  const campos = completarCamposHistorial("owner", resultado, {
    status: "completed",
  })
  assert.deepEqual(campos, {
    completedAt: creado,
    completionDateSource: "createdAt",
    userId: "owner",
  })
  assert.equal(resultado.accuracy, 85)
  assert.equal(resultado.difficultyBefore, "hard")
  assert.equal(
    completarCamposHistorial("owner", {}, { status: "completed" }),
    null,
  )
  assert.equal(
    completarCamposHistorial("owner", resultado, {
      status: "cancelled",
    }),
    null,
  )
  assert.deepEqual(
    completarCamposHistorial(
      "owner",
      { completedAt: creado, userId: "owner" },
      { status: "completed" },
    ),
    {},
  )
})

test("El orden de finalización conserva nanosegundos aunque los milisegundos mostrados coincidan", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "owner", "z-low", "completed", {
    completedAt: new Timestamp(1735732800, 1),
  })
  agregar(almacen, "owner", "a-high", "completed", {
    completedAt: new Timestamp(1735732800, 9),
  })
  const primero = await listaResultadoPagina(
    "owner",
    { limit: 1 },
    almacen.database,
  )
  assert.equal(primero.items[0].sessionId, "a-high")
  const cursor = JSON.parse(
    Buffer.from(primero.nextCursor!, "base64url").toString(),
  )
  assert.equal(cursor.after.nanoseconds, 9)
  const segundo = await listaResultadoPagina(
    "owner",
    { limit: 1, cursor: primero.nextCursor! },
    almacen.database,
  )
  assert.equal(segundo.items[0].sessionId, "z-low")
  assert.equal(segundo.hasMore, false)
})
