import { AvanceEjercicio } from "../compartido/AvanceEjercicio"
import { MensajeRespuesta } from "../compartido/MensajeRespuesta"
import { audioJuego } from "../../../servicios/audioJuego"
import { useLayoutEffect, useRef, useState } from "react"
import {
  palabraCeldas,
  normalizarRespuesta,
  type CrucigramaCrucigrama,
} from "../../../../compartido/crucigramasLenguaje"
import type { CrucigramaRespuesta } from "../../../../compartido/lenguaje"

export interface CrucigramaInstantanea {
  selectedId: string
  letters: Record<string, string>
  attempts: Record<string, string[]>
  finished: Record<string, "solved" | "revealed">
  feedback: string
}

interface Propiedades {
  initialState?: CrucigramaInstantanea | null
  onStateChange: (estado: CrucigramaInstantanea) => void
  puzzle: CrucigramaCrucigrama
  disabled: boolean
  onComplete: (palabras: CrucigramaRespuesta[]) => void
}

export function TableroCrucigrama({
  puzzle: crucigrama,
  disabled: deshabilitado,
  onComplete: alCompletar,
  initialState: inicialEstado,
  onStateChange: alEstadoCambiar,
}: Propiedades) {
  const [seleccionadoId, establecerSeleccionadoId] = useState(
    inicialEstado?.selectedId ?? crucigrama.words[0].id,
  )
  const [letras, establecerLetras] = useState<Record<string, string>>(
    inicialEstado?.letters ?? {},
  )
  const [intentos, establecerIntentos] = useState<Record<string, string[]>>(
    inicialEstado?.attempts ?? {},
  )
  const [finalizado, establecerFinalizado] =
    useState<Record<string, "solved" | "revealed">>(
      inicialEstado?.finished ?? {},
    )
  const [retroalimentacion, establecerRetroalimentacion] = useState(
    inicialEstado?.feedback ?? "",
  )
  useLayoutEffect(() => {
    alEstadoCambiar({
      selectedId: seleccionadoId,
      letters: letras,
      attempts: intentos,
      finished: finalizado,
      feedback: retroalimentacion,
    })
  }, [
    seleccionadoId,
    letras,
    intentos,
    finalizado,
    retroalimentacion,
    alEstadoCambiar,
  ])
  const entradas = useRef<Record<string, HTMLInputElement | null>>({})
  const seleccionado = crucigrama.words.find(
    (palabra) => palabra.id === seleccionadoId,
  )!
  const seleccionadoCeldas = palabraCeldas(seleccionado)
  const claves = new Set(
    crucigrama.words.flatMap((palabra) =>
      palabraCeldas(palabra).map((celda) => `${celda.row}-${celda.column}`),
    ),
  )
  const bloqueado = new Set(
    crucigrama.words
      .filter((palabra) => finalizado[palabra.id])
      .flatMap((palabra) =>
        palabraCeldas(palabra).map((celda) => `${celda.row}-${celda.column}`),
      ),
  )
  const actualRespuesta = seleccionadoCeldas
    .map((celda) => letras[`${celda.row}-${celda.column}`] ?? "")
    .join("")
  const puedeComprobar =
    seleccionadoCeldas.every(
      (celda) => !!letras[`${celda.row}-${celda.column}`],
    ) &&
    !finalizado[seleccionadoId] &&
    !deshabilitado
  function ingresarLetra(clave: string, valor: string) {
    if (deshabilitado || bloqueado.has(clave)) return
    const letra = normalizarRespuesta(valor)
      .replace(/[^A-Z]/g, "")
      .slice(-1)
    establecerLetras((anterior) => ({ ...anterior, [clave]: letra }))
    if (letra) {
      const indice = seleccionadoCeldas.findIndex(
        (celda) => `${celda.row}-${celda.column}` === clave,
      )
      const siguiente = seleccionadoCeldas
        .slice(indice + 1)
        .find((celda) => !bloqueado.has(`${celda.row}-${celda.column}`))
      if (siguiente)
        entradas.current[`${siguiente.row}-${siguiente.column}`]?.focus()
    }
  }
  function seleccionarPalabra(id: string) {
    if (id !== seleccionadoId) establecerRetroalimentacion("")
    establecerSeleccionadoId(id)
  }

  function comprobarPalabra() {
    if (!puedeComprobar) return
    const palabraIntentos = [
      ...(intentos[seleccionadoId] ?? []),
      actualRespuesta,
    ]
    const correcto =
      normalizarRespuesta(actualRespuesta) ===
      normalizarRespuesta(seleccionado.answer)
    const terminado = correcto || palabraIntentos.length === 3
    const siguienteIntentos = { ...intentos, [seleccionadoId]: palabraIntentos }
    establecerIntentos(siguienteIntentos)
    establecerRetroalimentacion(
      correcto
        ? "¡Palabra resuelta!"
        : terminado
          ? `La palabra es ${seleccionado.answer}. Continuamos con las demás pistas.`
          : `La palabra no coincide. Podés revisar y volver a intentar (${palabraIntentos.length} de 3).`,
    )
    if (!terminado) {
      audioJuego.reproducir("incorrect")
      return
    }
    const siguienteFinalizado = {
      ...finalizado,
      [seleccionadoId]: correcto ? "solved" as const : "revealed" as const,
    }
    establecerFinalizado(siguienteFinalizado)
    if (!correcto)
      establecerLetras((anterior) => ({
        ...anterior,
        ...Object.fromEntries(
          seleccionadoCeldas.map((celda) => [
            `${celda.row}-${celda.column}`,
            celda.letter,
          ]),
        ),
      }))
    if (Object.keys(siguienteFinalizado).length === crucigrama.words.length)
      alCompletar(
        crucigrama.words.map((palabra) => ({
          wordId: palabra.id,
          attempts: siguienteIntentos[palabra.id],
        })),
      )
    audioJuego.reproducir(correcto ? "correct" : "incorrect")
  }
  return (
    <div className="space-y-6">
      <AvanceEjercicio
        completados={Object.keys(finalizado).length}
        total={crucigrama.words.length}
        etiqueta={`Palabras completadas: ${Object.keys(finalizado).length} de ${crucigrama.words.length}`}
      />
      <p className="text-lg">
        Elegí una pista, completá sus casillas y comprobá la palabra. Las letras
        compartidas se conservan.
      </p>
      <div
        className="overflow-x-auto pb-3"
        tabIndex={0}
        role="region"
        aria-label="Cuadrícula del crucigrama"
      >
        <div
          className="grid gap-1 w-fit"
          style={{
            gridTemplateColumns: `repeat(${crucigrama.columns}, 3.25rem)`,
          }}
        >
          {Array.from(
            { length: crucigrama.rows * crucigrama.columns },
            (_, indice) => {
              const fila = Math.floor(indice / crucigrama.columns),
                columna = indice % crucigrama.columns,
                clave = `${fila}-${columna}`
              if (!claves.has(clave))
                return (
                  <div
                    key={clave}
                    aria-hidden="true"
                    className="h-13 rounded"
                    style={{ background: "var(--muted)" }}
                  />
                )
              const iniciar = crucigrama.words.findIndex(
                (palabra) => palabra.row === fila && palabra.column === columna,
              )
              const esSeleccionado = seleccionadoCeldas.some(
                (celda) => celda.row === fila && celda.column === columna,
              )
              return (
                <div key={clave} className="relative">
                  <span className="absolute top-0.5 left-1 text-xs pointer-events-none">
                    {iniciar >= 0 ? iniciar + 1 : ""}
                  </span>
                  <input
                    ref={(elemento) => {
                      entradas.current[clave] = elemento
                    }}
                    data-selected={esSeleccionado}
                    aria-label={`Fila ${fila + 1}, columna ${columna + 1}`}
                    className="w-13 h-13 rounded-lg text-center text-2xl font-bold uppercase focus-visible:outline-4 focus-visible:outline-green-700"
                    style={{
                      background: esSeleccionado ? "#D8EDE3" : "var(--card)",
                      color: "var(--foreground)",
                      border: esSeleccionado
                        ? "2px solid #407453"
                        : "2px solid var(--border)",
                    }}
                    value={letras[clave] ?? ""}
                    disabled={deshabilitado}
                    readOnly={bloqueado.has(clave)}
                    maxLength={2}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    onFocus={() => {
                      if (!esSeleccionado) {
                        const palabra = crucigrama.words.find((palabra) =>
                          palabraCeldas(palabra).some(
                            (celda) =>
                              celda.row === fila && celda.column === columna,
                          ),
                        )
                        if (palabra) seleccionarPalabra(palabra.id)
                      }
                    }}
                    onChange={(evento) =>
                      ingresarLetra(clave, evento.target.value)
                    }
                    onKeyDown={(evento) => {
                      const posicion = seleccionadoCeldas.findIndex(
                        (celda) =>
                          celda.row === fila && celda.column === columna,
                      )
                      const desplazamiento =
                        evento.key === "ArrowLeft" || evento.key === "ArrowUp"
                          ? -1
                          : evento.key === "ArrowRight" ||
                              evento.key === "ArrowDown"
                            ? 1
                            : 0
                      if (desplazamiento) {
                        evento.preventDefault()
                        const siguiente =
                          seleccionadoCeldas[posicion + desplazamiento]
                        if (siguiente)
                          entradas.current[
                            `${siguiente.row}-${siguiente.column}`
                          ]?.focus()
                      }
                      if (evento.key === "Enter") {
                        evento.preventDefault()
                        comprobarPalabra()
                      }
                    }}
                  />
                </div>
              )
            },
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {crucigrama.words.map((palabra, indice) => (
          <button
            key={palabra.id}
            aria-pressed={palabra.id === seleccionadoId}
            disabled={deshabilitado}
            onClick={() => {
              seleccionarPalabra(palabra.id)
              establecerRetroalimentacion("")
            }}
            className="text-left p-4 rounded-2xl text-lg focus-visible:outline-4 focus-visible:outline-green-700"
            style={{
              background:
                palabra.id === seleccionadoId ? "#D8EDE3" : "var(--muted)",
              border:
                palabra.id === seleccionadoId
                  ? "2px solid #407453"
                  : "2px solid transparent",
            }}
          >
            <strong>
              {indice + 1}.{" "}
              {palabra.direction === "across" ? "Horizontal" : "Vertical"}
            </strong>
            <p>
              {palabra.clue} ({normalizarRespuesta(palabra.answer).length}{" "}
              letras)
            </p>
            {finalizado[palabra.id] && (
              <p className="font-bold">
                {finalizado[palabra.id] === "solved"
                  ? "✓ Resuelta"
                  : "Respuesta mostrada"}
                : {palabra.answer}
              </p>
            )}
          </button>
        ))}
      </div>
      <button
        disabled={!puedeComprobar}
        onClick={comprobarPalabra}
        className="px-8 py-4 rounded-2xl text-xl font-bold disabled:opacity-50"
        style={{ background: "#407453", color: "white" }}
      >
        Comprobar palabra {crucigrama.words.indexOf(seleccionado) + 1}
      </button>
      {retroalimentacion && (
        <MensajeRespuesta
          mensaje={retroalimentacion}
          correcto={finalizado[seleccionadoId] === "solved"}
        />
      )}
    </div>
  )
}
