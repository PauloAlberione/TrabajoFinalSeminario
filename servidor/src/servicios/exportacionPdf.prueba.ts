import test from "node:test"
import assert from "node:assert/strict"
import { readFile, access, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname } from "node:path"
import express from "express"
import type { AddressInfo } from "node:net"
import { Timestamp } from "firebase-admin/firestore"
import { AlmacenHistorial } from "../pruebas/historialAlmacen"
import {
  obtenerResultado,
  recorrerResultados,
} from "../repositorios/resultado.repositorio"
import {
  crearResultadosPdf,
  interpretarPdfExportarConsulta,
  PdfExportarError,
} from "./exportacionPdf.servicio"
import { HistorialConsultaError } from "../utilidades/consultaHistorial"
import { crearPdfExportarControlador } from "../controladores/exportacionPdf.controlador"
import { aplicacion } from "../aplicacion"
import type { ElementoHistorial } from "../../../compartido/historial"
import type { PdfExportarConsulta } from "../../../compartido/exportacionPdf"

const ahora = new Date("2026-10-31T15:00:00Z")

function agregar(
  almacen: AlmacenHistorial,
  uid: string,
  id: string,
  extra: Record<string, unknown> = {},
  estado = "completed",
) {
  const ruta = `users/${uid}/sessions/${id}`
  almacen.documents.set(ruta, { status: estado })
  almacen.documents.set(`${ruta}/results/completed`, {
    userId: uid,
    cognitiveFunctionId: "memory",
    exerciseName: "Lista de palabras",
    exerciseType: "wordList",
    difficultyBefore: "easy",
    correctAnswers: 1,
    errors: 0,
    accuracy: 100,
    actualTimeSeconds: 29.9,
    completedAt: Timestamp.fromDate(new Date("2026-10-01T12:00:00Z")),
    ...extra,
  })
}

function fuentes(almacen: AlmacenHistorial) {
  return {
    async profile(uid: string) {
      return {
        firstName: uid === "owner" ? "María" : "Privado",
        lastName: "Pérez",
      }
    },
    async *results(uid: string, consulta: PdfExportarConsulta) {
      if (consulta.scope === "single") {
        const elemento = await obtenerResultado(
          uid,
          consulta.sessionId,
          consulta.resultId,
          almacen.database,
        )
        if (elemento) yield elemento
      } else {
        const { scope: alcance, timeZone: zona, ...filtros } = consulta
        yield* recorrerResultados(uid, filtros, almacen.database)
      }
    },
  }
}

test("El PDF individual contiene el resultado solicitado y estadísticas reales compartidas", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "owner", "one")
  agregar(almacen, "owner", "two")
  const archivo = await crearResultadosPdf(
    "owner",
    {
      scope: "single",
      sessionId: "one",
      resultId: "completed",
      timeZone: "America/Argentina/Cordoba",
    },
    undefined,
    fuentes(almacen),
    ahora,
  )
  try {
    const pdf = await readFile(archivo.path)
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-")
    assert.ok(pdf.toString("latin1").includes("%%EOF"))
    assert.equal(archivo.report.period.completedExercises, 1)
    assert.equal(archivo.report.period.activeSeconds, 29.9)
    assert.equal(archivo.report.period.accuracy, 100)
    assert.ok(archivo.size > 1000)
    assert.equal(archivo.filename, "MenteClear-resultados-2026-10-31.pdf")
  } finally {
    await archivo.cleanup()
  }
  await assert.rejects(access(dirname(archivo.path)))
})

test("El PDF completo recorre más de 100 registros, excluye cancelados y ajenos y genera varias páginas", async () => {
  const almacen = new AlmacenHistorial()
  for (let indice = 0; indice < 135; indice++)
    agregar(almacen, "owner", `valid-${indice}`, {
      correctAnswers: indice ? 0 : 1,
      errors: indice ? 9 : 0,
      accuracy: indice ? 0 : 100,
    })
  for (let indice = 0; indice < 160; indice++)
    agregar(almacen, "owner", `cancelled-${indice}`, {}, "cancelled")
  agregar(almacen, "other", "foreign")
  const archivo = await crearResultadosPdf(
    "owner",
    { scope: "history" },
    undefined,
    fuentes(almacen),
    ahora,
  )
  try {
    const pdf = (await readFile(archivo.path)).toString("latin1")
    assert.ok([...pdf.matchAll(/\/Type \/Page\b/g)].length > 10)
    assert.equal(archivo.report.period.completedExercises, 135)
    assert.equal(archivo.report.period.completedSessions, 135)
    assert.equal(archivo.report.period.accuracy, (1 / (1 + 134 * 9)) * 100)
    assert.ok(
      Math.abs(archivo.report.period.activeSeconds - 135 * 29.9) < 0.00001,
    )
    assert.ok(almacen.reads.every((ruta) => ruta.startsWith("users/owner/")))
  } finally {
    await archivo.cleanup()
  }
})

test("Los límites de fechas y filtros coinciden con el historial y los totales del resumen", async () => {
  const almacen = new AlmacenHistorial()
  for (let day = 1; day <= 4; day++)
    agregar(almacen, "owner", `day-${day}`, {
      cognitiveFunctionId: "speed",
      exerciseType: "visualReaction",
      difficultyBefore: "hard",
      completedAt: Timestamp.fromDate(new Date(`2026-10-0${day}T03:00:00Z`)),
    })
  const consulta = interpretarPdfExportarConsulta({
    scope: "history",
    from: "2026-10-02T03:00:00Z",
    to: "2026-10-04T03:00:00Z",
    category: "speed",
    exercise: "visualReaction",
    difficulty: "hard",
    timeZone: "America/Argentina/Cordoba",
  })
  const archivo = await crearResultadosPdf(
    "owner",
    consulta,
    undefined,
    fuentes(almacen),
    ahora,
  )
  try {
    assert.equal(archivo.report.period.completedExercises, 2)
    assert.equal(
      archivo.report.categories.find(
        (elemento) => elemento.category === "speed",
      )!.completedExercises,
      2,
    )
  } finally {
    await archivo.cleanup()
  }
})

test("El historial vacío o los resultados ajenos nunca generan informes vacíos ni de otro usuario", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "other", "private")
  agregar(almacen, "owner", "cancelled", {}, "cancelled")
  for (const consulta of [
    { scope: "history" },
    { scope: "single", sessionId: "private", resultId: "completed" },
    { scope: "single", sessionId: "cancelled", resultId: "completed" },
  ] as PdfExportarConsulta[])
    await assert.rejects(
      crearResultadosPdf("owner", consulta, undefined, fuentes(almacen), ahora),
      PdfExportarError,
    )
})

test("La validación del PDF rechaza UID arbitrario, cursores, fechas imposibles y alcances inválidos", () => {
  for (const consulta of [
    { scope: "history", userId: "other" },
    { scope: "history", cursor: "abc" },
    { scope: "history", limit: "100" },
    { scope: "single", sessionId: "../other", resultId: "completed" },
    { scope: "history", from: "2026-02-30T00:00:00Z" },
    {
      scope: "history",
      from: "2026-10-03T00:00:00Z",
      to: "2026-10-01T00:00:00Z",
    },
    { scope: "history", timeZone: "invalid" },
    { scope: "history", category: ["memory"] },
    { scope: "single", sessionId: "id" },
    {},
  ])
    assert.throws(
      () => interpretarPdfExportarConsulta(consulta),
      HistorialConsultaError,
    )
})

test("El texto largo se distribuye entre páginas y las métricas ausentes no se inventan", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "owner", "long", {
    exerciseName: "Actividad extensa con descripción larga ".repeat(180),
    correctAnswers: undefined,
    errors: undefined,
    accuracy: undefined,
    actualTimeSeconds: undefined,
  })
  const archivo = await crearResultadosPdf(
    "owner",
    { scope: "history" },
    undefined,
    fuentes(almacen),
    ahora,
  )
  try {
    assert.ok(
      (await readFile(archivo.path))
        .toString("latin1")
        .match(/\/Type \/Page\b/g)!.length > 2,
    )
    assert.equal(archivo.report.period.accuracy, null)
    assert.equal(archivo.report.period.durationMeasurements, 0)
  } finally {
    await archivo.cleanup()
  }
})

test("Una generación fallida o cancelada elimina sus archivos temporales privados", async () => {
  const antes = (await readdir(tmpdir()))
    .filter((nombre) => nombre.startsWith("menteclear-pdf-"))
    .sort()
  const abortar = new AbortController()
  const dependencias = {
    profile: async () => null,
    async *results(): AsyncIterable<ElementoHistorial> {
      abortar.abort()
      yield {
        id: "one",
        sessionId: "one",
        resultId: "completed",
        completedAt: ahora.toISOString(),
      }
    },
  }
  await assert.rejects(
    crearResultadosPdf(
      "owner",
      { scope: "history" },
      abortar.signal,
      dependencias,
      ahora,
    ),
  )
  const fallido = {
    profile: async () => {
      throw new Error("Database failure")
    },
    async *results(): AsyncIterable<ElementoHistorial> {},
  }
  await assert.rejects(
    crearResultadosPdf(
      "owner",
      { scope: "history" },
      undefined,
      fallido,
      ahora,
    ),
  )
  assert.deepEqual(
    (await readdir(tmpdir()))
      .filter((nombre) => nombre.startsWith("menteclear-pdf-"))
      .sort(),
    antes,
  )
})

test("El controlador PDF devuelve cabeceras seguras y rechaza tokens ausentes o inválidos", async () => {
  const almacen = new AlmacenHistorial()
  agregar(almacen, "owner", "one")
  const pruebaAplicacion = express()
  pruebaAplicacion.get(
    "/pdf",
    (solicitar, respuesta, siguiente) => {
      Object.assign(solicitar, { userId: "owner" })
      siguiente()
    },
    crearPdfExportarControlador((uid, consulta, senal) =>
      crearResultadosPdf(uid, consulta, senal, fuentes(almacen), ahora),
    ),
  )
  const servidor = pruebaAplicacion.listen(0, "127.0.0.1"),
    protegidoServidor = aplicacion.listen(0, "127.0.0.1")
  await Promise.all([
    new Promise((resolver) => servidor.once("listening", resolver)),
    new Promise((resolver) => protegidoServidor.once("listening", resolver)),
  ])
  try {
    const respuesta = await fetch(
      `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/pdf?scope=history`,
    )
    assert.equal(respuesta.status, 200)
    assert.equal(respuesta.headers.get("content-type"), "application/pdf")
    assert.ok(respuesta.headers.get("cache-control")!.includes("no-store"))
    assert.ok(
      respuesta.headers.get("content-disposition")!.startsWith("attachment;"),
    )
    const buffer = Buffer.from(await respuesta.arrayBuffer())
    assert.equal(buffer.length, Number(respuesta.headers.get("content-length")))
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-")
    for (const encabezados of [
      {},
      { Authorization: "Bearer invalid" },
    ] as Record<string, string>[])
      assert.equal(
        (
          await fetch(
            `http://127.0.0.1:${(protegidoServidor.address() as AddressInfo).port}/api/results/export/pdf?scope=history`,
            { headers: encabezados },
          )
        ).status,
        401,
      )
    const invalido = await fetch(
      `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/pdf?scope=history&uid=other`,
    )
    assert.equal(invalido.status, 400)
  } finally {
    servidor.closeAllConnections()
    protegidoServidor.closeAllConnections()
    await Promise.all([
      new Promise<void>((resolver) => servidor.close(() => resolver())),
      new Promise<void>((resolver) =>
        protegidoServidor.close(() => resolver()),
      ),
    ])
  }
})
