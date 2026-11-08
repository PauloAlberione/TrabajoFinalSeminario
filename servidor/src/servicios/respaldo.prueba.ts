import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { prepararCopia, cifrarCopia, descifrarCopia } from "./respaldo.servicio"
import {
  fuenteRespaldo,
  restaurarDocumentosEnEmulador,
  type DocumentoRespaldo,
} from "../repositorios/respaldo.repositorio"

const claves = generateKeyPairSync("rsa", {
  modulusLength: 3072,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
})
const fechaLectura = "2026-11-05T10:00:00.123456Z"
const configuracion = {
  reglas: "reglas de prueba",
  indices: {},
  revision: null,
}

async function copiaDe(documentos: DocumentoRespaldo[]) {
  return prepararCopia(
    "demo-prueba",
    {
      fechaLectura,
      documentos: (async function* () {
        yield* documentos
      })(),
    },
    configuracion,
  )
}

test("El cifrado conserva tipos, IDs, documentos vacíos y resultados anidados", async () => {
  const documentos = [
    {
      ruta: "users/uno",
      campos: {
        nombre: { stringValue: "Información privada" },
        fecha: { timestampValue: fechaLectura },
        entero: { integerValue: "9223372036854775807" },
        bytes: { bytesValue: "AQID" },
        referencia: {
          referenceValue:
            "projects/demo-prueba/databases/(default)/documents/users/uno",
        },
        nulo: { nullValue: null },
        arreglo: { arrayValue: { values: [{ booleanValue: true }] } },
      },
    },
    {
      ruta: "users/uno/sessions/sesion/results/completed",
      campos: {
        details: { mapValue: { fields: { intentos: { integerValue: "4" } } } },
      },
    },
    { ruta: "users/vacio", campos: {} },
  ]
  const copia = await copiaDe(documentos)
  const cifrada = cifrarCopia(copia, claves.publicKey)
  assert.equal(cifrada.includes(Buffer.from("Información privada")), false)
  assert.deepEqual(descifrarCopia(cifrada, claves.privateKey), copia)
  assert.notDeepEqual(cifrada, cifrarCopia(copia, claves.publicKey))
})

test("Una copia vacía sigue siendo una copia válida de la base", async () => {
  const copia = await copiaDe([])
  assert.deepEqual(
    descifrarCopia(cifrarCopia(copia, claves.publicKey), claves.privateKey)
      .documentos,
    [],
  )
})

test("Se rechazan archivos alterados, truncados y claves incorrectas", async () => {
  const archivo = cifrarCopia(await copiaDe([]), claves.publicKey)
  const alterado = Buffer.from(archivo)
  alterado[alterado.length - 20] ^= 1
  assert.throws(() => descifrarCopia(alterado, claves.privateKey))
  assert.throws(() =>
    descifrarCopia(archivo.subarray(0, 30), claves.privateKey),
  )
  assert.throws(() => descifrarCopia(archivo, "clave incorrecta"))
})

test("Los límites y rutas impiden copias parciales o ambiguas", async () => {
  const documento = { ruta: "users/uno", campos: {} }
  await assert.rejects(() => copiaDe([documento, documento]), /duplicadas/)
  await assert.rejects(
    () => copiaDe([{ ruta: "users/../sessions", campos: {} }]),
    /inválidos/,
  )
  await assert.rejects(
    () =>
      copiaDe(
        Array.from({ length: 5001 }, (_, indice) => ({
          ruta: `users/u${indice}`,
          campos: {},
        })),
      ),
    /límite/,
  )
  await assert.rejects(
    () =>
      copiaDe([
        {
          ruta: "users/grande",
          campos: { contenido: "x".repeat(33 * 1024 * 1024) },
        },
      ]),
    /límite/,
  )
})

test("La lectura pagina sin límite de 100 y recupera subcolecciones de padres ausentes", async () => {
  const base = "projects/demo-prueba/databases/(default)/documents"
  const fechas: unknown[] = []
  const fuente = await fuenteRespaldo(
    "demo-prueba",
    async <T,>(
      ruta: string,
      metodo: string,
      datos?: unknown,
      parametros?: Record<string, unknown>,
    ) => {
      if (ruta.endsWith(":runQuery")) return [{ readTime: fechaLectura }] as T
      const cuerpo = datos as Record<string, unknown> | undefined
      fechas.push(cuerpo?.readTime ?? parametros?.readTime)
      if (ruta.endsWith(":listCollectionIds")) {
        const padre = ruta.slice(0, -":listCollectionIds".length)
        return {
          collectionIds:
            padre === base
              ? ["users"]
              : padre === `${base}/users/ausente`
                ? ["sessions"]
                : [],
        } as T
      }
      if (ruta === `${base}/users/ausente/sessions`)
        return {
          documents: [
            {
              name: `${ruta}/recuperable`,
              createTime: fechaLectura,
              fields: {},
            },
          ],
        } as T
      assert.equal(metodo, "GET")
      assert.equal(parametros?.showMissing, true)
      if (parametros?.pageToken === "segunda")
        return { documents: [{ name: `${base}/users/ausente` }] } as T
      return {
        documents: Array.from({ length: 100 }, (_, indice) => ({
          name: `${base}/users/u${indice}`,
          createTime: fechaLectura,
        })),
        nextPageToken: "segunda",
      } as T
    },
  )
  const copia = await prepararCopia("demo-prueba", fuente, configuracion)
  assert.equal(copia.documentos.length, 101)
  assert(
    copia.documentos.some(
      (documento) => documento.ruta === "users/ausente/sessions/recuperable",
    ),
  )
  assert(fechas.every((fecha) => fecha === fechaLectura))
})

test("No se permite restaurar en producción ni en servidores remotos", async () => {
  await assert.rejects(
    () =>
      restaurarDocumentosEnEmulador(
        [],
        "firestore.googleapis.com:443",
        "demo-prueba",
      ),
    /emulador local/,
  )
  await assert.rejects(
    () =>
      restaurarDocumentosEnEmulador(
        [],
        "127.0.0.1:8080",
        "proyectofinal-84c8d",
      ),
    /proyecto demo/,
  )
})
