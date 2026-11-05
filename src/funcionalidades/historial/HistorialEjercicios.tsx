import {
  AccionesExportarPdf,
  BotonDescargarPdf,
} from "../pdf/AccionesExportarPdf"
import { useEffect, useRef, useState } from "react"
import {
  obtenerEjercicioHistorial,
  obtenerEjercicioHistorialDetalle,
} from "../../servicios/historial"
import { etiquetasCategorias, ejerciciosHistorial } from "./catalogo"
import { MetricasResultado } from "./MetricasResultado"
import { etiquetaDificultad } from "../../tipos/ejercicios"
import { CATEGORIA_IDS } from "../../../compartido/resultados"
import type {
  FiltrosHistorial,
  PaginaHistorial,
  ElementoHistorial,
} from "../../../compartido/historial"

const control =
  "px-6 py-4 rounded-2xl text-lg font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4"
const tarjeta = {
  background: "var(--card)",
  border: "1.5px solid var(--border)",
}
const numero = (valor: unknown, sufijo = "") =>
  typeof valor === "number" && Number.isFinite(valor)
    ? `${Number(valor.toFixed(3)).toLocaleString("es-AR")}${sufijo}`
    : "Sin dato"

function categoria(elemento: ElementoHistorial) {
  return elemento.cognitiveFunctionId
    ? (etiquetasCategorias[elemento.cognitiveFunctionId] ??
        elemento.cognitiveFunctionId)
    : "Categoría no registrada"
}

function nombre(elemento: ElementoHistorial) {
  return (
    elemento.exerciseName ??
    ejerciciosHistorial.find(
      (ejercicio) => ejercicio.type === elemento.exerciseType,
    )?.name ??
    elemento.exerciseId ??
    "Nombre no registrado"
  )
}

function fecha(elemento: ElementoHistorial) {
  return new Date(elemento.completedAt).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

interface Borrador {
  category: string
  exercise: string
  difficulty: string
  from: string
  to: string
}

const vacioBorrador: Borrador = {
  category: "",
  exercise: "",
  difficulty: "",
  from: "",
  to: "",
}

function Detalle({
  item: elemento,
  onClose: alCerrar,
}: {
  item: ElementoHistorial
  onClose: () => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null),
    [detalle, establecerDetalle] = useState<ElementoHistorial | null>(null),
    [error, establecerError] = useState(""),
    [intento, establecerIntento] = useState(0)
  useEffect(() => {
    dialogo.current?.showModal()
    return () => dialogo.current?.close()
  }, [])
  useEffect(() => {
    const controlador = new AbortController()
    establecerDetalle(null)
    establecerError("")
    void obtenerEjercicioHistorialDetalle(
      elemento.sessionId,
      elemento.resultId,
      controlador.signal,
    )
      .then((resultado) => {
        if (!controlador.signal.aborted) establecerDetalle(resultado)
      })
      .catch(() => {
        if (!controlador.signal.aborted)
          establecerError("No pudimos cargar el detalle. Intentá nuevamente.")
      })
    return () => controlador.abort()
  }, [elemento.sessionId, elemento.resultId, intento])
  return (
    <dialog
      ref={dialogo}
      aria-labelledby="history-detail-title"
      className="m-auto w-[calc(100%_-_2rem)] max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl backdrop:bg-black/50"
      style={tarjeta}
      onCancel={alCerrar}
    >
      <div className="flex justify-between items-start gap-4 mb-6">
        <div>
          <h2
            id="history-detail-title"
            className="text-3xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {nombre(elemento)}
          </h2>
          <p className="text-lg mt-2">
            {categoria(elemento)} · {fecha(elemento)}
            {elemento.completionDateSource === "createdAt"
              ? " · Fecha de registro original"
              : ""}
          </p>
        </div>
        <button
          autoFocus
          className={control}
          aria-label="Cerrar detalle"
          onClick={alCerrar}
        >
          Cerrar
        </button>
      </div>
      {!detalle && !error && (
        <p role="status" className="text-xl py-8">
          Cargando detalle…
        </p>
      )}
      {error && (
        <div role="alert">
          <p className="text-xl">{error}</p>
          <button
            className={control}
            onClick={() => establecerIntento((valor) => valor + 1)}
          >
            Reintentar detalle
          </button>
        </div>
      )}
      {detalle && (
        <>
          <BotonDescargarPdf
            query={{
              scope: "single",
              sessionId: elemento.sessionId,
              resultId: elemento.resultId,
            }}
            label="Exportar PDF de este ejercicio"
          />
          <dl className="grid sm:grid-cols-2 gap-4 mb-7">
            {[
              [
                "Dificultad",
                detalle.difficultyBefore
                  ? etiquetaDificultad[detalle.difficultyBefore]
                  : "Sin dato",
              ],
              ["Aciertos", numero(detalle.correctAnswers)],
              ["Errores", numero(detalle.errors)],
              ["Precisión", numero(detalle.accuracy, " %")],
              ["Duración activa", numero(detalle.actualTimeSeconds, " s")],
              [
                "Tiempo activo de respuesta",
                numero(detalle.actualResponseTimeSeconds, " s"),
              ],
              ...(detalle.totalQuestions !== undefined
                ? [["Unidades evaluadas", numero(detalle.totalQuestions)]]
                : []),
              ...(detalle.performanceScore !== undefined
                ? [
                    [
                      "Puntuación del ejercicio (sobre 100)",
                      numero(detalle.performanceScore),
                    ],
                  ]
                : []),
              ...(detalle.timeEfficiency !== undefined
                ? [
                    [
                      "Eficiencia temporal",
                      numero(detalle.timeEfficiency, " %"),
                    ],
                  ]
                : []),
            ].map(([etiqueta, valor]) => (
              <div
                key={etiqueta}
                className="p-4 rounded-2xl"
                style={{ background: "var(--muted)" }}
              >
                <dt className="text-lg">{etiqueta}</dt>
                <dd className="text-2xl font-bold">{valor}</dd>
              </div>
            ))}
          </dl>
          <MetricasResultado details={detalle.details} />
          {!detalle.details && (
            <dl className="mt-5 space-y-2">
              {([
                "attempts",
                "timeouts",
                "falseStarts",
                "averageResponseTimeMs",
              ] as const)
                .filter((clave) => detalle[clave] !== undefined)
                .map((clave) => (
                  <div key={clave}>
                    <dt>
                      {
                        {
                          attempts: "Intentos",
                          timeouts: "Sin respuesta",
                          falseStarts: "Salidas anticipadas",
                          averageResponseTimeMs: "Tiempo medio de respuesta",
                        }[clave]
                      }
                    </dt>
                    <dd>
                      {detalle[clave] === null
                        ? "Sin medición válida"
                        : numero(
                            detalle[clave],
                            clave === "averageResponseTimeMs" ? " ms" : "",
                          )}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
          <p className="text-base mt-6">
            Las métricas corresponden a este ejercicio. Los intentos y las
            unidades de respuesta pueden variar entre actividades.
          </p>
        </>
      )}
    </dialog>
  )
}

export function HistorialEjercicios() {
  const [borrador, establecerBorrador] = useState<Borrador>(vacioBorrador),
    [filtros, establecerFiltros] = useState<FiltrosHistorial>({}),
    [validacion, establecerValidacion] = useState("")
  const [indice, establecerIndice] = useState(0),
    [cursores, establecerCursores] = useState<string[]>([""]),
    [pagina, establecerPagina] = useState<PaginaHistorial | null>(null)
  const [cargando, establecerCargando] = useState(true),
    [error, establecerError] = useState(""),
    [intento, establecerIntento] = useState(0),
    [seleccionado, establecerSeleccionado] = useState<ElementoHistorial | null>(
      null,
    )
  const primeroPagina = useRef<PaginaHistorial | null>(null),
    titulo = useRef<HTMLHeadingElement>(null),
    cargadoClave = useRef("")
  const consultaClave = JSON.stringify([
    filtros,
    indice,
    cursores[indice] ?? "",
    intento,
  ])
  const esCargando = cargando || cargadoClave.current !== consultaClave
  useEffect(() => {
    const controlador = new AbortController()
    establecerCargando(true)
    establecerError("")
    establecerPagina(null)
    if (indice === 0 && primeroPagina.current) {
      cargadoClave.current = consultaClave
      establecerPagina(primeroPagina.current)
      establecerCargando(false)
      return () => controlador.abort()
    }
    void obtenerEjercicioHistorial(
      { ...filtros, limit: 20, cursor: cursores[indice] || undefined },
      controlador.signal,
    )
      .then((resultado) => {
        if (controlador.signal.aborted) return
        if (indice === 0) primeroPagina.current = resultado
        cargadoClave.current = consultaClave
        establecerPagina(resultado)
      })
      .catch(() => {
        if (!controlador.signal.aborted) {
          cargadoClave.current = consultaClave
          establecerError("No pudimos cargar tu historial. Intentá nuevamente.")
        }
      })
      .finally(() => {
        if (!controlador.signal.aborted) establecerCargando(false)
      })
    return () => controlador.abort()
  }, [filtros, indice, cursores, intento])
  function aplicar(restablecer = false) {
    const siguiente = restablecer ? vacioBorrador : borrador
    establecerValidacion("")
    if (siguiente.from && siguiente.to && siguiente.from > siguiente.to) {
      establecerValidacion(
        "La fecha inicial no puede ser posterior a la final.",
      )
      return
    }
    const rango: FiltrosHistorial = {}
    if (siguiente.from)
      rango.from = new Date(`${siguiente.from}T00:00:00`).toISOString()
    if (siguiente.to) {
      const fin = new Date(`${siguiente.to}T00:00:00`)
      fin.setDate(fin.getDate() + 1)
      rango.to = fin.toISOString()
    }
    primeroPagina.current = null
    establecerCursores([""])
    establecerIndice(0)
    establecerSeleccionado(null)
    establecerFiltros({
      ...rango,
      ...(siguiente.category
        ? { category: siguiente.category as FiltrosHistorial["category"] }
        : {}),
      ...(siguiente.exercise ? { exercise: siguiente.exercise } : {}),
      ...(siguiente.difficulty
        ? { difficulty: siguiente.difficulty as FiltrosHistorial["difficulty"] }
        : {}),
    })
    if (restablecer) establecerBorrador(vacioBorrador)
  }
  function navegar(siguiente: number) {
    if (siguiente > indice && pagina?.nextCursor)
      establecerCursores((anterior) => [
        ...anterior.slice(0, indice + 1),
        pagina.nextCursor!,
      ])
    establecerIndice(siguiente)
    titulo.current?.focus()
  }
  return (
    <section
      aria-labelledby="exercise-history-title"
      className="rounded-3xl overflow-hidden mt-8"
      style={tarjeta}
    >
      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap justify-between gap-4 items-center">
          <h2
            ref={titulo}
            tabIndex={-1}
            id="exercise-history-title"
            className="text-2xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Historial de sesiones
          </h2>
          <button
            className={control}
            disabled={esCargando}
            onClick={() => {
              primeroPagina.current = null
              establecerIndice(0)
              establecerCursores([""])
              establecerIntento((valor) => valor + 1)
            }}
          >
            Actualizar historial
          </button>
        </div>
        <p className="text-lg mt-2">
          Tus ejercicios completados, del más reciente al más antiguo. La
          duración cuenta solo el tiempo activo registrado.
        </p>
        <form
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
          onSubmit={(evento) => {
            evento.preventDefault()
            aplicar()
          }}
        >
          <label className="text-lg font-semibold">
            Categoría
            <select
              className="block w-full p-3 mt-2 rounded-xl"
              style={tarjeta}
              aria-label="Categoría"
              value={borrador.category}
              onChange={(evento) =>
                establecerBorrador((anterior) => ({
                  ...anterior,
                  category: evento.target.value,
                  exercise: "",
                }))
              }
            >
              <option value="">Todas las categorías</option>
              {CATEGORIA_IDS.map((id) => (
                <option key={id} value={id}>
                  {etiquetasCategorias[id]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-lg font-semibold">
            Ejercicio
            <select
              className="block w-full p-3 mt-2 rounded-xl"
              style={tarjeta}
              aria-label="Ejercicio"
              value={borrador.exercise}
              onChange={(evento) =>
                establecerBorrador((anterior) => ({
                  ...anterior,
                  exercise: evento.target.value,
                }))
              }
            >
              <option value="">Todos los ejercicios</option>
              {ejerciciosHistorial
                .filter(
                  (elemento) =>
                    !borrador.category ||
                    elemento.category === borrador.category,
                )
                .map((elemento) => (
                  <option key={elemento.type} value={elemento.type}>
                    {elemento.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-lg font-semibold">
            Dificultad
            <select
              className="block w-full p-3 mt-2 rounded-xl"
              style={tarjeta}
              aria-label="Dificultad"
              value={borrador.difficulty}
              onChange={(evento) =>
                establecerBorrador((anterior) => ({
                  ...anterior,
                  difficulty: evento.target.value,
                }))
              }
            >
              <option value="">Todos los niveles</option>
              {Object.entries(etiquetaDificultad).map(([id, etiqueta]) => (
                <option key={id} value={id}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </label>
          <label className="text-lg font-semibold">
            Desde
            <input
              type="date"
              className="block w-full p-3 mt-2 rounded-xl"
              style={tarjeta}
              aria-label="Desde"
              value={borrador.from}
              onChange={(evento) =>
                establecerBorrador((anterior) => ({
                  ...anterior,
                  from: evento.target.value,
                }))
              }
            />
          </label>
          <label className="text-lg font-semibold">
            Hasta
            <input
              type="date"
              className="block w-full p-3 mt-2 rounded-xl"
              style={tarjeta}
              aria-label="Hasta"
              value={borrador.to}
              onChange={(evento) =>
                establecerBorrador((anterior) => ({
                  ...anterior,
                  to: evento.target.value,
                }))
              }
            />
          </label>
          <div className="flex flex-wrap gap-3 items-end">
            <button
              type="submit"
              className={control}
              style={{ background: "var(--primary)", color: "white" }}
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              className={control}
              onClick={() => aplicar(true)}
            >
              Limpiar filtros
            </button>
          </div>
        </form>
        <AccionesExportarPdf
          filters={filtros}
          description={
            Object.keys(filtros).length
              ? "Se exportarán los filtros aplicados de categoría, ejercicio, dificultad y fechas."
              : "Se exportará todo el historial disponible. Para elegir fechas, aplicá los filtros de arriba."
          }
        />
        {validacion && (
          <p role="alert" className="text-lg mt-4">
            {validacion}
          </p>
        )}
      </div>
      {esCargando && (
        <p role="status" className="p-7 text-xl">
          Cargando historial…
        </p>
      )}
      {error && (
        <div role="alert" className="p-7 text-xl">
          <p>{error}</p>
          <button
            className={control}
            onClick={() => establecerIntento((valor) => valor + 1)}
          >
            Reintentar historial
          </button>
        </div>
      )}
      {!esCargando && !error && pagina && (
        <>
          {pagina.items.length === 0 && (
            <p role="status" className="p-7 text-xl">
              {pagina.hasMore
                ? "Todavía no encontramos resultados en este bloque. Seleccioná Siguiente para continuar la búsqueda."
                : Object.keys(filtros).length
                  ? "No hay resultados para los filtros seleccionados."
                  : "Todavía no completaste ejercicios. Tus resultados aparecerán acá después de finalizar una actividad."}
            </p>
          )}
          {pagina.items.length > 0 && (
            <div
              role="region"
              aria-label="Tabla del historial"
              tabIndex={0}
              className="overflow-x-auto"
            >
              <table className="w-full text-left text-base">
                <caption className="sr-only">
                  Resultados de ejercicios completados
                </caption>
                <thead style={{ background: "var(--muted)" }}>
                  <tr>
                    {[
                      "Finalización",
                      "Ejercicio",
                      "Categoría",
                      "Dificultad",
                      "Aciertos",
                      "Errores",
                      "Precisión",
                      "Duración activa",
                      "Detalle",
                    ].map((etiqueta) => (
                      <th
                        scope="col"
                        key={etiqueta}
                        className="px-5 py-4 whitespace-nowrap"
                      >
                        {etiqueta}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagina.items.map((elemento) => (
                    <tr
                      key={elemento.id}
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <time dateTime={elemento.completedAt}>
                          {fecha(elemento)}
                        </time>
                        {elemento.completionDateSource === "createdAt" && (
                          <p className="mt-1">Fecha de registro original</p>
                        )}
                      </td>
                      <th scope="row" className="px-5 py-4 min-w-48">
                        {nombre(elemento)}
                        {elemento.averageResponseTimeMs !== undefined && (
                          <p className="font-normal mt-2">
                            Tiempo medio:{" "}
                            {elemento.averageResponseTimeMs === null
                              ? "Sin medición válida"
                              : numero(elemento.averageResponseTimeMs, " ms")}
                          </p>
                        )}
                        {elemento.attempts !== undefined && (
                          <p className="font-normal">
                            Intentos: {numero(elemento.attempts)}
                          </p>
                        )}
                      </th>
                      <td className="px-5 py-4">{categoria(elemento)}</td>
                      <td className="px-5 py-4">
                        {elemento.difficultyBefore
                          ? etiquetaDificultad[elemento.difficultyBefore]
                          : "Sin dato"}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {numero(elemento.correctAnswers)}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {numero(elemento.errors)}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {numero(elemento.accuracy, " %")}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {numero(elemento.actualTimeSeconds, " s")}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          className={control}
                          style={{
                            background: "#FDE8D8",
                            color: "var(--primary)",
                          }}
                          aria-label={`Ver detalles de ${nombre(elemento)} del ${fecha(elemento)}`}
                          onClick={() => establecerSeleccionado(elemento)}
                        >
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-6 flex flex-wrap items-center justify-between gap-4">
            <p role="status" className="text-lg">
              Página {indice + 1} · {pagina.items.length} actividades
            </p>
            <nav aria-label="Páginas del historial" className="flex gap-3">
              <button
                className={control}
                disabled={indice === 0}
                onClick={() => navegar(indice - 1)}
              >
                Anterior
              </button>
              <button
                className={control}
                disabled={!pagina.hasMore}
                onClick={() => navegar(indice + 1)}
              >
                Siguiente
              </button>
            </nav>
          </div>
        </>
      )}
      {seleccionado && (
        <Detalle
          key={seleccionado.id}
          item={seleccionado}
          onClose={() => establecerSeleccionado(null)}
        />
      )}
    </section>
  )
}
