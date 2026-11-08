import { Timestamp, type Firestore } from "firebase-admin/firestore"

type Datos = Record<string, unknown>

function comparar(izquierda: unknown, derecha: unknown): number {
  if (izquierda instanceof Timestamp && derecha instanceof Timestamp)
    return (
      izquierda.seconds - derecha.seconds ||
      izquierda.nanoseconds - derecha.nanoseconds
    )
  return String(izquierda).localeCompare(String(derecha))
}

export class AlmacenHistorial {
  documents = new Map<string, Datos>()
  reads: string[] = []
  ref(ruta: string): {
    path: string
    id: string
    get: () => Promise<ReturnType<AlmacenHistorial["snapshot"]>>
    collection: (
      nombre: string,
    ) => { doc: (id: string) => ReturnType<AlmacenHistorial["ref"]> }
  } {
    return {
      path: ruta,
      id: ruta.split("/").at(-1)!,
      get: async () => {
        this.reads.push(ruta)
        return this.snapshot(ruta)
      },
      collection: (nombre) => ({
        doc: (id) => this.ref(`${ruta}/${nombre}/${id}`),
      }),
    }
  }
  snapshot(ruta: string) {
    const datos = this.documents.get(ruta),
      referencia = this.ref(ruta)
    return {
      id: referencia.id,
      exists: !!datos,
      data: () => datos,
      ref: {
        ...referencia,
        parent: { parent: this.ref(ruta.split("/").slice(0, -2).join("/")) },
      },
    }
  }
  database = {
    doc: (ruta: string) => this.ref(ruta),
    collection: (ruta: string) => new HistorialPruebaConsulta(this, ruta),
    collectionGroup: (nombre: string) =>
      new HistorialPruebaConsulta(this, nombre),
  } as unknown as Firestore
}

class HistorialPruebaConsulta {
  constructor(
    private almacen: AlmacenHistorial,
    private grupo: string,
    private filtros: Array<[string, string, unknown]> = [],
    private ordenamiento: Array<[string, string]> = [],
    private maximo = Infinity,
    private despues?: [Timestamp, { path: string }],
  ) {}
  where(campo: string, operador: string, valor: unknown) {
    return new HistorialPruebaConsulta(
      this.almacen,
      this.grupo,
      [...this.filtros, [campo, operador, valor]],
      this.ordenamiento,
      this.maximo,
      this.despues,
    )
  }
  orderBy(campo: unknown, direccion: string) {
    return new HistorialPruebaConsulta(
      this.almacen,
      this.grupo,
      this.filtros,
      [
        ...this.ordenamiento,
        [typeof campo === "string" ? campo : "__name__", direccion],
      ],
      this.maximo,
      this.despues,
    )
  }
  limit(maximo: number) {
    return new HistorialPruebaConsulta(
      this.almacen,
      this.grupo,
      this.filtros,
      this.ordenamiento,
      maximo,
      this.despues,
    )
  }
  startAfter(tiempo: Timestamp, referencia: { path: string }) {
    return new HistorialPruebaConsulta(
      this.almacen,
      this.grupo,
      this.filtros,
      this.ordenamiento,
      this.maximo,
      [tiempo, referencia],
    )
  }
  async get() {
    const elementos = [...this.almacen.documents]
      .filter(
        ([ruta, datos]) =>
          (this.grupo.includes("/")
            ? ruta.startsWith(this.grupo + "/") &&
              ruta.split("/").length === this.grupo.split("/").length + 1
            : ruta.split("/").at(-2) === this.grupo) &&
          this.filtros.every(([campo, operador, valor]) => {
            if (datos[campo] === undefined) return false
            if (operador === "in")
              return (valor as unknown[]).includes(datos[campo])
            const orden = comparar(datos[campo], valor)
            return operador === "=="
              ? orden === 0
              : operador === ">="
                ? orden >= 0
                : operador === "<="
                  ? orden <= 0
                  : operador === "<"
                    ? orden < 0
                    : false
          }),
      )
      .sort(([izquierdaRuta, izquierda], [derechaRuta, derecha]) => {
        for (const [campo, direccion] of this.ordenamiento) {
          const diferencia = comparar(
            campo === "__name__" ? izquierdaRuta : izquierda[campo],
            campo === "__name__" ? derechaRuta : derecha[campo],
          )
          if (diferencia) return direccion === "desc" ? -diferencia : diferencia
        }
        return 0
      })
      .filter(
        ([ruta, datos]) =>
          !this.despues ||
          comparar(
            datos[this.ordenamiento[0]?.[0] ?? "completedAt"],
            this.despues[0],
          ) < 0 ||
          (comparar(
            datos[this.ordenamiento[0]?.[0] ?? "completedAt"],
            this.despues[0],
          ) === 0 &&
            ruta.localeCompare(this.despues[1].path) < 0),
      )
      .slice(0, this.maximo)
    return {
      docs: elementos.map(([ruta]) => this.almacen.snapshot(ruta)),
      size: elementos.length,
    }
  }
}
