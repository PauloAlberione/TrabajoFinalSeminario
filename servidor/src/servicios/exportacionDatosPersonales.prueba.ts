import test from "node:test"
import assert from "node:assert/strict"
import { access, readFile, readdir } from "node:fs/promises"
import { dirname } from "node:path"
import { tmpdir } from "node:os"
import { Timestamp } from "firebase-admin/firestore"
import express from "express"
import type { AddressInfo } from "node:net"
import { personalDatosFuente } from "../repositorios/exportacionDatosPersonales.repositorio"
import { AlmacenDatosPersonales } from "../pruebas/almacenDatosPersonales"
import {
  crearPersonalDatosExportar,
  exportarJson,
} from "./exportacionDatosPersonales.servicio"
import { crearPersonalDatosExportarControlador } from "../controladores/exportacionDatosPersonales.controlador"
import { aplicacion } from "../aplicacion"

function lectores(almacen: AlmacenDatosPersonales) {
  return {
    source: (uid: string) => personalDatosFuente(uid, almacen.database),
    account: async (uid: string) => ({
      email: `${uid}@example.invalid`,
      emailVerified: true,
      passwordHash: "NEVER_HASH",
      refreshToken: "NEVER_AUTH_TOKEN",
      metadata: { creationTime: "2020-01-01T12:00:00Z" },
    }),
  }
}

const marca = new Timestamp(1600000000, 123456789)

function semilla(almacen: AlmacenDatosPersonales, uid = "owner") {
  almacen.documents.set(`users/${uid}`, {
    firstName: "María",
    lastName: "Pérez",
    birthDate: "1950-01-01",
    createdAt: marca,
    password: "NEVER_PASSWORD",
    private_key: "NEVER_KEY",
    accessibilityPreferences: {
      tamanoTexto: "extra",
      altoContraste: true,
      sonidos: false,
      recordatorios: false,
      frecuenciaRecordatorio: "weekly",
    },
    audioPreferences: { volume: 0.4, accessToken: "NEVER_PREF_TOKEN" },
  })
  almacen.documents.set(`users/${uid}/progress/memory`, {
    currentLevel: "hard",
    totalExercises: 120,
    promotionStreak: 1,
    credentials: "NEVER_PROGRESS_CREDENTIAL",
  })
  almacen.documents.set(`users/${uid}/progress/processingSpeed`, {
    currentLevel: "veryHard",
    totalExercises: 99,
  })
}

test("Una cuenta sin ejercicios exporta JSON válido con perfil, preferencias y fechas reales", async () => {
  const almacen = new AlmacenDatosPersonales()
  semilla(almacen)
  const archivo = await crearPersonalDatosExportar(
    "owner",
    undefined,
    lectores(almacen),
  )
  try {
    const texto = await readFile(archivo.path, "utf8"),
      datos = JSON.parse(texto)
    assert.equal(datos.schemaVersion, "1.0")
    assert.ok(Number.isFinite(Date.parse(datos.exportedAt)))
    assert.equal(datos.account.uid, "owner")
    assert.equal(datos.account.createdAt, "2020-01-01T12:00:00.000Z")
    assert.equal(datos.profile.firstName, "María")
    assert.equal(datos.profile.createdAt.nanoseconds, 123456789)
    assert.equal(datos.preferences.effectiveAccessibility.tamanoTexto, "extra")
    assert.equal(datos.preferences.effectiveAccessibility.sonidos, false)
    assert.equal(datos.preferences.stored.audioPreferences.volume, 0.4)
    assert.equal(
      datos.adaptiveDifficulty.find(
        (elemento: { category: string }) => elemento.category === "speed",
      ).currentLevel,
      "veryHard",
    )
    assert.deepEqual(datos.sessions, [])
    assert.equal(datos.recordCounts.exerciseResults, 0)
    assert.ok(!texto.includes("NEVER_"))
    assert.ok(texto.includes('\n  "schemaVersion"'))
  } finally {
    await archivo.cleanup()
  }
  await assert.rejects(access(dirname(archivo.path)))
})

test("La exportación completa recorre más de 100 sesiones y resultados e incluye todos los estados", async () => {
  const almacen = new AlmacenDatosPersonales()
  semilla(almacen)
  const estados = [
    "created",
    "active",
    "paused",
    "saving",
    "completed",
    "cancelled",
  ]
  for (let indice = 0; indice < 235; indice++) {
    const id = `session-${String(indice).padStart(3, "0")}`,
      ruta = `users/owner/sessions/${id}`
    almacen.documents.set(ruta, {
      status: estados[indice % estados.length],
      ownerToken: "NEVER_OWNER",
      cancellation: { version: 1, origin: "pendingList" },
      checkpoint: {
        version: 1,
        phase: "response",
        step: 2,
        activeSeconds: 12.345,
        writerToken: "NEVER_WRITER",
        state: { answers: ["respuesta parcial"] },
      },
    })
    almacen.documents.set(`${ruta}/results/completed`, {
      exerciseName: "Reacción visual",
      exerciseType: "visualReaction",
      correctAnswers: 4,
      errors: 1,
      actualTimeSeconds: 0.333333,
      details: {
        exerciseType: "visualReaction",
        medianResponseTimeMs: 221.345,
        trialResults: [
          { trialId: "one", responseTimeMs: 221.345, correct: true },
        ],
      },
    })
  }
  for (let indice = 0; indice < 205; indice++)
    almacen.documents.set(
      `users/owner/sessions/session-000/results/extra-${String(indice).padStart(3, "0")}`,
      { correctAnswers: indice, details: { score: indice } },
    )
  const archivo = await crearPersonalDatosExportar(
    "owner",
    undefined,
    lectores(almacen),
  )
  try {
    const texto = await readFile(archivo.path, "utf8"),
      datos = JSON.parse(texto)
    assert.equal(datos.sessions.length, 235)
    assert.deepEqual(datos.sessions[0].data.cancellation, {
      version: 1,
      origin: "pendingList",
    })
    assert.equal(
      new Set(datos.sessions.map((elemento: { id: string }) => elemento.id))
        .size,
      235,
    )
    assert.equal(datos.recordCounts.exerciseResults, 440)
    assert.equal(datos.sessions[0].exerciseResults.length, 206)
    assert.equal(datos.sessions.at(-1).id, "session-234")
    assert.ok(
      datos.sessions.some(
        (elemento: { data: { status: string } }) =>
          elemento.data.status === "cancelled",
      ),
    )
    assert.equal(
      datos.sessions[1].data.checkpoint.state.answers[0],
      "respuesta parcial",
    )
    assert.equal(
      datos.sessions[1].exerciseResults[0].data.details.trialResults[0]
        .responseTimeMs,
      221.345,
    )
    assert.equal(
      datos.sessions[1].exerciseResults[0].data.actualTimeSeconds,
      0.333333,
    )
    assert.ok(!texto.includes("NEVER_"))
    assert.ok(almacen.queries.every((consulta) => consulta.limit === 100))
    assert.equal(
      almacen.queries.filter(
        (consulta) => consulta.path === "users/owner/sessions",
      ).length,
      3,
    )
  } finally {
    await archivo.cleanup()
  }
})

test("La dificultad canónica prevalece sin modificar ninguno de los documentos guardados", async () => {
  const almacen = new AlmacenDatosPersonales()
  semilla(almacen)
  almacen.documents.set("users/owner/progress/speed", {
    currentLevel: "normal",
    totalExercises: 2,
  })
  const antes = [...almacen.documents]
  const archivo = await crearPersonalDatosExportar(
    "owner",
    undefined,
    lectores(almacen),
  )
  try {
    const datos = JSON.parse(await readFile(archivo.path, "utf8"))
    assert.equal(datos.categoryProgress.length, 3)
    assert.equal(
      datos.adaptiveDifficulty.find(
        (elemento: { category: string }) => elemento.category === "speed",
      ).currentLevel,
      "normal",
    )
    assert.equal(
      datos.adaptiveDifficulty.find(
        (elemento: { category: string }) => elemento.category === "language",
      ).currentLevel,
      null,
    )
    assert.deepEqual([...almacen.documents], antes)
  } finally {
    await archivo.cleanup()
  }
})

test("La exportación no consulta otros usuarios y elimina credenciales anidadas sin perder métricas", async () => {
  const almacen = new AlmacenDatosPersonales()
  semilla(almacen)
  semilla(almacen, "foreign")
  almacen.documents.set("users/foreign/sessions/private", {
    status: "completed",
    exercise: { prompt: "OTHER_USER_ONLY" },
  })
  almacen.documents.set("users/foreign/sessions/private/results/completed", {
    exerciseName: "OTHER_USER_ONLY",
  })
  const archivo = await crearPersonalDatosExportar(
    "owner",
    undefined,
    lectores(almacen),
  )
  try {
    const texto = await readFile(archivo.path, "utf8")
    assert.ok(!texto.includes("OTHER_USER_ONLY"))
    assert.ok(almacen.reads.every((ruta) => ruta.startsWith("users/owner")))
    assert.deepEqual(
      exportarJson({
        score: 12.3,
        nested: {
          access_token: "NO",
          privateKey: "NO",
          serviceAccount: { key: "NO" },
          passwordHash: "NO",
          attempts: [{ correct: true, idToken: "NO" }],
        },
      }),
      { score: 12.3, nested: { attempts: [{ correct: true }] } },
    )
  } finally {
    await archivo.cleanup()
  }
})

test("Una cuenta autenticada sin perfil en Firestore puede exportar su información y secciones vacías", async () => {
  const almacen = new AlmacenDatosPersonales()
  const archivo = await crearPersonalDatosExportar(
    "owner",
    undefined,
    lectores(almacen),
  )
  try {
    const datos = JSON.parse(await readFile(archivo.path, "utf8"))
    assert.equal(datos.profile, null)
    assert.equal(datos.account.email, "owner@example.invalid")
    assert.deepEqual(datos.sessions, [])
  } finally {
    await archivo.cleanup()
  }
})

test("La preparación cancelada o fallida elimina todos los archivos temporales privados", async () => {
  const almacen = new AlmacenDatosPersonales(),
    antes = (await readdir(tmpdir()))
      .filter((nombre) => nombre.startsWith("menteclear-personal-data-"))
      .sort()
  const controlador = new AbortController()
  controlador.abort()
  await assert.rejects(
    crearPersonalDatosExportar("owner", controlador.signal, lectores(almacen)),
  )
  await assert.rejects(
    crearPersonalDatosExportar("owner", undefined, {
      ...lectores(almacen),
      account: async () => {
        throw new Error("Auth unavailable")
      },
    }),
  )
  assert.deepEqual(
    (await readdir(tmpdir()))
      .filter(
        (nombre) =>
          nombre.startsWith("menteclear-personal-data-") &&
          !antes.includes(nombre),
      )
      .sort(),
    [],
  )
})

test("El controlador descarga un archivo privado completo y exige autenticación sin aceptar UID ajeno", async () => {
  const almacen = new AlmacenDatosPersonales()
  semilla(almacen)
  const pruebaAplicacion = express()
  pruebaAplicacion.get(
    "/export",
    (solicitar, respuesta, siguiente) => {
      Object.assign(solicitar, { userId: "owner" })
      siguiente()
    },
    crearPersonalDatosExportarControlador((uid, senal) =>
      crearPersonalDatosExportar(uid, senal, lectores(almacen)),
    ),
  )
  const servidor = pruebaAplicacion.listen(0, "127.0.0.1"),
    protegidoServidor = aplicacion.listen(0, "127.0.0.1")
  await Promise.all([
    new Promise((resolver) => servidor.once("listening", resolver)),
    new Promise((resolver) => protegidoServidor.once("listening", resolver)),
  ])
  try {
    const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`
    const respuesta = await fetch(`${base}/export`),
      buffer = Buffer.from(await respuesta.arrayBuffer())
    assert.equal(respuesta.status, 200)
    assert.equal(JSON.parse(buffer.toString()).account.uid, "owner")
    assert.equal(Number(respuesta.headers.get("content-length")), buffer.length)
    assert.ok(
      respuesta.headers.get("content-type")!.includes("application/json"),
    )
    assert.ok(
      respuesta.headers.get("content-disposition")!.includes("attachment;"),
    )
    assert.equal(respuesta.headers.get("cache-control"), "private, no-store")
    assert.equal((await fetch(`${base}/export?uid=foreign`)).status, 400)
    for (const encabezados of [
      {},
      { Authorization: "Bearer invalid" },
    ] as Record<string, string>[])
      assert.equal(
        (
          await fetch(
            `http://127.0.0.1:${(protegidoServidor.address() as AddressInfo).port}/api/users/me/export`,
            { headers: encabezados },
          )
        ).status,
        401,
      )
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

test("Cancelar después de escribir sesiones también elimina el JSON incompleto", async () => {
  const almacen = new AlmacenDatosPersonales()
  semilla(almacen)
  almacen.documents.set("users/owner/sessions/first", {
    status: "paused",
    checkpoint: { state: { answers: ["partial"] } },
  })
  const abortar = new AbortController(),
    antes = (await readdir(tmpdir()))
      .filter((nombre) => nombre.startsWith("menteclear-personal-data-"))
      .sort()
  const dependencias = lectores(almacen)
  const fuente = dependencias.source
  dependencias.source = (uid) => {
    const original = fuente(uid)
    return {
      ...original,
      async *documents(coleccion, senal) {
        for await (const documento of original.documents(coleccion, senal)) {
          yield documento
          if (coleccion === "sessions") abortar.abort()
        }
      },
    }
  }
  await assert.rejects(
    crearPersonalDatosExportar("owner", abortar.signal, dependencias),
  )
  assert.deepEqual(
    (await readdir(tmpdir()))
      .filter(
        (nombre) =>
          nombre.startsWith("menteclear-personal-data-") &&
          !antes.includes(nombre),
      )
      .sort(),
    [],
  )
})
