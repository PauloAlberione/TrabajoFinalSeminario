import { useEffect, useRef, useState } from "react"
import { api } from "../../servicios/api"
import {
  completarLocalCuentaEliminacion,
  type PendienteEliminacion,
} from "../../servicios/eliminacionCuenta"

export function RecuperacionEliminacionCuenta({
  pending: pendiente,
  onCompleted: alCompletar,
}: {
  pending: PendienteEliminacion
  onCompleted: (advertencia: string) => void
}) {
  const [ocupado, establecerOcupado] = useState(false),
    [error, establecerError] = useState("")
  const ejecutando = useRef(false),
    completado = useRef(false)
  const alTerminado = useRef(alCompletar)
  alTerminado.current = alCompletar
  async function reintentar() {
    if (ejecutando.current) return
    ejecutando.current = true
    establecerOcupado(true)
    establecerError("")
    try {
      if (!completado.current) {
        const resultado = await api.continuarCuentaEliminacion(pendiente.ticket)
        if (resultado.status !== "completed") {
          establecerError(
            "La eliminación está pendiente. La cuenta queda bloqueada para el uso normal. Reintentá en unos minutos; el servidor conserva la solicitud.",
          )
          return
        }
        completado.current = true
      }
      const advertencia = await completarLocalCuentaEliminacion(pendiente.uid)
      alTerminado.current(advertencia)
    } catch {
      establecerError(
        completado.current
          ? "La cuenta fue eliminada, pero no pudimos completar el cierre local. Reintentá para cerrar la sesión."
          : "No pudimos confirmar que la eliminación haya terminado. Conservamos el comprobante en esta pestaña para reintentar. No borres sus datos mientras la solicitud esté pendiente.",
      )
    } finally {
      ejecutando.current = false
      establecerOcupado(false)
    }
  }
  useEffect(() => {
    void reintentar()
  }, [pendiente.ticket])
  return (
    <main
      className="min-h-screen p-6 md:p-10"
      style={{ background: "var(--background)" }}
    >
      <section
        className="max-w-2xl mx-auto rounded-3xl p-6 space-y-5"
        style={{ background: "var(--card)", border: "2px solid var(--border)" }}
      >
        <h1 className="text-3xl font-bold">Eliminación de cuenta</h1>
        <p className="text-xl">
          Estamos eliminando los datos activos de tu cuenta. Una vez aceptada la
          baja no es posible cancelarla. Solo mostraremos la confirmación cuando
          el servidor termine.
        </p>
        {ocupado && (
          <p role="status">
            Procesando la eliminación… Un historial extenso puede tardar.
          </p>
        )}
        {error && (
          <p role="alert" className="text-lg">
            {error}
          </p>
        )}
        <button
          disabled={ocupado}
          type="button"
          onClick={() => void reintentar()}
          className="px-6 py-4 rounded-2xl text-xl font-bold disabled:opacity-50"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Reintentar eliminación
        </button>
      </section>
    </main>
  )
}
