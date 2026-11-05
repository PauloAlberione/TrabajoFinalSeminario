import { useEffect, useRef, useState } from "react"
import { solicitudCuentaEliminacion } from "../../servicios/eliminacionCuenta"

export function BotonEliminarCuenta({
  uid,
  disabled: deshabilitado,
}: {
  uid: string
  disabled: boolean
}) {
  const [abrir, establecerAbrir] = useState(false),
    [ocupado, establecerOcupado] = useState(false)
  const [contrasena, establecerContrasena] = useState(""),
    [confirmado, establecerConfirmado] = useState(false),
    [error, establecerError] = useState("")
  const dialogo = useRef<HTMLDialogElement>(null),
    activador = useRef<HTMLButtonElement>(null),
    enviando = useRef(false)
  useEffect(() => {
    if (abrir) dialogo.current?.showModal()
    else dialogo.current?.close()
  }, [abrir])
  function cerrar() {
    if (ocupado) return
    dialogo.current?.close()
    establecerAbrir(false)
    establecerContrasena("")
    establecerConfirmado(false)
    establecerError("")
    activador.current?.focus()
  }
  async function eliminar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!confirmado || !contrasena || enviando.current) return
    enviando.current = true
    establecerOcupado(true)
    establecerError("")
    try {
      await solicitudCuentaEliminacion(uid, contrasena)
      establecerContrasena("")
    } catch {
      establecerContrasena("")
      establecerError(
        "No pudimos verificar la contraseña o preparar la eliminación. No se confirmó la baja. Revisá tu contraseña y conexión e intentá nuevamente.",
      )
    } finally {
      enviando.current = false
      establecerOcupado(false)
    }
  }
  return (
    <>
      <button
        ref={activador}
        type="button"
        disabled={deshabilitado}
        onClick={() => establecerAbrir(true)}
        className="w-full flex items-center gap-4 p-4 rounded-2xl text-left disabled:opacity-50"
        style={{ background: "var(--muted)" }}
      >
        <span className="text-xl" aria-hidden="true">
          🗑️
        </span>
        <span className="text-base font-semibold flex-1">
          Eliminar mi cuenta
        </span>
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        onCancel={(evento) => {
          evento.preventDefault()
          cerrar()
        }}
        className="w-[calc(100%-2rem)] max-w-xl rounded-3xl p-6 md:p-8 m-auto backdrop:bg-black/40"
        style={{
          background: "var(--card)",
          color: "var(--foreground)",
          border: "2px solid var(--border)",
        }}
      >
        <form onSubmit={eliminar} className="space-y-5">
          <h2 id="delete-account-title" className="text-2xl font-bold">
            ¿Eliminar tu cuenta permanentemente?
          </h2>
          <p id="delete-account-description" className="text-lg">
            Se eliminarán tu cuenta, perfil, sesiones, resultados, progreso y
            preferencias de MenteClear. Esta acción no se puede deshacer. Los
            recordatorios se detendrán; un correo ya enviado podría llegar.
          </p>
          <p className="text-base">
            La baja no borra archivos que ya descargaste ni garantiza el borrado
            inmediato de backups o registros históricos. Consultá la política de
            privacidad para conocer esos límites.
          </p>
          <label className="flex items-start gap-3 text-lg">
            <input
              type="checkbox"
              required
              disabled={ocupado}
              checked={confirmado}
              onChange={(evento) => establecerConfirmado(evento.target.checked)}
              className="w-6 h-6 mt-1 shrink-0"
            />
            Entiendo que la eliminación es permanente y quiero eliminar mi
            cuenta.
          </label>
          <label
            className="block text-lg font-semibold"
            htmlFor="delete-account-password"
          >
            Confirmá tu contraseña actual
          </label>
          <input
            id="delete-account-password"
            type="password"
            autoComplete="current-password"
            required
            disabled={ocupado}
            value={contrasena}
            onChange={(evento) => establecerContrasena(evento.target.value)}
            className="w-full p-4 rounded-2xl text-lg"
            style={{
              border: "2px solid var(--border)",
              background: "var(--muted)",
            }}
          />
          {error && <p role="alert">{error}</p>}
          {ocupado && (
            <p role="status">
              Verificando tu identidad y preparando la eliminación…
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={ocupado}
              onClick={cerrar}
              className="px-6 py-4 rounded-2xl text-lg font-bold"
              style={{ background: "var(--muted)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={ocupado || !confirmado || !contrasena}
              className="px-6 py-4 rounded-2xl text-lg font-bold disabled:opacity-50"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {ocupado ? "Verificando…" : "Eliminar definitivamente"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
