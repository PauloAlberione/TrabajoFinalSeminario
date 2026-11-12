import { MensajeRespuesta } from "../compartido/MensajeRespuesta"
import {
  colores,
  type MemoriaConfiguracion,
  type MemoriaRonda,
  type TipoMemoria,
} from "../../../../compartido/memoria"

interface TableroPropiedades {
  phase: string
  round: MemoriaRonda
  config: MemoriaConfiguracion
  elapsed: number
  selected: string[]
  matched: number[]
  reveal: number[]
  busy: boolean
  chooseCard: (indice: number) => void
  choose: (valor: string) => void
  undo: () => void
  confirm: () => void
}

const controlClase =
  "px-8 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-orange-700"

function ImagenParejasTablero({
  round: ronda,
  config: configuracion,
  matched: emparejado,
  reveal: mostrar,
  busy: ocupado,
  chooseCard: elegirTarjeta,
}: TableroPropiedades) {
  return (
    <div className="space-y-4">
      <div
        data-compact-grid="pairs"
        className={`grid gap-3 ${
          configuracion.size === 10
            ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5"
            : "grid-cols-2 sm:grid-cols-4"
        }`}
      >
        {ronda.options.map((elemento, indice) => {
          const encontrado = emparejado.includes(indice)
          const mostrado = encontrado || mostrar.includes(indice)
          return (
            <button
              key={indice}
              data-estado-tarjeta={
                encontrado
                  ? "encontrada"
                  : mostrar.length === 2 && mostrado
                    ? "revisar"
                    : mostrado
                      ? "visible"
                      : "oculta"
              }
              className="tarjeta-memoria min-h-24 p-3 rounded-2xl text-xl font-bold focus-visible:outline-4 focus-visible:outline-orange-700"
              style={{
                background: mostrado ? "#FAEDDF" : "var(--categoria-memoria)",
                color: mostrado ? "#66300f" : "white",
                border: encontrado
                  ? "3px solid #287445"
                  : "3px solid transparent",
              }}
              disabled={ocupado || encontrado || mostrar.length === 2}
              aria-label={
                mostrado
                  ? `${elemento}${encontrado ? ", pareja encontrada" : ""}`
                  : `Tarjeta ${indice + 1}, oculta`
              }
              onClick={() => elegirTarjeta(indice)}
            >
              {mostrado ? (
                elemento
              ) : (
                <span aria-hidden="true" className="tarjeta-memoria-dorso">
                  ?
                </span>
              )}
              {encontrado && <span aria-hidden="true"> ✓</span>}
            </button>
          )
        })}
      </div>
      {mostrar.length === 2 ? (
        <MensajeRespuesta
          correcto={false}
          mensaje="Estas tarjetas no forman una pareja. Podés seguir probando."
        />
      ) : (
        emparejado.length > 0 && (
          <p role="status" className="p-4 rounded-2xl bg-muted font-semibold">
            ✓ Encontraste {emparejado.length / 2} de {ronda.options.length / 2}{" "}
            parejas.
          </p>
        )
      )}
    </div>
  )
}

function ColorSecuenciaTablero(propiedades: TableroPropiedades) {
  const {
    phase: fase,
    round: ronda,
    config: configuracion,
    elapsed: transcurrido,
  } = propiedades
  if (fase === "response")
    return <RondaOpciones {...propiedades} type="colorSequence" />
  const paso = Math.floor(
    transcurrido / (configuracion.presentationMs + configuracion.gapMs),
  )
  const visible =
    transcurrido % (configuracion.presentationMs + configuracion.gapMs) <
    configuracion.presentationMs
      ? ronda.target[paso]
      : null
  return (
    <>
      <h2 className="text-2xl font-bold text-center">Observá la secuencia</h2>
      <div
        data-exercise-stimulus="color"
        className="h-48 rounded-3xl flex items-center justify-center text-3xl font-bold"
        style={{
          background:
            colores.find((color) => color.label === visible)?.value ??
            "var(--muted)",
          color:
            visible === "Amarillo" || visible === "Naranja"
              ? "#171717"
              : visible
                ? "white"
                : "var(--foreground)",
        }}
      >
        {visible ?? "…"}
      </div>
      <p className="text-lg text-center">Después podrás responder.</p>
    </>
  )
}

function PalabraListaTablero(propiedades: TableroPropiedades) {
  if (propiedades.phase === "response")
    return <RondaOpciones {...propiedades} type="wordList" />
  return (
    <>
      <h2 className="text-2xl font-bold text-center">Memorizá las palabras</h2>
      <PresentadoElementos values={propiedades.round.target} />
      <p className="text-xl font-semibold text-center">
        Tiempo para memorizar:{" "}
        {Math.max(
          0,
          Math.ceil(
            (propiedades.config.presentationMs - propiedades.elapsed) / 1000,
          ),
        )}{" "}
        s
      </p>
      <p className="text-lg text-center">Después podrás responder.</p>
    </>
  )
}

function RecordarOrdenTablero(propiedades: TableroPropiedades) {
  if (propiedades.phase === "response")
    return <RondaOpciones {...propiedades} type="rememberOrder" />
  return (
    <>
      <h2 className="text-2xl font-bold text-center">
        Memorizá el orden de izquierda a derecha
      </h2>
      <PresentadoElementos values={propiedades.round.target} />
      <p className="text-xl font-semibold text-center">
        Tiempo para memorizar:{" "}
        {Math.max(
          0,
          Math.ceil(
            (propiedades.config.presentationMs - propiedades.elapsed) / 1000,
          ),
        )}{" "}
        s
      </p>
      <p className="text-lg text-center">Después podrás responder.</p>
    </>
  )
}

function PresentadoElementos({ values: valores }: { values: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {valores.map((elemento) => (
        <div
          key={elemento}
          className="px-5 py-6 rounded-2xl text-2xl font-bold"
          style={{ background: "var(--muted)" }}
        >
          {elemento}
        </div>
      ))}
    </div>
  )
}

function RondaOpciones({
  type: tipo,
  round: ronda,
  config: configuracion,
  selected: seleccionado,
  busy: ocupado,
  choose: elegir,
  undo: deshacer,
  confirm: confirmar,
}: TableroPropiedades & { type: Exclude<TipoMemoria, "imagePairs"> }) {
  return (
    <>
      <h2 className="text-2xl font-bold">
        {tipo === "wordList"
          ? `Seleccioná las ${configuracion.size} palabras que viste`
          : tipo === "colorSequence"
            ? "Seleccioná los colores en el orden que viste"
            : "Seleccioná los elementos en el orden que viste"}
      </h2>
      <p className="text-lg" aria-live="polite">
        Seleccionados: {seleccionado.length} de {configuracion.size}
      </p>
      {tipo !== "wordList" && (
        <div
          className="flex flex-wrap gap-3 min-h-16"
          aria-label="Tu secuencia"
        >
          {seleccionado.map((elemento, indice) => (
            <span
              key={indice}
              className="p-3 text-xl rounded-xl"
              style={{ background: "var(--muted)" }}
            >
              {indice + 1}. {elemento}
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ronda.options.map((elemento) => (
          <button
            data-exercise-stimulus={
              tipo === "colorSequence" ? "color" : undefined
            }
            key={elemento}
            className="min-h-24 px-4 py-5 text-xl font-bold rounded-2xl focus-visible:outline-4 focus-visible:outline-orange-700 disabled:opacity-60"
            aria-pressed={
              tipo === "wordList" ? seleccionado.includes(elemento) : undefined
            }
            disabled={
              ocupado ||
              (tipo === "rememberOrder" && seleccionado.includes(elemento))
            }
            onClick={() => elegir(elemento)}
            style={{
              background:
                tipo === "colorSequence"
                  ? colores.find((color) => color.label === elemento)?.value
                  : seleccionado.includes(elemento)
                    ? "#FAEDDF"
                    : "var(--muted)",
              color:
                tipo === "colorSequence" &&
                elemento !== "Amarillo" &&
                elemento !== "Naranja"
                  ? "white"
                  : "var(--foreground)",
              border:
                seleccionado.includes(elemento) && tipo === "wordList"
                  ? "3px solid var(--categoria-memoria)"
                  : "3px solid transparent",
            }}
          >
            {elemento}
            {tipo === "wordList" && seleccionado.includes(elemento) ? " ✓" : ""}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {tipo !== "wordList" && (
          <button
            className={controlClase}
            style={{
              background: "var(--card)",
              border: "2px solid var(--border)",
            }}
            disabled={!seleccionado.length || ocupado}
            onClick={deshacer}
          >
            Deshacer última selección
          </button>
        )}
        <button
          className={controlClase}
          style={{ background: "var(--categoria-memoria)", color: "white" }}
          disabled={seleccionado.length !== configuracion.size || ocupado}
          onClick={confirmar}
        >
          Confirmar
        </button>
      </div>
    </>
  )
}

const tableros = {
  imagePairs: ImagenParejasTablero,
  colorSequence: ColorSecuenciaTablero,
  wordList: PalabraListaTablero,
  rememberOrder: RecordarOrdenTablero,
}

export function TableroMemoria({
  type: tipo,
  ...propiedades
}: TableroPropiedades & { type: TipoMemoria }) {
  const Tablero = tableros[tipo]
  return <Tablero {...propiedades} />
}
