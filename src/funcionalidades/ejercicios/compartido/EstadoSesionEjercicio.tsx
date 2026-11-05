import { InstruccionesEjercicio } from "./InstruccionesEjercicio"
import { useEffect, useRef } from "react"
import type { EjercicioNavegacion } from "./useNavegacionEjercicio"

export function EstadoSesionEjercicio({
  navigation: navegacion,
  paused: pausado,
  busy: ocupado,
  instrucciones,
}: {
  navigation: EjercicioNavegacion
  paused: boolean
  busy: boolean
  instrucciones?: string
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (pausado && !navegacion.exitOpen) {
      if (!dialogo.current?.open) dialogo.current?.showModal()
    } else dialogo.current?.close()
  }, [pausado, navegacion.exitOpen])
  const control =
    "px-7 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4"
  return (
    <>
      {navegacion.sessionError && (
        <p
          role="alert"
          className="m-6 p-5 rounded-2xl text-lg"
          style={{
            background: "var(--card)",
            border: "2px solid var(--border)",
          }}
        >
          {navegacion.sessionError}
        </p>
      )}
      {navegacion.recoverable && (
        <section
          className="m-6 p-6 rounded-3xl space-y-4"
          style={{
            background: "var(--card)",
            border: "2px solid var(--border)",
          }}
          aria-label="Ejercicio pendiente"
        >
          <h2 className="text-2xl font-bold">Tenés una actividad pendiente</h2>
          <p className="text-xl">
            Podés recuperar el avance guardado o cancelar esta sesión antes de
            comenzar otra.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              className={control}
              disabled={navegacion.recovering || ocupado}
              onClick={navegacion.recover}
            >
              Recuperar ejercicio
            </button>
            <button
              className={control}
              disabled={navegacion.recovering || ocupado}
              onClick={navegacion.cancelRecovery}
            >
              Cancelar sesión pendiente
            </button>
          </div>
        </section>
      )}
      <dialog
        ref={dialogo}
        aria-labelledby="exercise-pause-title"
        aria-describedby="exercise-pause-description"
        className="m-auto max-w-lg w-[calc(100%_-_3rem)] p-8 rounded-3xl backdrop:bg-black/50"
        style={{
          background: "var(--card)",
          color: "var(--foreground)",
          border: "2px solid var(--border)",
        }}
        onCancel={(evento) => {
          evento.preventDefault()
        }}
      >
        <h2 id="exercise-pause-title" className="text-2xl font-bold mb-4">
          Actividad en pausa
        </h2>
        <p id="exercise-pause-description" className="text-xl">
          Conservamos tus respuestas y el paso actual. El tiempo está detenido.
          Continuá cuando estés listo.
        </p>
        {instrucciones && (
          <details className="mt-5 p-4 rounded-2xl border border-border bg-muted">
            <summary className="text-lg font-bold cursor-pointer">
              Recordar cómo se juega
            </summary>
            <div
              className="mt-4"
              role="region"
              aria-label="Instrucciones del ejercicio"
            >
              <InstruccionesEjercicio text={instrucciones} />
            </div>
          </details>
        )}
        {navegacion.sessionError && (
          <p role="alert" className="text-lg mt-4">
            {navegacion.sessionError}
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            autoFocus
            className={control}
            style={{ background: "var(--primary)", color: "white" }}
            disabled={ocupado}
            onClick={navegacion.togglePause}
          >
            Continuar ejercicio
          </button>
          <button
            className={control}
            disabled={ocupado}
            onClick={() => navegacion.requestExit()}
          >
            Salir del ejercicio
          </button>
        </div>
      </dialog>
    </>
  )
}
