import type { RefObject } from "react"

export function DialogoSalidaEjercicio({
  dialogRef: dialogoReferencia,
  error,
  busy: ocupado,
  onContinue: alContinuar,
  onExit: alSalir,
  exitLabel: salirEtiqueta = "Salir del ejercicio",
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  error: string
  busy: boolean
  onContinue: () => void
  onExit: () => void
  exitLabel?: string
}) {
  const controles =
    "px-7 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4"
  return (
    <dialog
      ref={dialogoReferencia}
      aria-labelledby="exercise-exit-title"
      aria-describedby="exercise-exit-description"
      className="m-auto max-w-lg w-[calc(100%_-_3rem)] p-8 rounded-3xl backdrop:bg-black/50"
      style={{
        background: "var(--card)",
        color: "var(--foreground)",
        border: "2px solid var(--border)",
      }}
      onCancel={(evento) => {
        evento.preventDefault()
        if (!ocupado) alContinuar()
      }}
    >
      <h2 id="exercise-exit-title" className="text-2xl font-bold mb-4">
        ¿Querés salir del ejercicio?
      </h2>
      <p id="exercise-exit-description" className="text-xl leading-relaxed">
        Si salís ahora, la sesión se cancelará y no se guardará como un
        ejercicio completado. El avance disponible quedará en el registro de
        actividades canceladas. El tiempo está pausado mientras decidís.
      </p>
      {error && (
        <p role="alert" className="text-lg mt-5">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-4 mt-7">
        <button
          autoFocus
          className={controles}
          style={{ background: "var(--primary)", color: "white" }}
          disabled={ocupado}
          onClick={alContinuar}
        >
          Continuar ejercicio
        </button>
        <button
          className={controles}
          style={{
            background: "var(--card)",
            border: "2px solid var(--border)",
          }}
          disabled={ocupado}
          onClick={alSalir}
        >
          {salirEtiqueta}
        </button>
      </div>
    </dialog>
  )
}
