import {
  FieldPath,
  Timestamp,
  type Query,
  type DocumentSnapshot,
} from "firebase-admin/firestore"
import { normalizarCategoria } from "../../../compartido/resultados"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import {
  historialHuella,
  HistorialConsultaError,
  validoHistorialId,
} from "../utilidades/consultaHistorial"
import type {
  ElementoHistorial,
  PaginaHistorial,
  ConsultaHistorial,
} from "../../../compartido/historial"

export type RegistroResultado = import("../../../compartido/resultados").PersistidoEjercicioResultado

interface Posicion {
  seconds: number
  nanoseconds: number
  path: string
}

interface Cursor {
  version: 1
  fingerprint: string
  cutoff: {
    seconds: number
    nanoseconds: number
  }
  after: Posicion
}

function marcaTiempo(valor: unknown): Timestamp | null {
  if (valor instanceof Timestamp) return valor
  if (valor instanceof Date && Number.isFinite(valor.getTime()))
    return Timestamp.fromDate(valor)
  if (typeof valor === "string" && Number.isFinite(Date.parse(valor)))
    return Timestamp.fromDate(new Date(valor))
  return null
}

function esMarca(
  valor: unknown,
): valor is {
  seconds: number
  nanoseconds: number
} {
  if (!valor || typeof valor !== "object") return false
  const marca = valor as {
    seconds?: unknown
    nanoseconds?: unknown
  }
  return (
    Number.isInteger(marca.seconds) &&
    Number(marca.seconds) >= -62135596800 &&
    Number(marca.seconds) <= 253402300799 &&
    Number.isInteger(marca.nanoseconds) &&
    Number(marca.nanoseconds) >= 0 &&
    Number(marca.nanoseconds) < 1e9
  )
}

function perteneceResultadoRuta(uid: string, ruta: string) {
  const partes = ruta.split("/")
  return (
    partes.length === 6 &&
    partes[0] === "users" &&
    partes[1] === uid &&
    partes[2] === "sessions" &&
    validoHistorialId(partes[3]) &&
    partes[4] === "results" &&
    validoHistorialId(partes[5])
  )
}

function decodificarCursor(
  uid: string,
  opciones: ConsultaHistorial,
): Cursor | null {
  if (!opciones.cursor) return null
  try {
    const cursor = JSON.parse(
      Buffer.from(opciones.cursor, "base64url").toString(),
    ) as Cursor
    if (
      cursor.version !== 1 ||
      cursor.fingerprint !== historialHuella(uid, opciones) ||
      !esMarca(cursor.cutoff) ||
      !esMarca(cursor.after) ||
      !perteneceResultadoRuta(uid, cursor.after.path)
    )
      throw new Error()
    return cursor
  } catch {
    throw new HistorialConsultaError(
      "El cursor no corresponde a esta consulta. Volvé a la primera página.",
    )
  }
}

function posicion(documento: DocumentSnapshot): Posicion {
  const tiempo = marcaTiempo(documento.data()?.completedAt)
  if (!tiempo) throw new Error("Resultado sin fecha de finalización válida.")
  return {
    seconds: tiempo.seconds,
    nanoseconds: tiempo.nanoseconds,
    path: documento.ref.path,
  }
}

function codificarCursor(
  uid: string,
  opciones: ConsultaHistorial,
  corte: Timestamp,
  despues: Posicion,
) {
  return Buffer.from(
    JSON.stringify({
      version: 1,
      fingerprint: historialHuella(uid, opciones),
      cutoff: { seconds: corte.seconds, nanoseconds: corte.nanoseconds },
      after: despues,
    } satisfies Cursor),
  ).toString("base64url")
}

export function hastaHistorialElemento(
  documento: DocumentSnapshot,
  incluirDetalles = false,
): ElementoHistorial {
  const datos = documento.data()!
  const partes = documento.ref.path.split("/")
  const salida: Record<string, unknown> = {
    id: `${partes[3]}-${documento.id}`,
    sessionId: partes[3],
    resultId: documento.id,
    completedAt: marcaTiempo(datos.completedAt)!.toDate().toISOString(),
  }
  const campos = [
    "completionDateSource",
    "exerciseId",
    "exerciseName",
    "exerciseType",
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
    "attempts",
    "averageResponseTimeMs",
    "timeouts",
    "falseStarts",
  ]
  for (const clave of campos)
    if (datos[clave] !== undefined) salida[clave] = datos[clave]
  if (datos.cognitiveFunctionId !== undefined)
    salida.cognitiveFunctionId = normalizarCategoria(
      String(datos.cognitiveFunctionId),
    )
  const creado = marcaTiempo(datos.createdAt)
  if (creado) salida.createdAt = creado.toDate().toISOString()
  const detalles = datos.details ?? datos.summary?.details
  if (detalles && typeof detalles === "object") {
    for (const clave of [
      "attempts",
      "averageResponseTimeMs",
      "timeouts",
      "falseStarts",
    ])
      if (salida[clave] === undefined && detalles[clave] !== undefined)
        salida[clave] = detalles[clave]
    if (incluirDetalles) salida.details = detalles
  }
  return salida as unknown as ElementoHistorial
}

export async function listaResultadoPagina(
  uid: string,
  opciones: ConsultaHistorial = {},
  baseDatos = obtenerFirestoreAdmin(),
): Promise<PaginaHistorial> {
  const limite = opciones.limit ?? 20
  const cursor = decodificarCursor(uid, opciones)
  const corte = cursor
    ? new Timestamp(cursor.cutoff.seconds, cursor.cutoff.nanoseconds)
    : Timestamp.now()
  let consulta: Query = baseDatos
    .collectionGroup("results")
    .where("userId", "==", uid)
    .where("completedAt", "<=", corte)
  if (opciones.category)
    consulta =
      opciones.category === "speed"
        ? consulta.where("cognitiveFunctionId", "in", [
            "speed",
            "processingSpeed",
          ])
        : consulta.where("cognitiveFunctionId", "==", opciones.category)
  if (opciones.exercise)
    consulta = consulta.where("exerciseType", "==", opciones.exercise)
  if (opciones.difficulty)
    consulta = consulta.where("difficultyBefore", "==", opciones.difficulty)
  if (opciones.from)
    consulta = consulta.where(
      "completedAt",
      ">=",
      Timestamp.fromDate(new Date(opciones.from)),
    )
  if (opciones.to)
    consulta = consulta.where(
      "completedAt",
      "<",
      Timestamp.fromDate(new Date(opciones.to)),
    )
  consulta = consulta
    .orderBy("completedAt", "desc")
    .orderBy(FieldPath.documentId(), "desc")
  let despues = cursor?.after,
    ultimoAceptado: Posicion | undefined,
    ultimoExaminado: Posicion | undefined
  const elementos: ElementoHistorial[] = [],
    padreCache = new Map<string, boolean>()
  let examinarRapido = false
  // El siguiente cursor permite continuar la búsqueda si predominan registros antiguos inconsistentes.
  for (let examinado = 0; examinado < 1000; ) {
    const loteTamano = Math.min(
      100,
      1000 - examinado,
      examinarRapido ? 100 : Math.max(1, limite - elementos.length + 1),
    )
    let paginaConsulta = consulta
    if (despues)
      paginaConsulta = paginaConsulta.startAfter(
        new Timestamp(despues.seconds, despues.nanoseconds),
        baseDatos.doc(despues.path),
      )
    const instantanea = await paginaConsulta.limit(loteTamano).get()
    examinado += instantanea.size
    for (const documento of instantanea.docs) {
      const actual = posicion(documento)
      ultimoExaminado = actual
      if (!perteneceResultadoRuta(uid, documento.ref.path)) {
        examinarRapido = true
        continue
      }
      const padre = documento.ref.parent.parent!
      if (!padreCache.has(padre.path))
        padreCache.set(
          padre.path,
          (await padre.get()).data()?.status === "completed",
        )
      if (!padreCache.get(padre.path)) {
        examinarRapido = true
        continue
      }
      if (elementos.length === limite)
        return {
          items: elementos,
          hasMore: true,
          nextCursor: codificarCursor(uid, opciones, corte, ultimoAceptado!),
        }
      elementos.push(hastaHistorialElemento(documento, opciones.includeDetails))
      ultimoAceptado = actual
    }
    if (instantanea.size < loteTamano)
      return { items: elementos, hasMore: false, nextCursor: null }
    despues = ultimoExaminado
  }
  return {
    items: elementos,
    hasMore: !!ultimoExaminado,
    nextCursor: ultimoExaminado
      ? codificarCursor(uid, opciones, corte, ultimoExaminado)
      : null,
  }
}

export async function listaResultados(uid: string) {
  return (await listaResultadoPagina(uid, { limit: 100, includeDetails: true }))
    .items
}

export async function obtenerResultado(
  uid: string,
  idSesion: string,
  resultadoId: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  if (!validoHistorialId(idSesion) || !validoHistorialId(resultadoId))
    throw new HistorialConsultaError("Identificador inválido.")
  const sesion = baseDatos.doc(`users/${uid}/sessions/${idSesion}`),
    referencia = sesion.collection("results").doc(resultadoId)
  const [padre, resultado] = await Promise.all([sesion.get(), referencia.get()])
  if (
    padre.data()?.status !== "completed" ||
    !resultado.exists ||
    !marcaTiempo(resultado.data()?.completedAt)
  )
    return null
  return hastaHistorialElemento(resultado, true)
}

export async function* recorrerResultados(
  uid: string,
  filtros: Omit<ConsultaHistorial, "cursor" | "limit"> = {},
  baseDatos = obtenerFirestoreAdmin(),
) {
  let cursor: string | undefined
  do {
    const pagina = await listaResultadoPagina(
      uid,
      { ...filtros, limit: 100, cursor },
      baseDatos,
    )
    for (const elemento of pagina.items) yield elemento
    cursor = pagina.nextCursor ?? undefined
  } while (cursor)
}
