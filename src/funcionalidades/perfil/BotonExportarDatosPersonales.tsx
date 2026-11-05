import { useEffect, useRef, useState } from "react"
import { api } from "../../servicios/api"

export function BotonExportarDatosPersonales() {
  const [ocupado, establecerOcupado] = useState(false)
  const [mensaje, establecerMensaje] = useState("")
  const [error, establecerError] = useState("")
  const solicitar = useRef<AbortController | null>(null)
  useEffect(() => () => solicitar.current?.abort(), [])
  async function descargar() {
    if (solicitar.current && !solicitar.current.signal.aborted) return
    const controlador = new AbortController()
    solicitar.current = controlador
    establecerOcupado(true)
    establecerMensaje("")
    establecerError("")
    try {
      const blob = await api.descargarPersonalDatos(controlador.signal)
      if (controlador.signal.aborted) return
      const url = URL.createObjectURL(blob),
        enlace = document.createElement("a")
      enlace.href = url
      enlace.download = `MenteClear-mis-datos-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(enlace)
      enlace.click()
      enlace.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
      establecerMensaje(
        "Copia JSON lista. La descarga se inició en tu navegador.",
      )
    } catch {
      if (!controlador.signal.aborted)
        establecerError("No pudimos descargar tus datos. Intentá nuevamente.")
    } finally {
      if (!controlador.signal.aborted) {
        solicitar.current = null
        establecerOcupado(false)
      }
    }
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={ocupado}
        onClick={descargar}
        className="w-full flex items-center gap-4 p-4 rounded-2xl text-left disabled:opacity-50"
        style={{ background: "var(--muted)" }}
      >
        <span aria-hidden="true" className="text-xl">
          📤
        </span>
        <span className="text-base font-semibold flex-1">
          Exportar mis datos
        </span>
        <span aria-hidden="true">↓</span>
      </button>
      <p className="text-sm">
        Descargá tu perfil, preferencias, progreso y todas tus sesiones con sus
        resultados en JSON.
      </p>
      {ocupado && (
        <>
          <p role="status">
            Preparando la copia de tus datos… Un historial extenso puede tardar.
          </p>
          <button
            type="button"
            className="px-5 py-3 rounded-xl text-lg font-bold"
            onClick={() => {
              solicitar.current?.abort()
              establecerOcupado(false)
              establecerMensaje("Exportación cancelada.")
            }}
          >
            Cancelar exportación de datos
          </button>
        </>
      )}
      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
