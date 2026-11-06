import { useEffect, useSyncExternalStore } from "react"
import { conexionServidor } from "../servicios/conexionServidor"

export function AvisoConexionServidor() {
  const estado = useSyncExternalStore(
    conexionServidor.suscribirse,
    conexionServidor.obtenerEstado,
  )

  useEffect(() => {
    void conexionServidor.esperar().catch(() => {
      // El estado compartido muestra el error y ofrece reintentar.
    })
  }, [])

  if (estado !== "demorada" && estado !== "sinConexion") return null

  return (
    <aside
      role="status"
      aria-live="polite"
      className="p-4 text-center text-base space-y-2"
      style={{
        background: "var(--muted)",
        color: "var(--foreground)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <p className="font-bold">
        {estado === "demorada"
          ? "Estamos conectando con MenteClear…"
          : "No pudimos conectar con el servidor."}
      </p>
      <p>
        {estado === "demorada"
          ? "Si estuvo sin uso, el servidor puede necesitar unos momentos para iniciarse. Estamos reintentando la conexión."
          : "Revisá tu conexión a internet y volvé a intentar."}
      </p>
      {estado === "sinConexion" && (
        <button
          type="button"
          className="px-6 py-3 rounded-2xl font-bold"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
          onClick={() => void conexionServidor.esperar().catch(() => {})}
        >
          Reintentar conexión
        </button>
      )}
    </aside>
  )
}
