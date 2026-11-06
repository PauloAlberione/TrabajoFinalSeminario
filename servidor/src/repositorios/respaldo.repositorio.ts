import { GoogleAuth } from "google-auth-library"

export interface DocumentoRespaldo {
  ruta: string
  campos: Record<string, unknown>
}

interface DocumentoFirestore {
  name: string
  fields?: Record<string, unknown>
  createTime?: string
}

export interface FuenteRespaldo {
  fechaLectura: string
  documentos: AsyncIterable<DocumentoRespaldo>
}

const TAMANO_PAGINA = 100
const MAX_SOLICITUDES = 12000

type TransporteRespaldo = <T,>(
  ruta: string,
  metodo: "GET" | "POST",
  datos?: unknown,
  parametros?: Record<string, string | number | boolean>,
) => Promise<T>

function codificarRuta(ruta: string) {
  return ruta.split("/").map(encodeURIComponent).join("/")
}

export async function fuenteRespaldo(
  proyecto: string,
  transporte?: TransporteRespaldo,
): Promise<FuenteRespaldo> {
  const cliente = transporte
    ? undefined
    : await new GoogleAuth({
        projectId: proyecto,
        scopes: ["https://www.googleapis.com/auth/datastore"],
      }).getClient()
  const base = `projects/${proyecto}/databases/(default)/documents`
  let solicitudes = 0

  async function solicitar<T>(
    ruta: string,
    metodo: "GET" | "POST",
    datos?: unknown,
    parametros?: Record<string, string | number | boolean>,
  ): Promise<T> {
    if (++solicitudes > MAX_SOLICITUDES)
      throw new Error("La copia superó el límite de consultas previsto.")
    if (transporte) return transporte<T>(ruta, metodo, datos, parametros)
    const rutaCodificada = codificarRuta(ruta).replace(
      /%3A(runQuery|listCollectionIds)$/,
      ":$1",
    )
    const respuesta = await cliente!.request<T>({
      url: `https://firestore.googleapis.com/v1/${rutaCodificada}`,
      method: metodo,
      data: datos,
      params: parametros,
      timeout: 20000,
    })
    return respuesta.data
  }

  // La fecha del servidor permite leer todas las páginas en el mismo instante.
  const lectura = await solicitar<Array<{ readTime: string }>>(
    `${base}:runQuery`,
    "POST",
    {
      structuredQuery: {
        from: [{ collectionId: "users" }],
        select: { fields: [{ fieldPath: "__name__" }] },
        limit: 1,
      },
    },
  )
  const fechaLectura = lectura[0]?.readTime
  if (!fechaLectura || !Number.isFinite(Date.parse(fechaLectura)))
    throw new Error("Firestore no devolvió una fecha de lectura válida.")

  async function* colecciones(padre: string): AsyncGenerator<string> {
    let siguiente = ""
    do {
      const pagina = await solicitar<{
        collectionIds?: string[]
        nextPageToken?: string
      }>(`${padre}:listCollectionIds`, "POST", {
        pageSize: TAMANO_PAGINA,
        readTime: fechaLectura,
        ...(siguiente ? { pageToken: siguiente } : {}),
      })
      for (const coleccion of pagina.collectionIds ?? []) yield coleccion
      if (pagina.nextPageToken && pagina.nextPageToken === siguiente)
        throw new Error("La paginación de colecciones no avanzó.")
      siguiente = pagina.nextPageToken ?? ""
    } while (siguiente)
  }

  async function* recorrer(padre: string): AsyncGenerator<DocumentoRespaldo> {
    for await (const coleccion of colecciones(padre)) {
      let siguiente = ""
      do {
        const pagina = await solicitar<{
          documents?: DocumentoFirestore[]
          nextPageToken?: string
        }>(`${padre}/${coleccion}`, "GET", undefined, {
          pageSize: TAMANO_PAGINA,
          readTime: fechaLectura,
          showMissing: true,
          ...(siguiente ? { pageToken: siguiente } : {}),
        })
        for (const documento of pagina.documents ?? []) {
          if (!documento.name.startsWith(`${base}/`))
            throw new Error("Firestore devolvió un documento fuera de la base.")
          if (documento.createTime)
            yield {
              ruta: documento.name.slice(base.length + 1),
              campos: documento.fields ?? {},
            }
          // También se recorren padres eliminados que aún tienen subcolecciones.
          yield* recorrer(documento.name)
        }
        if (pagina.nextPageToken && pagina.nextPageToken === siguiente)
          throw new Error("La paginación de documentos no avanzó.")
        siguiente = pagina.nextPageToken ?? ""
      } while (siguiente)
    }
  }

  return { fechaLectura, documentos: recorrer(base) }
}

export async function restaurarDocumentosEnEmulador(
  documentos: DocumentoRespaldo[],
  direccion: string,
  proyecto: string,
) {
  if (
    !/^127\.0\.0\.1:\d{2,5}$/.test(direccion) ||
    !/^demo-[a-z0-9-]+$/.test(proyecto)
  )
    throw new Error(
      "La restauración requiere un emulador local y un proyecto demo.",
    )

  const base = `projects/${proyecto}/databases/(default)/documents`
  async function solicitar(ruta: string, datos: unknown) {
    const respuesta = await fetch(`http://${direccion}/v1/${ruta}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(20000),
    })
    if (!respuesta.ok)
      throw new Error(
        `El emulador rechazó la restauración (HTTP ${respuesta.status}).`,
      )
    return respuesta.json() as Promise<{ collectionIds?: string[] }>
  }

  const existentes = await solicitar(`${base}:listCollectionIds`, {
    pageSize: 1,
  })
  if (existentes.collectionIds?.length)
    throw new Error(
      "El destino debe estar vacío. No se reemplazarán datos existentes.",
    )

  for (let inicio = 0; inicio < documentos.length; inicio += TAMANO_PAGINA)
    await solicitar(`${base}:commit`, {
      writes: documentos
        .slice(inicio, inicio + TAMANO_PAGINA)
        .map((documento) => ({
          update: {
            name: `${base}/${documento.ruta}`,
            fields: documento.campos,
          },
          currentDocument: { exists: false },
        })),
    })
}
