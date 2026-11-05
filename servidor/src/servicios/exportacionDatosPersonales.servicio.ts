import { getAuth } from "firebase-admin/auth"
import { Timestamp } from "firebase-admin/firestore"
import { mkdtemp, open, rm, stat } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { personalDatosFuente } from "../repositorios/exportacionDatosPersonales.repositorio"
import { CATEGORIA_IDS } from "../../../compartido/resultados"
import { leerPreferenciasAccesibilidad } from "../../../compartido/perfil"
import type { ExportarJsonValor } from "../../../compartido/exportacionDatosPersonales"

const perfilCampos = [
  "firstName",
  "lastName",
  "email",
  "birthDate",
  "gender",
  "countryCode",
  "timeZone",
  "avatarTone",
  "createdAt",
  "updatedAt",
  "nombre",
  "apellido",
  "fechaNacimiento",
  "fechaRegistro",
  "rachaActual",
  "mejorRacha",
  "ultimoAcceso",
  "diasActivos",
]
const progresoCampos = [
  "cognitiveFunctionId",
  "currentLevel",
  "promotionStreak",
  "demotionStreak",
  "totalExercises",
  "totalSessions",
  "averageAccuracy",
  "averageTime",
  "lastPerformanceScore",
  "updatedAt",
  "migratedFrom",
]
const sesionCampos = [
  "cancellation",
  "status",
  "startedAt",
  "endedAt",
  "createdAt",
  "updatedAt",
  "exerciseCount",
  "activeSeconds",
  "exercise",
  "checkpoint",
  "pendingResult",
]
const resultadoCampos = [
  "exerciseId",
  "exerciseName",
  "exerciseType",
  "cognitiveFunctionId",
  "difficultyBefore",
  "difficultyAfter",
  "adaptationDecision",
  "adaptationStatus",
  "correctAnswers",
  "errors",
  "totalQuestions",
  "accuracy",
  "actualTimeSeconds",
  "actualResponseTimeSeconds",
  "targetTimeSeconds",
  "responseTimeEfficiency",
  "timeEfficiency",
  "performanceScore",
  "timingSource",
  "details",
  "summary",
  "attempts",
  "averageResponseTimeMs",
  "timeouts",
  "falseStarts",
  "startedAt",
  "completedAt",
  "createdAt",
  "completionDateSource",
]

function prohibidoCampo(clave: string) {
  const normalizado = clave.replace(/[^a-z0-9]/gi, "").toLowerCase()
  return (
    /password|passphrase|secret|credential|privatekey|token|apikey|authorization|cookie|serviceaccount/.test(
      normalizado,
    ) ||
    ["uid", "userid", "proto", "prototype", "constructor"].includes(normalizado)
  )
}

export function exportarJson(valor: unknown): ExportarJsonValor {
  if (valor === null || typeof valor === "boolean" || typeof valor === "string")
    return valor
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null
  if (valor instanceof Timestamp)
    return {
      iso: valor.toDate().toISOString(),
      seconds: valor.seconds,
      nanoseconds: valor.nanoseconds,
    }
  if (valor instanceof Date)
    return Number.isFinite(valor.getTime()) ? valor.toISOString() : null
  if (Array.isArray(valor)) return valor.map(exportarJson)
  if (
    !valor ||
    typeof valor !== "object" ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(valor))
  )
    return null
  return Object.fromEntries(
    Object.entries(valor)
      .filter(
        ([clave, elemento]) => !prohibidoCampo(clave) && elemento !== undefined,
      )
      .map(([clave, elemento]) => [clave, exportarJson(elemento)]),
  )
}

function seleccionar(
  datos: Record<string, unknown>,
  campos: readonly string[],
) {
  return exportarJson(
    Object.fromEntries(
      campos
        .filter((clave) => datos[clave] !== undefined)
        .map((clave) => [clave, datos[clave]]),
    ),
  )
}

interface CuentaDatos {
  email?: string
  emailVerified?: boolean
  metadata: {
    creationTime?: string
    lastSignInTime?: string
  }
}

interface ExportarDependencias {
  source: typeof personalDatosFuente
  account: (uid: string) => Promise<CuentaDatos>
}

const dependencias: ExportarDependencias = {
  source: personalDatosFuente,
  account: (uid) => getAuth().getUser(uid),
}

function isoFecha(valor: unknown): string | null {
  const fecha =
    valor instanceof Timestamp
      ? valor.toDate()
      : valor instanceof Date
        ? valor
        : typeof valor === "string"
          ? new Date(valor)
          : null
  return fecha && Number.isFinite(fecha.getTime()) ? fecha.toISOString() : null
}

export async function crearPersonalDatosExportar(
  uid: string,
  senal?: AbortSignal,
  lectores = dependencias,
  ahora = new Date(),
) {
  const directorio = await mkdtemp(join(tmpdir(), "menteclear-personal-data-"))
  const limpiar = () => rm(directorio, { recursive: true, force: true })
  const ruta = join(directorio, "personal-data.json")
  try {
    senal?.throwIfAborted()
    const fuente = lectores.source(uid)
    const [perfil, cuenta] = await Promise.all([
      fuente.profile(),
      lectores.account(uid),
    ])
    const progreso: Array<{
      id: string
      data: ExportarJsonValor
    }> = []
    for await (const documento of fuente.documents("progress", senal))
      progreso.push({
        id: documento.id,
        data: seleccionar(documento.data, progresoCampos),
      })
    const niveles = CATEGORIA_IDS.map((categoria) => {
      const documento =
        progreso.find((elemento) => elemento.id === categoria) ??
        (categoria === "speed"
          ? progreso.find((elemento) => elemento.id === "processingSpeed")
          : undefined)
      const datos =
        documento?.data as Record<string, ExportarJsonValor> | undefined
      return {
        category: categoria,
        currentLevel: datos?.currentLevel ?? null,
        sourceDocumentId: documento?.id ?? null,
      }
    })
    const preferencias: Record<string, unknown> = {}
    for (const [clave, valor] of Object.entries(perfil ?? {}))
      if (/preferences|preferencias/i.test(clave) && !prohibidoCampo(clave))
        preferencias[clave] = valor
    const encabezado = {
      schemaVersion: "1.0",
      application: "MenteClear",
      exportedAt: ahora.toISOString(),
      account: {
        uid,
        email: cuenta.email ?? null,
        emailVerified: cuenta.emailVerified ?? null,
        createdAt:
          isoFecha(cuenta.metadata.creationTime) ??
          isoFecha(perfil?.createdAt ?? perfil?.fechaRegistro),
        lastSignInAt: isoFecha(cuenta.metadata.lastSignInTime),
      },
      profile: perfil ? seleccionar(perfil, perfilCampos) : null,
      preferences: {
        stored: exportarJson(preferencias),
        effectiveAccessibility: leerPreferenciasAccesibilidad(
          perfil?.accessibilityPreferences,
          perfil?.preferenciasAccesibilidad,
        ),
      },
      categoryProgress: progreso,
      adaptiveDifficulty: niveles,
      notes: [
        "Copia de los datos propios registrados. No es una evaluación clínica.",
        "Las sesiones incluyen todos los estados y los resultados existentes bajo su ruta. Se conservan datos antiguos sin fecha.",
        "Los timestamps de Firestore incluyen ISO, segundos y nanosegundos. Las preferencias efectivas usan los mismos valores predeterminados de la aplicación.",
        "La lectura por páginas no es una transacción global: la actividad concurrente puede reflejarse en distintas partes de la copia. No es un archivo de credenciales ni de recuperación de sesiones.",
      ],
    }
    const archivo = await open(ruta, "wx", 0o600)
    let sesionCantidad = 0,
      resultadoCantidad = 0,
      completadoResultadoCantidad = 0
    try {
      const encabezadoCampos = Object.entries(encabezado)
        .map(
          ([clave, valor]) =>
            `  ${JSON.stringify(clave)}: ${JSON.stringify(valor, null, 2).replace(/\n/g, "\n  ")}`,
        )
        .join(",\n")
      await archivo.appendFile(`{\n${encabezadoCampos},\n  "sessions": [`)
      for await (const sesion of fuente.documents("sessions", senal)) {
        senal?.throwIfAborted()
        const datos = JSON.stringify(
          seleccionar(sesion.data, sesionCampos),
          null,
          2,
        ).replace(/\n/g, "\n      ")
        await archivo.appendFile(
          `${
            sesionCantidad ? "," : ""
          }\n    {\n      "id": ${JSON.stringify(sesion.id)},\n      "data": ${datos},\n      "exerciseResults": [`,
        )
        let cantidad = 0
        for await (const resultado of fuente.results(sesion.id, senal)) {
          senal?.throwIfAborted()
          const entrada = {
            id: resultado.id,
            data: seleccionar(resultado.data, resultadoCampos),
          }
          await archivo.appendFile(
            `${
              cantidad ? "," : ""
            }\n        ${JSON.stringify(entrada, null, 2).replace(/\n/g, "\n        ")}`,
          )
          cantidad++
          resultadoCantidad++
          if (sesion.data.status === "completed") completadoResultadoCantidad++
        }
        await archivo.appendFile("\n      ]\n    }")
        sesionCantidad++
      }
      await archivo.appendFile(
        `\n  ],\n  "recordCounts": ${JSON.stringify({ sessions: sesionCantidad, exerciseResults: resultadoCantidad, resultsInCompletedSessions: completadoResultadoCantidad })}\n}\n`,
      )
    } finally {
      await archivo.close()
    }
    senal?.throwIfAborted()
    return {
      path: ruta,
      size: (await stat(ruta)).size,
      cleanup: limpiar,
      filename: `MenteClear-mis-datos-${ahora.toISOString().slice(0, 10)}.json`,
    }
  } catch (error) {
    await limpiar()
    throw error
  }
}
