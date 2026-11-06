import {
  constants,
  createCipheriv,
  createDecipheriv,
  createPublicKey,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from "node:crypto"
import { gzipSync, gunzipSync } from "node:zlib"
import type {
  DocumentoRespaldo,
  FuenteRespaldo,
} from "../repositorios/respaldo.repositorio"

const MARCA_ARCHIVO = Buffer.from("MENTECLEAR-COPIA-1\n")
const MAX_DOCUMENTOS = 5000
const MAX_JSON_BYTES = 32 * 1024 * 1024
export const MAX_RESPALDO_BYTES = 8 * 1024 * 1024

export interface CopiaFirestore {
  version: 1
  aplicacion: "MenteClear"
  proyecto: string
  baseDatos: "(default)"
  creadaEn: string
  fechaLectura: string
  incluyeAutenticacion: false
  configuracion: {
    reglas: string
    indices: unknown
    revision: string | null
  }
  documentos: DocumentoRespaldo[]
}

export async function prepararCopia(
  proyecto: string,
  fuente: FuenteRespaldo,
  configuracion: CopiaFirestore["configuracion"],
): Promise<CopiaFirestore> {
  const documentos: DocumentoRespaldo[] = []
  const rutas = new Set<string>()
  let bytes = 0
  for await (const documento of fuente.documentos) {
    validarDocumento(documento)
    if (rutas.has(documento.ruta))
      throw new Error("La copia contiene rutas duplicadas.")
    rutas.add(documento.ruta)
    bytes += Buffer.byteLength(JSON.stringify(documento))
    if (documentos.length >= MAX_DOCUMENTOS || bytes > MAX_JSON_BYTES)
      throw new Error(
        "La base supera el límite del respaldo gratuito. Revisá su capacidad.",
      )
    documentos.push(documento)
  }
  return {
    version: 1,
    aplicacion: "MenteClear",
    proyecto,
    baseDatos: "(default)",
    creadaEn: new Date().toISOString(),
    fechaLectura: fuente.fechaLectura,
    incluyeAutenticacion: false,
    configuracion,
    documentos,
  }
}

function validarDocumento(valor: unknown): asserts valor is DocumentoRespaldo {
  if (!valor || typeof valor !== "object")
    throw new Error("Documento inválido.")
  const documento = valor as Partial<DocumentoRespaldo>
  const partes =
    typeof documento.ruta === "string" ? documento.ruta.split("/") : []
  if (
    partes.length < 2 ||
    partes.length % 2 !== 0 ||
    partes.some((parte) => !parte || parte === "." || parte === "..") ||
    !documento.campos ||
    typeof documento.campos !== "object" ||
    Array.isArray(documento.campos)
  )
    throw new Error("Ruta o campos inválidos en la copia.")
}

export function cifrarCopia(
  copia: CopiaFirestore,
  clavePublica: string,
): Buffer {
  const clave = createPublicKey(clavePublica)
  if (
    clave.asymmetricKeyType !== "rsa" ||
    (clave.asymmetricKeyDetails?.modulusLength ?? 0) < 3072
  )
    throw new Error("Se requiere una clave pública RSA de al menos 3072 bits.")
  const contenido = Buffer.from(JSON.stringify(copia))
  if (contenido.length > MAX_JSON_BYTES)
    throw new Error("La copia excede el tamaño permitido.")
  const claveSesion = randomBytes(32)
  const nonce = randomBytes(12)
  const encabezado = Buffer.from(
    JSON.stringify({
      algoritmo: "AES-256-GCM+RSA-OAEP-SHA256",
      clave: publicEncrypt(
        {
          key: clave,
          oaepHash: "sha256",
          padding: constants.RSA_PKCS1_OAEP_PADDING,
        },
        claveSesion,
      ).toString("base64"),
      nonce: nonce.toString("base64"),
    }),
  )
  const longitud = Buffer.alloc(4)
  longitud.writeUInt32BE(encabezado.length)
  const prefijo = Buffer.concat([MARCA_ARCHIVO, longitud, encabezado])
  const cifrador = createCipheriv("aes-256-gcm", claveSesion, nonce)
  cifrador.setAAD(prefijo)
  try {
    const resultado = Buffer.concat([
      prefijo,
      cifrador.update(gzipSync(contenido)),
      cifrador.final(),
      cifrador.getAuthTag(),
    ])
    if (resultado.length > MAX_RESPALDO_BYTES)
      throw new Error(
        "La copia cifrada supera 8 MiB. No se publicará una copia incompleta.",
      )
    return resultado
  } finally {
    claveSesion.fill(0)
    contenido.fill(0)
  }
}

export function descifrarCopia(
  archivo: Buffer,
  clavePrivada: string,
): CopiaFirestore {
  if (
    archivo.length > MAX_RESPALDO_BYTES ||
    archivo.length < MARCA_ARCHIVO.length + 21 ||
    !archivo.subarray(0, MARCA_ARCHIVO.length).equals(MARCA_ARCHIVO)
  )
    throw new Error("El archivo no es una copia de MenteClear válida.")
  const longitud = archivo.readUInt32BE(MARCA_ARCHIVO.length)
  const inicio = MARCA_ARCHIVO.length + 4
  const fin = inicio + longitud
  if (longitud > 4096 || fin >= archivo.length - 16)
    throw new Error("El encabezado de la copia está incompleto.")
  const encabezado = JSON.parse(
    archivo.subarray(inicio, fin).toString(),
  ) as Record<string, unknown>
  if (
    encabezado.algoritmo !== "AES-256-GCM+RSA-OAEP-SHA256" ||
    typeof encabezado.clave !== "string" ||
    typeof encabezado.nonce !== "string"
  )
    throw new Error("El formato de cifrado no es compatible.")
  const claveSesion = privateDecrypt(
    {
      key: clavePrivada,
      oaepHash: "sha256",
      padding: constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(encabezado.clave, "base64"),
  )
  const descifrador = createDecipheriv(
    "aes-256-gcm",
    claveSesion,
    Buffer.from(encabezado.nonce, "base64"),
  )
  descifrador.setAAD(archivo.subarray(0, fin))
  descifrador.setAuthTag(archivo.subarray(-16))
  let contenido: Buffer | undefined
  try {
    const comprimido = Buffer.concat([
      descifrador.update(archivo.subarray(fin, -16)),
      descifrador.final(),
    ])
    contenido = gunzipSync(comprimido, { maxOutputLength: MAX_JSON_BYTES })
    const copia: unknown = JSON.parse(contenido.toString())
    validarCopia(copia)
    return copia
  } finally {
    claveSesion.fill(0)
    contenido?.fill(0)
  }
}

function validarCopia(valor: unknown): asserts valor is CopiaFirestore {
  if (!valor || typeof valor !== "object") throw new Error("Copia inválida.")
  const copia = valor as Partial<CopiaFirestore>
  if (
    copia.version !== 1 ||
    copia.aplicacion !== "MenteClear" ||
    copia.baseDatos !== "(default)" ||
    copia.incluyeAutenticacion !== false ||
    typeof copia.proyecto !== "string" ||
    !copia.fechaLectura ||
    !Number.isFinite(Date.parse(copia.fechaLectura)) ||
    !copia.configuracion ||
    !Array.isArray(copia.documentos) ||
    copia.documentos.length > MAX_DOCUMENTOS
  )
    throw new Error("El contenido de la copia no es compatible.")
  const rutas = new Set<string>()
  for (const documento of copia.documentos) {
    validarDocumento(documento)
    if (rutas.has(documento.ruta))
      throw new Error("La copia contiene rutas duplicadas.")
    rutas.add(documento.ruta)
  }
}
