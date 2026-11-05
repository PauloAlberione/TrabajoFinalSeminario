export type ExportarJsonValor = null | boolean | number | string | ExportarJsonValor[] | {
  [clave: string]: ExportarJsonValor
}

export interface ExportarDocumento {
  id: string
  data: Record<string, unknown>
}
