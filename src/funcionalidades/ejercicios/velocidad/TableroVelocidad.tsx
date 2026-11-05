import {
  velocidadColores,
  type VelocidadEnsayo,
} from "../../../../compartido/velocidad"
import { SimboloVisual } from "../atencionReconocimiento/SimboloVisual"

const respuestaClase =
  "px-2 sm:px-6 py-6 min-h-24 rounded-2xl text-lg sm:text-2xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-cyan-800"

export function TableroVelocidad({
  trial: ensayo,
  phase: fase,
  disabled: deshabilitado,
  onAnswer: alRespuesta,
  onFalseStart: alFalsoIniciar,
}: {
  trial: VelocidadEnsayo
  phase: "waiting" | "arming" | "question"
  disabled: boolean
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
          className="min-w-36 min-h-32 p-5 rounded-3xl text-2xl font-bold focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-cyan-800"
          style={{ background: "#246E38", color: "white" }}
          disabled={deshabilitado || fase !== "question"}
          onClick={() => alRespuesta("react")}
        >
          ¡TOCÁ AHORA!
        </button>
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
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 py-6">
            {ensayo.pair.map((elemento, indice) => (
              <div
                key={indice}
                className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl"
                style={{ background: "var(--muted)" }}
              >
                <SimboloVisual item={elemento} />
              </div>
            ))}
          </div>
        </>
      )}
      {ensayo.kind === "touchColor" && (
        <h2 className="text-3xl font-bold text-center py-6">
          Tocá el color{" "}
          {
            velocidadColores.find(
              (color) => color.id === ensayo.requestedColor,
            )!.name
          }
        </h2>
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
        className={`grid ${
          ensayo.kind === "quickClassification"
            ? "sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2"
        } gap-4`}
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
              disabled={deshabilitado || fase !== "question"}
              style={{
                background: color?.background ?? "#D0EBF4",
                color: color?.foreground ?? "#173F4D",
                border: "2px solid var(--border)",
              }}
              onClick={() => alRespuesta(opcion)}
            >
              {color?.name ?? opcion}
            </button>
          )
        })}
      </div>
    </>
  )
}
