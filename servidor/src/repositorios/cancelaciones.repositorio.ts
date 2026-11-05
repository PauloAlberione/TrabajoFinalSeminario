import {
  FieldPath,
  Timestamp,
  type DocumentSnapshot,
} from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"

interface PaginaDocumentos {
  items: {
    id: string
    data: Record<string, unknown>
  }[]
  nextCursor: string | null
  hasMore: boolean
}

interface Posicion {
  seconds: number
  nanoseconds: number
  id: string
}

interface Cursor {
  version: 1
  uid: string
  cutoff: {
    seconds: number
    nanoseconds: number
  }
  after: Posicion
}

export class ConsultaCanceladasError extends Error {}

function marcaValida(
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

export function interpretarCanceladasConsulta(
  uid: string,
  consulta: Record<string, unknown>,
) {
  if (
    Object.keys(consulta).some((clave) => !["limit", "cursor"].includes(clave))
  )
    throw new ConsultaCanceladasError("Filtro no permitido.")
  const limite =
    consulta.limit === undefined
      ? 20
      : typeof consulta.limit === "string" && /^\d+$/.test(consulta.limit)
        ? Number(consulta.limit)
        : NaN
  if (!Number.isInteger(limite) || limite < 1 || limite > 100)
    throw new ConsultaCanceladasError("Cantidad de actividades inválida.")
  let cursor: Cursor | null = null
  if (consulta.cursor !== undefined) {
    try {
      if (typeof consulta.cursor !== "string" || consulta.cursor.length > 2000)
        throw new Error()
      cursor = (JSON.parse(
        Buffer.from(consulta.cursor, "base64url").toString(),
      ) as Cursor)
      if (
        cursor.version !== 1 ||
        cursor.uid !== uid ||
        !marcaValida(cursor.cutoff) ||
        !marcaValida(cursor.after) ||
        typeof cursor.after.id !== "string" ||
        !/^[\w-]+$/.test(cursor.after.id)
      )
        throw new Error()
    } catch {
      throw new ConsultaCanceladasError(
        "La página no corresponde a esta cuenta. Volvé al inicio del registro.",
      )
    }
  }
  return { limite, cursor }
}

function posicion(documento: DocumentSnapshot): Posicion {
  const tiempo = documento.data()?.endedAt as Timestamp
  return {
    seconds: tiempo.seconds,
    nanoseconds: tiempo.nanoseconds,
    id: documento.id,
  }
}

export async function listarSesionesCanceladas(
  uid: string,
  parametros: Record<string, unknown> = {},
  baseDatos = obtenerFirestoreAdmin(),
): Promise<PaginaDocumentos> {
  const { limite, cursor } = interpretarCanceladasConsulta(uid, parametros)
  const corte = cursor
    ? new Timestamp(cursor.cutoff.seconds, cursor.cutoff.nanoseconds)
    : Timestamp.now()
  const consulta = baseDatos
    .collection(`users/${uid}/sessions`)
    .where("endedAt", "<=", corte)
    .orderBy("endedAt", "desc")
    .orderBy(FieldPath.documentId(), "desc")
  let despues = cursor?.after,
    ultimoAceptado: Posicion | undefined,
    ultimoLeido: Posicion | undefined
  const elementos: PaginaDocumentos["items"] = []
  const siguiente = (desde: Posicion): PaginaDocumentos => ({
    items: elementos,
    hasMore: true,
    nextCursor: Buffer.from(
      JSON.stringify({
        version: 1,
        uid,
        cutoff: { seconds: corte.seconds, nanoseconds: corte.nanoseconds },
        after: desde,
      } satisfies Cursor),
    ).toString("base64url"),
  })
  // Se recorre el índice simple de fecha para funcionar sin índices compuestos adicionales.
  for (let examinados = 0; examinados < 1000; ) {
    let pagina = consulta
    if (despues)
      pagina = pagina.startAfter(
        new Timestamp(despues.seconds, despues.nanoseconds),
        baseDatos.doc(`users/${uid}/sessions/${despues.id}`),
      )
    const tamano = Math.min(50, 1000 - examinados),
      lote = await pagina.limit(tamano).get()
    examinados += lote.size
    for (const documento of lote.docs) {
      ultimoLeido = posicion(documento)
      if (documento.data().status !== "cancelled") continue
      if (elementos.length === limite) return siguiente(ultimoAceptado!)
      elementos.push({ id: documento.id, data: documento.data() })
      ultimoAceptado = ultimoLeido
    }
    if (lote.size < tamano)
      return { items: elementos, hasMore: false, nextCursor: null }
    despues = ultimoLeido
  }
  return ultimoLeido
    ? siguiente(ultimoLeido)
    : { items: elementos, hasMore: false, nextCursor: null }
}

export async function obtenerSesionCancelada(
  uid: string,
  id: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  if (!/^[\w-]+$/.test(id))
    throw new ConsultaCanceladasError("Actividad inválida.")
  const documento = await baseDatos.doc(`users/${uid}/sessions/${id}`).get(),
    datos = documento.data()
  return datos?.status === "cancelled" ? { id, data: datos } : null
}
