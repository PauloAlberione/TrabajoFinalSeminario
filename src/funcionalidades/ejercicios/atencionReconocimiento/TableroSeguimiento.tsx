import {
  seguimientoPosicion,
  type SeguimientoRonda,
} from "../../../../compartido/atencionReconocimiento"

export function TableroSeguimiento({
  round: ronda,
  stage: etapa,
  progress: progreso,
  selected: seleccionado,
  onSelect: alSeleccionar,
  disabled: deshabilitado,
}: {
  round: SeguimientoRonda
  stage: "preview" | "movement" | "question"
  progress: number
  selected: string | null
  onSelect: (id: string) => void
  disabled: boolean
}) {
  return (
    <div
      className="relative h-80 rounded-3xl overflow-hidden"
      aria-label="Área de seguimiento"
      style={{ background: "var(--muted)", border: "2px solid var(--border)" }}
    >
      {ronda.objects.map((objeto) => {
        const posicion = seguimientoPosicion(
          objeto,
          etapa === "preview" ? 0 : etapa === "question" ? 1 : progreso,
        )
        const objetivo = etapa === "preview" && objeto.id === ronda.targetId
        return (
          <button
            data-exercise-stimulus="tracking"
            key={objeto.id}
            aria-label={
              objetivo
                ? "Objeto a seguir"
                : etapa === "question"
                  ? `Objeto en posición ${Math.round(posicion.x)}, ${Math.round(posicion.y)}`
                  : "Objeto"
            }
            aria-pressed={
              etapa === "question" ? seleccionado === objeto.id : undefined
            }
            disabled={deshabilitado || etapa !== "question"}
            onClick={() => alSeleccionar(objeto.id)}
            className="absolute flex items-center justify-center w-14 h-14 rounded-full focus-visible:outline-4 focus-visible:outline-red-800"
            style={{
              width: "clamp(44px, 14vw, 3.5rem)",
              height: "clamp(44px, 14vw, 3.5rem)",
              left: `${posicion.x}%`,
              top: `${posicion.y}%`,
              transform: "translate(-50%, -50%)",
              background:
                objetivo || (seleccionado === objeto.id && etapa === "question")
                  ? "#8C493A"
                  : "#333",
              color: "white",
              border: objetivo ? "5px solid white" : "3px solid var(--card)",
              outline: objetivo
                ? "4px solid #8C493A"
                : seleccionado === objeto.id && etapa === "question"
                  ? "4px solid #8C493A"
                  : undefined,
            }}
          >
            {objetivo ? (
              <span className="text-2xl font-bold">★</span>
            ) : etapa === "question" && seleccionado === objeto.id ? (
              <span className="text-xl font-bold">✓</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
