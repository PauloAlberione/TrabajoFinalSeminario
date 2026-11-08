import { AlmacenHistorial } from "./historialAlmacen"

export class AlmacenDatosPersonales extends AlmacenHistorial {
  queries: Array<{
    path: string
    limit: number
    after?: string
  }> = []
  constructor() {
    super()
    Object.assign(this.database, {
      collection: (ruta: string) => new PersonalConsulta(this, ruta),
    })
  }
}

class PersonalConsulta {
  constructor(
    private almacen: AlmacenDatosPersonales,
    private ruta: string,
    private maximo = Infinity,
    private despues?: string,
  ) {}
  orderBy() {
    return this
  }
  limit(maximo: number) {
    return new PersonalConsulta(this.almacen, this.ruta, maximo, this.despues)
  }
  startAfter(despues: string) {
    return new PersonalConsulta(this.almacen, this.ruta, this.maximo, despues)
  }
  async get() {
    this.almacen.queries.push({
      path: this.ruta,
      limit: this.maximo,
      after: this.despues,
    })
    const entradas = [...this.almacen.documents]
      .filter(
        ([ruta]) =>
          ruta.split("/").slice(0, -1).join("/") === this.ruta &&
          (!this.despues || ruta.split("/").at(-1)! > this.despues),
      )
      .sort(([izquierda], [derecha]) =>
        izquierda < derecha ? -1 : izquierda > derecha ? 1 : 0,
      )
      .slice(0, this.maximo)
    return {
      size: entradas.length,
      docs: entradas.map(([ruta]) => {
        this.almacen.reads.push(ruta)
        return this.almacen.snapshot(ruta)
      }),
    }
  }
}
