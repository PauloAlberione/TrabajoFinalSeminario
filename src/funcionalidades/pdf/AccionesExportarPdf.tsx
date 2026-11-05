import { useEffect, useRef, useState } from "react"
import type { PdfExportarConsulta } from "../../../compartido/exportacionPdf"
import type { FiltrosHistorial } from "../../../compartido/historial"
import { api } from "../../servicios/api"

const control = "px-6 py-4 rounded-2xl text-lg font-bold disabled:opacity-50"

export function BotonDescargarPdf({
  query: consulta,
  label: etiqueta = "Exportar PDF",
}: {
  query: PdfExportarConsulta
  label?: string
}) {
  const [ocupado, establecerOcupado] = useState(false)
  const [mensaje, establecerMensaje] = useState("")
  const [error, establecerError] = useState("")
  const controlador = useRef<AbortController | null>(null)
  const consultaClave = JSON.stringify(consulta)
  useEffect(() => {
    controlador.current?.abort()
    establecerOcupado(false)
    establecerMensaje("")
    establecerError("")
    return () => controlador.current?.abort()
  }, [consultaClave])
  async function descargar() {
    if (controlador.current && !controlador.current.signal.aborted && ocupado)
      return
    const actual = new AbortController()
    controlador.current = actual
    establecerOcupado(true)
    establecerMensaje("")
    establecerError("")
    try {
      const blob = await api.descargarResultadosPdf(consulta, actual.signal)
      if (actual.signal.aborted) return
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement("a")
      enlace.href = url
      enlace.download = `MenteClear-resultados-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.append(enlace)
      enlace.click()
      enlace.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
      establecerMensaje("PDF listo. La descarga se inició en tu navegador.")
    } catch (fallo) {
      if (!actual.signal.aborted)
        establecerError(
          fallo instanceof Error && fallo.name === "BackendHttpError404"
            ? fallo.message
            : "No pudimos generar o descargar el PDF. Intentá nuevamente.",
        )
    } finally {
      if (!actual.signal.aborted) establecerOcupado(false)
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={control}
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
          disabled={ocupado}
          onClick={descargar}
        >
          {etiqueta}
        </button>
        {ocupado && (
          <button
            type="button"
            className={control}
            onClick={() => {
              controlador.current?.abort()
              establecerOcupado(false)
              establecerMensaje("Exportación cancelada.")
            }}
          >
            Cancelar exportación
          </button>
        )}
      </div>
      {ocupado && (
        <p role="status">Preparando PDF… Un historial extenso puede tardar.</p>
      )}
      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}

export function AccionesExportarPdf({
  filters: filtros = {},
  description: descripcion,
}: {
  filters?: FiltrosHistorial
  description: string
}) {
  const tieneFiltros = Object.values(filtros).some(Boolean)
  return (
    <section
      aria-label="Exportación de resultados PDF"
      className="p-5 rounded-2xl mt-5 space-y-4"
      style={{ background: "var(--muted)" }}
    >
      <p className="text-lg">
        {descripcion} El informe incluye todos los resultados de la selección,
        no solo la página visible.
      </p>
      <BotonDescargarPdf query={{ scope: "history", ...filtros }} />
      {tieneFiltros && (
        <BotonDescargarPdf
          query={{ scope: "history" }}
          label="Exportar todo el historial en PDF"
        />
      )}
    </section>
  )
}
