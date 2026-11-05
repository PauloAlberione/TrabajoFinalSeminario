import {
  visualClave,
  type PatronRonda,
} from "../../../../compartido/atencionReconocimiento"
import { SimboloVisual, describirSimbolo } from "./SimboloVisual"

export function TableroPatrones({
  round: ronda,
  selected: seleccionado,
  onSelect: alSeleccionar,
  disabled: deshabilitado,
}: {
  round: PatronRonda
  selected: string | null
  onSelect: (clave: string) => void
  disabled: boolean
}) {
  return (
    <>
      <h2 className="text-2xl font-bold">¿Qué figura falta?</h2>
      <ol
        aria-label="Patrón visual"
        className="flex flex-wrap justify-center gap-3 py-4"
      >
        {ronda.sequence.map((elemento, indice) => (
          <li
            key={indice}
            className="flex items-center justify-center min-w-16 min-h-20 p-2 rounded-2xl"
            style={{ background: "var(--muted)" }}
          >
            {indice === ronda.missingIndex ? (
              <span
                aria-label="Figura que falta"
                className="text-4xl font-bold"
              >
                ?
              </span>
            ) : (
              <SimboloVisual item={elemento} />
            )}
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ronda.options.map((elemento, indice) => (
          <button
            key={visualClave(elemento)}
            aria-label={`Opción ${indice + 1}: ${describirSimbolo(elemento)}`}
            aria-pressed={seleccionado === visualClave(elemento)}
            disabled={deshabilitado}
            onClick={() => alSeleccionar(visualClave(elemento))}
            className="flex items-center justify-center gap-3 p-5 min-h-24 rounded-2xl focus-visible:outline-4 focus-visible:outline-red-800"
            style={{
              background:
                seleccionado === visualClave(elemento)
                  ? "#F5E0DB"
                  : "var(--muted)",
              border:
                seleccionado === visualClave(elemento)
                  ? "3px solid #8C493A"
                  : "3px solid transparent",
            }}
          >
            <SimboloVisual item={elemento} />
            {seleccionado === visualClave(elemento) && (
              <span className="text-xl">✓</span>
            )}
          </button>
        ))}
      </div>
    </>
  )
}
