import { HistorialCanceladas } from "../funcionalidades/historial/HistorialCanceladas"
import { useId, useState } from "react"
import {
  PanelEstadisticas,
  EstadoEstadisticas,
} from "../funcionalidades/estadisticas/PanelEstadisticas"
import {
  PestanasProgreso,
  type SeccionProgreso,
} from "../funcionalidades/estadisticas/PestanasProgreso"
import { useEstadisticas } from "../funcionalidades/estadisticas/useEstadisticas"
import { HistorialEjercicios } from "../funcionalidades/historial/HistorialEjercicios"
import { AccionesExportarPdf } from "../funcionalidades/pdf/AccionesExportarPdf"
import type { FiltrosHistorial } from "../../compartido/historial"
import type { EstadisticasRango } from "../../compartido/estadisticas"

export function PantallaProgreso({
  statistics: estadisticas,
  revisionCancelaciones = 0,
}: {
  statistics: ReturnType<typeof useEstadisticas>
  revisionCancelaciones?: number
}) {
  const [seccion, establecerSeccion] = useState<SeccionProgreso>("resumen")
  const [historialIniciado, establecerHistorialIniciado] = useState(false)
  const [tipoHistorial, establecerTipoHistorial] =
    useState<"completed" | "cancelled">("completed")
  const [canceladasIniciadas, establecerCanceladasIniciadas] = useState(false)
  const idBase = useId()
  const { report: informe, range: rango } = estadisticas
  const filtrosPdf: FiltrosHistorial = {}
  if (informe && rango !== "all") {
    const inicio = new Date(informe.generatedAt),
      fin = new Date(informe.generatedAt)
    inicio.setHours(0, 0, 0, 0)
    inicio.setDate(inicio.getDate() - (Number(rango) - 1))
    fin.setHours(0, 0, 0, 0)
    fin.setDate(fin.getDate() + 1)
    filtrosPdf.from = inicio.toISOString()
    filtrosPdf.to = fin.toISOString()
  }
  function cambiarSeccion(siguiente: SeccionProgreso) {
    establecerSeccion(siguiente)
    if (siguiente === "historial") establecerHistorialIniciado(true)
  }
  return (
    <div className="pantalla-amplia p-5 md:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="antetitulo">Tus actividades, a tu ritmo</p>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <span aria-hidden="true">📊</span>Mi Progreso
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Elegí qué querés consultar.
          </p>
        </div>
        {seccion !== "historial" && (
          <label className="block font-semibold">
            Período a consultar
            <select
              className="block w-full p-3 mt-2 rounded-xl border border-border bg-card"
              value={rango}
              onChange={(evento) =>
                estadisticas.setRange(evento.target.value as EstadisticasRango)
              }
            >
              <option value="7">7 días</option>
              <option value="30">30 días</option>
              <option value="90">90 días</option>
              <option value="all">Todo el historial</option>
            </select>
          </label>
        )}
      </header>
      <PestanasProgreso
        idBase={idBase}
        actual={seccion}
        alCambiar={cambiarSeccion}
      />
      {(["resumen", "actividad", "categorias"] as const).map((vista) => (
        <section
          key={vista}
          id={`${idBase}-panel-${vista}`}
          role="tabpanel"
          aria-labelledby={`${idBase}-pestana-${vista}`}
          hidden={seccion !== vista}
          tabIndex={0}
          className="panel-progreso"
        >
          {informe ? (
            <PanelEstadisticas report={informe} vista={vista} />
          ) : (
            <EstadoEstadisticas
              error={estadisticas.error}
              retry={estadisticas.retry}
            />
          )}
        </section>
      ))}
      <section
        id={`${idBase}-panel-historial`}
        role="tabpanel"
        aria-labelledby={`${idBase}-pestana-historial`}
        hidden={seccion !== "historial"}
        tabIndex={0}
        className="panel-progreso"
      >
        <div
          role="group"
          aria-label="Tipo de actividades del historial"
          className="flex flex-wrap gap-3 mb-5"
        >
          <button
            type="button"
            aria-pressed={tipoHistorial === "completed"}
            onClick={() => establecerTipoHistorial("completed")}
            className="px-5 py-3 rounded-2xl font-bold border border-border"
            style={{
              background:
                tipoHistorial === "completed"
                  ? "var(--primary)"
                  : "var(--card)",
              color:
                tipoHistorial === "completed"
                  ? "var(--primary-foreground)"
                  : "var(--foreground)",
            }}
          >
            <span aria-hidden="true">✅ </span>Completadas
          </button>
          <button
            type="button"
            aria-pressed={tipoHistorial === "cancelled"}
            onClick={() => {
              establecerTipoHistorial("cancelled")
              establecerCanceladasIniciadas(true)
            }}
            className="px-5 py-3 rounded-2xl font-bold border border-border"
            style={{
              background:
                tipoHistorial === "cancelled"
                  ? "var(--primary)"
                  : "var(--card)",
              color:
                tipoHistorial === "cancelled"
                  ? "var(--primary-foreground)"
                  : "var(--foreground)",
            }}
          >
            <span aria-hidden="true">🗂️ </span>Canceladas
          </button>
        </div>
        <div hidden={tipoHistorial !== "completed"}>
          {historialIniciado && <HistorialEjercicios />}
        </div>
        <div hidden={tipoHistorial !== "cancelled"}>
          {canceladasIniciadas && (
            <HistorialCanceladas key={revisionCancelaciones} />
          )}
        </div>
      </section>
      <section
        id={`${idBase}-panel-informes`}
        role="tabpanel"
        aria-labelledby={`${idBase}-pestana-informes`}
        hidden={seccion !== "informes"}
        tabIndex={0}
        className="panel-progreso"
      >
        <div className="p-5 md:p-7 rounded-3xl border border-border bg-card space-y-3">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span aria-hidden="true">📄</span>Descargar mis resultados
          </h2>
          <p>
            Guardá un informe PDF con tus actividades y resultados. Usá el
            selector de período de arriba para elegir las fechas.
          </p>
          {informe ? (
            <AccionesExportarPdf
              filters={filtrosPdf}
              description={
                rango === "all"
                  ? "Se exportará todo el historial disponible."
                  : `Se exportará el período seleccionado de ${rango} días.`
              }
            />
          ) : (
            <EstadoEstadisticas
              error={estadisticas.error}
              retry={estadisticas.retry}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Para exportar un ejercicio específico o combinar filtros, abrí la
            pestaña Historial.
          </p>
        </div>
      </section>
      <aside className="p-4 rounded-2xl bg-muted text-sm flex items-start gap-3">
        <span aria-hidden="true" className="text-xl">
          ℹ️
        </span>
        <p>
          Estos resultados describen tu práctica en MenteClear; no son una
          evaluación clínica.
        </p>
      </aside>
    </div>
  )
}
