import { useEffect, useRef, useState } from "react"
import { api } from "../../servicios/api"
import { etiquetasCategorias } from "./catalogo"
import { etiquetaDificultad } from "../../tipos/ejercicios"
import { formatearTiempoActivo } from "../estadisticas/useEstadisticas"
import type {
  ActividadCancelada,
  PaginaCanceladas,
} from "../../../compartido/sesionesCanceladas"

const control = "px-5 py-3 rounded-2xl font-bold bg-muted disabled:opacity-50"

function fecha(valor: string | null) {
  return valor
    ? new Date(valor).toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sin fecha registrada"
}

function DetalleCancelada({
  actividad,
  alCerrar,
}: {
  actividad: ActividadCancelada
  alCerrar: () => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [detalle, establecerDetalle] = useState<ActividadCancelada | null>(
      null,
    ),
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
    void api
      .obtenerCancelada(actividad.id, controlador.signal)
      .then((valor) => {
        if (!controlador.signal.aborted) establecerDetalle(valor)
      })
      .catch(() => {
        if (!controlador.signal.aborted)
          establecerError(
            "No pudimos cargar el avance guardado. Intentá nuevamente.",
          )
      })
    return () => controlador.abort()
  }, [actividad.id, intento])
  const parcial = detalle?.partialProgress
  return (
    <dialog
      ref={dialogo}
      aria-labelledby="cancelled-detail-title"
      className="m-auto w-[calc(100%_-_2rem)] max-w-3xl rounded-3xl p-6 md:p-8 bg-card text-foreground border-2 border-border backdrop:bg-black/50"
      onCancel={alCerrar}
    >
      <div className="flex flex-wrap justify-between items-start gap-4">
        <h2 id="cancelled-detail-title" className="text-2xl font-bold">
          Avance de {actividad.exerciseName}
        </h2>
        <button type="button" autoFocus className={control} onClick={alCerrar}>
          Cerrar avance
        </button>
      </div>
      <p className="mt-4 text-lg">
        Actividad cancelada el {fecha(actividad.endedAt)}. No se incluye en
        resultados, estadísticas ni dificultad.
      </p>
      {!detalle && !error && (
        <p role="status" className="mt-5">
          Cargando avance…
        </p>
      )}
      {error && (
        <div role="alert" className="mt-5">
          <p>{error}</p>
          <button
            className={control}
            onClick={() => establecerIntento((actual) => actual + 1)}
          >
            Reintentar avance
          </button>
        </div>
      )}
      {detalle && !parcial && (
        <p className="mt-5">
          No hay un avance parcial disponible para mostrar. Se conserva el
          registro de la actividad y su cancelación.
        </p>
      )}
      {parcial && (
        <div className="space-y-5 mt-5">
          <dl className="grid sm:grid-cols-2 gap-4">
            <div>
              <dt>Tiempo activo guardado</dt>
              <dd className="text-xl font-bold">
                {formatearTiempoActivo(parcial.activeSeconds)}
              </dd>
            </div>
            <div>
              <dt>Paso alcanzado</dt>
              <dd className="text-xl font-bold">
                {parcial.step} de {parcial.totalSteps}
              </dd>
            </div>
            <div>
              <dt>Respuestas o intentos registrados</dt>
              <dd className="text-xl font-bold">{parcial.recordedResponses}</dd>
            </div>
          </dl>
          {parcial.description && <p>{parcial.description}</p>}
          <p className="p-4 rounded-2xl bg-muted">
            Es el último avance disponible, informado por el dispositivo. Las
            respuestas y borradores se conservan sin calcular una calificación
            final; las consignas sin completar no se cuentan como errores.
          </p>
          <h3 className="text-xl font-bold">Respuestas guardadas</h3>
          {parcial.responses?.length ? (
            <ol className="space-y-3">
              {parcial.responses.map((respuesta, indice) => (
                <li key={indice} className="p-4 rounded-2xl bg-muted">
                  <p className="font-bold">{respuesta.label}</p>
                  <p className="mt-1 break-words">{respuesta.response}</p>
                  {respuesta.responseTimeSeconds !== undefined && (
                    <p className="mt-1">
                      Tiempo de respuesta:{" "}
                      {respuesta.responseTimeSeconds.toLocaleString("es-AR", {
                        maximumFractionDigits: 3,
                      })}{" "}
                      s
                    </p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p>No se habían enviado respuestas.</p>
          )}
          <h3 className="text-xl font-bold">Borradores y selecciones</h3>
          {parcial.drafts?.length ? (
            <ul className="space-y-3">
              {parcial.drafts.map((borrador, indice) => (
                <li
                  key={indice}
                  className="p-4 rounded-2xl border border-border"
                >
                  <p className="font-bold">{borrador.label}</p>
                  <p className="mt-1 break-words">{borrador.response}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No había borradores guardados.</p>
          )}
        </div>
      )}
    </dialog>
  )
}

export function HistorialCanceladas() {
  const [pagina, establecerPagina] = useState<PaginaCanceladas | null>(null),
    [error, establecerError] = useState("")
  const [cursores, establecerCursores] = useState<string[]>([""]),
    [indice, establecerIndice] = useState(0),
    [intento, establecerIntento] = useState(0)
  const [elegida, establecerElegida] = useState<ActividadCancelada | null>(null)
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const controlador = new AbortController()
    establecerPagina(null)
    establecerError("")
    void api
      .obtenerCanceladas(cursores[indice] || undefined, controlador.signal)
      .then((valor) => {
        if (!controlador.signal.aborted) establecerPagina(valor)
      })
      .catch(() => {
        if (!controlador.signal.aborted)
          establecerError(
            "No pudimos cargar las actividades canceladas. Intentá nuevamente.",
          )
      })
    return () => controlador.abort()
  }, [indice, cursores, intento])
  function navegar(siguiente: number) {
    if (siguiente > indice && pagina?.nextCursor)
      establecerCursores((actuales) => [
        ...actuales.slice(0, indice + 1),
        pagina.nextCursor!,
      ])
    establecerIndice(siguiente)
    titulo.current?.focus()
  }
  return (
    <section
      aria-labelledby="cancelled-history-title"
      className="space-y-5 p-5 md:p-7 rounded-3xl bg-card border border-border"
    >
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2
          id="cancelled-history-title"
          ref={titulo}
          tabIndex={-1}
          className="text-2xl font-bold"
        >
          Actividades canceladas
        </h2>
        <button
          className={control}
          onClick={() => {
            establecerIndice(0)
            establecerCursores([""])
            establecerIntento((actual) => actual + 1)
          }}
        >
          Actualizar canceladas
        </button>
      </div>
      <p>
        Registro de actividades que no se completaron, ordenado por fecha de
        cancelación. Se conserva el último avance guardado y no se suman a tus
        resultados ni al tiempo de actividad completada.
      </p>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className={control}
            onClick={() => establecerIntento((actual) => actual + 1)}
          >
            Reintentar canceladas
          </button>
        </div>
      )}
      {!pagina && !error && (
        <p role="status">Cargando actividades canceladas…</p>
      )}
      {pagina && (
        <>
          {!pagina.items.length && (
            <p role="status">
              {pagina.hasMore
                ? "No hay actividades canceladas en este bloque. Podés continuar con Siguiente."
                : "No hay actividades canceladas para mostrar."}
            </p>
          )}
          <ul className="space-y-4">
            {pagina.items.map((actividad) => (
              <li
                key={actividad.id}
                className="p-5 rounded-2xl bg-muted flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-xl font-bold">
                    {actividad.exerciseName}
                  </h3>
                  <p className="mt-1">
                    {actividad.cognitiveFunctionId
                      ? etiquetasCategorias[actividad.cognitiveFunctionId]
                      : "Categoría no registrada"}
                    {actividad.difficultyLevel
                      ? ` · ${etiquetaDificultad[actividad.difficultyLevel]}`
                      : ""}
                  </p>
                  <p className="mt-1">Cancelada: {fecha(actividad.endedAt)}</p>
                  <p className="mt-1">
                    {actividad.partialProgress
                      ? `${actividad.partialProgress.recordedResponses} respuestas o intentos · ${formatearTiempoActivo(actividad.partialProgress.activeSeconds)} de tiempo activo guardado`
                      : "Sin avance parcial registrado"}
                  </p>
                </div>
                <button
                  className={control}
                  aria-label={`Ver avance de ${actividad.exerciseName} del ${fecha(actividad.endedAt)}`}
                  onClick={() => establecerElegida(actividad)}
                >
                  Ver avance guardado
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p role="status">
              Página {indice + 1} · {pagina.items.length} canceladas
            </p>
            <nav
              aria-label="Páginas de canceladas"
              className="flex flex-wrap gap-3"
            >
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
      {elegida && (
        <DetalleCancelada
          actividad={elegida}
          alCerrar={() => establecerElegida(null)}
        />
      )}
    </section>
  )
}
