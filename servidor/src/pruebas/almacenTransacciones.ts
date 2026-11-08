import type { Firestore } from "firebase-admin/firestore"
// Simula transacciones optimistas: las escrituras simultáneas invalidan lecturas y repiten la operación.
export class AlmacenTransacciones {
  documents = new Map<string, Record<string, unknown>>()
  versions = new Map<string, number>()
  nextId = 0
  ref(ruta: string): {
    path: string
    id: string
    get: () => Promise<{
      exists: boolean
      data: () => Record<string, unknown> | undefined
    }>
    collection: (
      nombre: string,
    ) => ReturnType<AlmacenTransacciones["collection"]>
  } {
    return {
      path: ruta,
      id: ruta.split("/").at(-1)!,
      get: async () => {
        const datos = this.documents.get(ruta)
        return { exists: !!datos, data: () => datos && { ...datos } }
      },
      collection: (nombre) => this.collection(`${ruta}/${nombre}`),
    }
  }
  collection(ruta: string) {
    return {
      doc: (id = `session-${++this.nextId}`) => this.ref(`${ruta}/${id}`),
    }
  }
  database = {
    doc: (ruta: string) => this.ref(ruta),
    collection: (ruta: string) => this.collection(ruta),
    runTransaction: async <T,>(
      devolucion: (transaccion: {
        get: (referencia: { path: string }) => Promise<{
          exists: boolean
          data: () => Record<string, unknown> | undefined
        }>
        set: (
          referencia: { path: string },
          datos: Record<string, unknown>,
          opciones?: { merge?: boolean },
        ) => void
        update: (
          referencia: { path: string },
          datos: Record<string, unknown>,
        ) => void
      }) => Promise<T>,
    ) => {
      for (let reintentar = 0; reintentar < 20; reintentar++) {
        const lecturas = new Map<string, number>()
        const escrituras: {
          path: string
          data: Record<string, unknown>
          merge: boolean
          update?: boolean
        }[] = []
        const resultado = await devolucion({
          get: async (referencia) => {
            lecturas.set(
              referencia.path,
              this.versions.get(referencia.path) ?? 0,
            )
            const datos = this.documents.get(referencia.path)
            return { exists: !!datos, data: () => datos && { ...datos } }
          },
          set: (referencia, datos, opciones) => {
            escrituras.push({
              path: referencia.path,
              data: datos,
              merge: !!opciones?.merge,
            })
          },
          update: (referencia, datos) => {
            escrituras.push({
              path: referencia.path,
              data: datos,
              merge: true,
              update: true,
            })
          },
        })
        if (
          [...lecturas].some(
            ([ruta, version]) => version !== (this.versions.get(ruta) ?? 0),
          )
        )
          continue
        for (const escribir of escrituras) {
          const salida = {
            ...(escribir.merge ? this.documents.get(escribir.path) : {}),
          }
          for (const [clave, valor] of Object.entries(escribir.data)) {
            if (!escribir.update || !clave.includes(".")) {
              salida[clave] = valor
              continue
            }
            const [campo, anidado] = clave.split(".")
            salida[campo] = {
              ...(salida[campo] as Record<string, unknown> ?? {}),
              [anidado]: valor,
            }
          }
          this.documents.set(escribir.path, salida)
          this.versions.set(
            escribir.path,
            (this.versions.get(escribir.path) ?? 0) + 1,
          )
        }
        return resultado
      }
      throw new Error("Transaction retry limit")
    },
  } as unknown as Firestore
}
