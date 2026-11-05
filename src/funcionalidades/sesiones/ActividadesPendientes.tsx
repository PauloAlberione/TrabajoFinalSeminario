import { useEffect, useId, useRef, useState } from "react"
import { api } from "../../servicios/api"
import type { ActividadPendiente } from "../../../compartido/sesionesCanceladas"

export function ActividadesPendientes({
  actividades,
  abierta,
  alRecuperar,
  alCancelar,
}: {
  actividades: ActividadPendiente[]
  abierta: boolean
  alRecuperar: (actividad: ActividadPendiente) => void
  alCancelar: (id: string) => void
}) {
  const [elegida, establecerElegida] = useState<ActividadPendiente | null>(null)
  const [ocupado, establecerOcupado] = useState(false)
  const [error, establecerError] = useState("")
  const [mensaje, establecerMensaje] = useState("")
  const dialogo = useRef<HTMLDialogElement>(null),
    aviso = useRef<HTMLParagraphElement>(null),
    enviando = useRef(false)
  const idBase = useId()
  useEffect(() => {
    if (elegida) dialogo.current?.showModal()
    else dialogo.current?.close()
  }, [elegida])
  async function confirmar() {
    if (!elegida || enviando.current) return
    enviando.current = true
    establecerOcupado(true)
    establecerError("")
    try {
      await api.cancelarSesionPendiente(elegida.id)
      alCancelar(elegida.id)
      establecerMensaje(
        `Cancelaste ${elegida.exerciseName}. El avance guardado está en Progreso → Historial → Canceladas y no cuenta en tus resultados.`,
      )
      establecerElegida(null)
      requestAnimationFrame(() => aviso.current?.focus())
    } catch (fallo) {
      establecerError(
        fallo instanceof Error && fallo.name === "BackendHttpError409"
          ? fallo.message
          : "No pudimos confirmar la cancelación. Intentá nuevamente.",
      )
    } finally {
      enviando.current = false
      establecerOcupado(false)
    }
  }
  if (!actividades.length && !mensaje) return null
  return (
    <div className="aviso-pendientes m-5 md:m-8">
      {mensaje && (
        <p
          role="status"
          ref={aviso}
          tabIndex={-1}
          className="p-5 rounded-3xl border border-border bg-card mb-4"
        >
          {mensaje}
        </p>
      )}
      {actividades.length > 0 && (
        <details
          open={abierta}
          className="p-5 rounded-3xl space-y-4 border-2 border-border bg-card"
        >
          <summary className="text-lg font-bold cursor-pointer">
            Actividades pendientes{" "}
            <span className="contador-pendientes">{actividades.length}</span>
          </summary>
          <p className="text-lg">
            Podés recuperar el avance o cancelar una actividad que no quieras
            continuar.
          </p>
          <ul className="space-y-3">
            {actividades.map((actividad) => (
              <li
                key={actividad.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-muted"
              >
                <div>
                  <p className="font-bold text-lg">{actividad.exerciseName}</p>
                  {actividad.status === "saving" && (
                    <p className="mt-1">
                      Hay un resultado en proceso de guardado. Recuperalo para
                      completar el envío.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={ocupado}
                    className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50"
                    onClick={() => alRecuperar(actividad)}
                  >
                    Recuperar {actividad.exerciseName}
                  </button>
                  <button
                    type="button"
                    disabled={ocupado || actividad.status === "saving"}
                    className="px-5 py-3 rounded-2xl bg-card border border-border font-bold disabled:opacity-50"
                    aria-label={`Cancelar ${actividad.exerciseName}`}
                    onClick={() => {
                      establecerElegida(actividad)
                      establecerError("")
                    }}
                  >
                    Cancelar actividad
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
      <dialog
        ref={dialogo}
        aria-labelledby={`${idBase}-titulo`}
        aria-describedby={`${idBase}-descripcion`}
        className="m-auto w-[calc(100%_-_2rem)] max-w-xl p-6 md:p-8 rounded-3xl border-2 border-border bg-card text-foreground backdrop:bg-black/50"
        onCancel={(evento) => {
          evento.preventDefault()
          if (!ocupado) establecerElegida(null)
        }}
      >
        <h2 id={`${idBase}-titulo`} className="text-2xl font-bold">
          ¿Cancelar esta actividad pendiente?
        </h2>
        <p className="text-xl font-bold mt-4">{elegida?.exerciseName}</p>
        <p id={`${idBase}-descripcion`} className="mt-4">
          Se quitará de pendientes y no se podrá continuar. Conservaremos el
          último avance disponible en el registro de actividades canceladas. No
          se contará como completada ni cambiará tus estadísticas o dificultad.
          Si está abierta en otra pestaña, tampoco podrá seguir enviando
          respuestas.
        </p>
        {error && (
          <p role="alert" className="mt-4">
            {error}
          </p>
        )}
        {ocupado && (
          <p role="status" className="mt-4">
            Cancelando y conservando el avance…
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            autoFocus
            disabled={ocupado}
            onClick={() => establecerElegida(null)}
            className="px-6 py-4 rounded-2xl bg-muted font-bold disabled:opacity-50"
          >
            Conservar pendiente
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void confirmar()}
            className="px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50"
          >
            Sí, cancelar actividad
          </button>
        </div>
      </dialog>
    </div>
  )
}
