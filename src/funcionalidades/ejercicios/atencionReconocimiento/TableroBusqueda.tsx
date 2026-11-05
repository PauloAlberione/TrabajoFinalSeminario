import type { BuscarRonda } from "../../../../compartido/atencionReconocimiento"
import { SimboloVisual, describirSimbolo } from "./SimboloVisual"

export function TableroBusqueda({
  round: ronda,
  selected: seleccionado,
  onSelect: alSeleccionar,
  disabled: deshabilitado,
  single: individual,
  reveal: mostrar = false,
}: {
  round: BuscarRonda
  selected: number[]
  onSelect: (indice: number) => void
  disabled: boolean
  single: boolean
  reveal?: boolean
}) {
  return (
    <>
      <div
        className="flex items-center justify-center gap-5 p-5 rounded-2xl"
        style={{ background: "#F5E0DB", color: "#713B30" }}
      >
        <h2 className="text-xl font-bold">
          Buscá {individual ? "esta figura" : "todos los iguales"}:
        </h2>
        <SimboloVisual item={ronda.target} />
      </div>
      <div className="search-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {ronda.items.map((elemento, indice) => (
          <button
            key={indice}
            aria-label={`Elemento ${indice + 1}: ${describirSimbolo(elemento)}`}
            aria-pressed={seleccionado.includes(indice)}
            disabled={
              deshabilitado || (individual && seleccionado.includes(indice))
            }
            onClick={() => alSeleccionar(indice)}
            className="relative flex items-center justify-center min-h-20 p-3 rounded-2xl focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-800"
            style={{
              background: seleccionado.includes(indice)
                ? "#F5E0DB"
                : "var(--muted)",
              border:
                mostrar && ronda.targetIndices.includes(indice)
                  ? "4px solid #407453"
                  : seleccionado.includes(indice)
                    ? "3px solid #8C493A"
                    : "3px solid transparent",
              color: "var(--foreground)",
            }}
          >
            <SimboloVisual item={elemento} />
            {seleccionado.includes(indice) && (
              <span className="absolute top-0 right-1 font-bold">
                {individual && !ronda.targetIndices.includes(indice)
                  ? "×"
                  : "✓"}
              </span>
            )}
            {mostrar && ronda.targetIndices.includes(indice) && (
              <span className="absolute bottom-0 text-sm font-bold">Aquí</span>
            )}
          </button>
        ))}
      </div>
    </>
  )
}
