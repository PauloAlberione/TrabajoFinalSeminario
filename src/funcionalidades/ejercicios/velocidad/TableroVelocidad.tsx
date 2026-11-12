import {
  coloresSolicitados,
  velocidadColores,
  type VelocidadEnsayo,
} from "../../../../compartido/velocidad"
import { SimboloVisual } from "../atencionReconocimiento/SimboloVisual"

const respuestaClase =
  "px-2 sm:px-4 py-4 min-h-20 rounded-2xl text-lg sm:text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-cyan-800"

export function TableroVelocidad({
  trial: ensayo,
  phase: fase,
  disabled: deshabilitado,
  selectedColors: seleccionColores = [],
  onAnswer: alResponder,
  onFalseStart: alFalsoIniciar,
}: {
  trial: VelocidadEnsayo
  phase: "waiting" | "arming" | "question"
  disabled: boolean
  selectedColors?: string[]
  onAnswer: (respuesta: string) => void
  onFalseStart: () => void
}) {
  if (ensayo.kind === "visualReaction") {
    if (fase === "waiting")
      return (
        <button
          className="w-full min-h-64 p-8 rounded-3xl text-2xl font-bold focus-visible:outline-4 focus-visible:outline-cyan-800"
          style={{ background: "var(--muted)" }}
          disabled={deshabilitado}
          onClick={alFalsoIniciar}
        >
          Esperá a que aparezca la señal.
          <span className="block mt-4 text-lg font-normal">
            No toques todavía.
          </span>
        </button>
      )
    // Las sesiones anteriores conservan su única señal y la posición original.
    if (ensayo.options.length === 1)
      return (
        <div
          className={`flex min-h-64 items-center p-4 rounded-3xl ${
            ensayo.position === "left"
              ? "justify-start"
              : ensayo.position === "right"
                ? "justify-end"
                : "justify-center"
          }`}
          style={{ background: "var(--muted)" }}
        >
          <button
            className="min-w-36 min-h-32 p-5 rounded-3xl text-2xl font-bold"
            style={{ background: "#246E38", color: "white" }}
            disabled={deshabilitado || fase !== "question"}
            onClick={() => alResponder("react")}
          >
            ¡TOCÁ AHORA!
          </button>
        </div>
      )
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">
          Tocá solo la señal que dice ¡TOCÁ AHORA!
        </h2>
        <div data-compact-grid="reaccion" className="grid grid-cols-2 gap-3">
          {ensayo.options.map((opcion) => (
            <button
              key={opcion}
              className={respuestaClase}
              disabled={deshabilitado || fase !== "question"}
              style={{
                background: opcion === "react" ? "#246E38" : "var(--muted)",
                color: opcion === "react" ? "white" : "var(--foreground)",
                border: "2px solid var(--border)",
              }}
              onClick={() => alResponder(opcion)}
            >
              {opcion === "react" ? "¡TOCÁ AHORA!" : "NO TOCAR"}
            </button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <>
      {ensayo.kind === "quickResponse" && (
        <>
          <h2 className="text-2xl font-bold text-center">
            ¿Son iguales o diferentes?
          </h2>
          <p className="text-lg text-center">
            Compará las figuras en la misma posición de ambos grupos.
          </p>
          <div
            data-compact-grid="comparacion"
            className="grid grid-cols-2 gap-4 py-4"
          >
            {[0, 1].map((grupo) => (
              <div
                key={grupo}
                className="rounded-2xl p-3 space-y-3"
                style={{ background: "var(--muted)" }}
              >
                <p className="font-bold text-center">Grupo {grupo + 1}</p>
                <div className="flex flex-wrap justify-center items-center gap-3">
                  {(ensayo.comparisonPairs ?? [ensayo.pair]).map(
                    (pareja, indice) => (
                      <div
                        key={indice}
                        className="flex flex-col items-center gap-2"
                      >
                        <span className="text-base">{indice + 1}</span>
                        <SimboloVisual item={pareja[grupo]} />
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {ensayo.kind === "touchColor" && (
        <div className="text-center space-y-4 py-3">
          <h2 className="text-2xl font-bold">
            {coloresSolicitados(ensayo).length > 1
              ? "Tocá estos colores en orden"
              : "Tocá el color solicitado"}
          </h2>
          <ol
            className="flex flex-wrap justify-center gap-3"
            aria-label="Colores solicitados"
          >
            {coloresSolicitados(ensayo).map((id, indice) => (
              <li
                key={id}
                className="p-3 rounded-xl bg-muted text-xl font-bold"
              >
                {indice + 1}.{" "}
                {velocidadColores.find((color) => color.id === id)!.name}
              </li>
            ))}
          </ol>
          {coloresSolicitados(ensayo).length > 1 && (
            <p className="text-lg" role="status">
              Seleccionados: {seleccionColores.length} de{" "}
              {coloresSolicitados(ensayo).length}.
              {seleccionColores.length > 0 &&
                ` Elegiste ${velocidadColores.find((color) => color.id === seleccionColores[0])?.name}. Ahora elegí el segundo color.`}
            </p>
          )}
        </div>
      )}
      {ensayo.kind === "quickClassification" && (
        <>
          <h2 className="text-xl font-semibold text-center">
            ¿A qué categoría pertenece?
          </h2>
          <p className="text-4xl font-bold text-center py-8">{ensayo.label}</p>
        </>
      )}
      <div
        data-compact-grid="velocidad"
        className={`grid grid-cols-2 ${
          ensayo.kind === "touchColor" ? "sm:grid-cols-4" : ""
        } gap-3`}
      >
        {ensayo.options.map((opcion) => {
          const color =
            ensayo.kind === "touchColor"
              ? velocidadColores.find((color) => color.id === opcion)
              : null
          return (
            <button
              data-exercise-stimulus={color ? "color" : undefined}
              key={opcion}
              className={respuestaClase}
              disabled={
                deshabilitado ||
                fase !== "question" ||
                (ensayo.kind === "touchColor" &&
                  seleccionColores.includes(opcion))
              }
              style={{
                background: color?.background ?? "#D0EBF4",
                color: color?.foreground ?? "#173F4D",
                border: "2px solid var(--border)",
              }}
              onClick={() => alResponder(opcion)}
            >
              {color?.name ?? opcion}
              {ensayo.kind === "touchColor" &&
                seleccionColores.includes(opcion) && (
                  <span aria-hidden="true"> ✓</span>
                )}
            </button>
          )
        })}
      </div>
    </>
  )
}
