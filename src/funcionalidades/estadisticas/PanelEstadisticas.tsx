import { useState, useEffect, useRef } from "react"
import type { SeccionProgreso } from "./PestanasProgreso"
import type { InformeEstadisticas } from "../../../compartido/estadisticas"
import { etiquetasCategorias } from "../historial/catalogo"
import { formatearTiempoActivo, formatearPrecision } from "./useEstadisticas"

const niveles = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  veryHard: "Muy difícil",
}
const tarjeta = {
  background: "var(--card)",
  border: "1.5px solid var(--border)",
}

export function EstadoEstadisticas({
  error,
  retry: reintentar,
}: {
  error: string
  retry: () => void
}) {
  return (
    <div className="p-8 text-xl" role={error ? "alert" : "status"}>
      {error || "Cargando estadísticas…"}
      {error && (
        <button
          className="m-4 px-8 py-4 rounded-2xl"
          style={tarjeta}
          onClick={reintentar}
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

function fechaGrafico(etiqueta: string, breve = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(etiqueta)) return etiqueta
  const [anio, mes, dia] = etiqueta.split("-")
  return breve ? `${dia}/${mes}` : `${dia}/${mes}/${anio}`
}

function Grafico({
  title: titulo,
  items: elementos,
  unit: unidad = "",
  icono = "📊",
}: {
  title: string
  items: {
    label: string
    value: number | null
  }[]
  unit?: string
  icono?: string
}) {
  const [ampliado, establecerAmpliado] = useState(false)
  const contenedorGrafico = useRef<HTMLDivElement>(null)
  const fechas = elementos.map((elemento) => elemento.label).join("|")
  useEffect(() => {
    const contenedor = contenedorGrafico.current
    if (!contenedor || !/^\d{4}-/.test(fechas)) return
    const mostrarFechasRecientes = () => {
      contenedor.scrollLeft = contenedor.scrollWidth - contenedor.clientWidth
    }
    mostrarFechasRecientes()
    const observador = new ResizeObserver(mostrarFechasRecientes)
    observador.observe(contenedor)
    if (contenedor.firstElementChild)
      observador.observe(contenedor.firstElementChild)
    return () => observador.disconnect()
  }, [fechas])

  const maximo =
    unidad === "%"
      ? 100
      : Math.max(1, ...elementos.map((elemento) => elemento.value ?? 0))
  const graficoAncho = Math.max(
    320,
    elementos.length *
      (elementos.some((elemento) => !/^\d{4}-/.test(elemento.label))
        ? 100
        : 40),
  )
  const columnaAncho = graficoAncho / Math.max(1, elementos.length)
  return (
    <section className="p-6 rounded-3xl min-w-0" style={tarjeta}>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
        <span aria-hidden="true">{icono}</span>
        {titulo}
      </h2>
      <div
        ref={contenedorGrafico}
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={titulo}
      >
        <svg
          role="img"
          aria-label={`${titulo}. Los valores exactos están disponibles en la tabla.`}
          className="statistics-chart"
          viewBox={`0 0 ${graficoAncho} 180`}
          style={{
            minWidth: "100%",
            width: `${graficoAncho / 18}rem`,
            height: "10rem",
          }}
        >
          {elementos.map((elemento, indice) => (
            <g key={elemento.label}>
              <title>
                {fechaGrafico(elemento.label)}:{" "}
                {elemento.value === null
                  ? "Sin datos"
                  : `${elemento.value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}${unidad}`}
              </title>
              <rect
                x={indice * (graficoAncho / Math.max(1, elementos.length)) + 4}
                y={145 - ((elemento.value ?? 0) / maximo) * 115}
                width={Math.max(
                  8,
                  graficoAncho / Math.max(1, elementos.length) - 8,
                )}
                height={
                  elemento.value === null
                    ? 0
                    : Math.max(
                        elemento.value === 0 ? 2 : 0,
                        (elemento.value / maximo) * 115,
                      )
                }
                rx="3"
                fill="var(--primary)"
              />
              <text
                x={indice * columnaAncho + columnaAncho / 2}
                y={135 - ((elemento.value ?? 0) / maximo) * 115}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
              >
                {elemento.value === null
                  ? "—"
                  : elemento.value.toLocaleString("es-AR", {
                      maximumFractionDigits: 1,
                    })}
              </text>
              {elementos.length <= 7 && (
                <text
                  x={indice * columnaAncho + columnaAncho / 2}
                  y="173"
                  textAnchor="middle"
                  fontSize="12"
                  fill="currentColor"
                >
                  {elemento.label.startsWith("Atención")
                    ? "Atención"
                    : /^\d{4}-/.test(elemento.label)
                      ? fechaGrafico(elemento.label, true)
                      : elemento.label}
                </text>
              )}
            </g>
          ))}
          <line x1="0" x2="100%" y1="148" y2="148" stroke="var(--border)" />
          {elementos.length > 7 && (
            <text x="4" y="174" fontSize="13" fill="currentColor">
              {elementos[0]
                ? fechaGrafico(elementos[0].label)
                : "Sin actividades"}
            </text>
          )}
          {elementos.length > 7 && (
            <text
              x="98%"
              y="174"
              textAnchor="end"
              fontSize="13"
              fill="currentColor"
            >
              {elementos.length > 1
                ? fechaGrafico(elementos[elementos.length - 1].label)
                : ""}
            </text>
          )}
        </svg>
      </div>
      {elementos.length > 7 && /^\d{4}-/.test(elementos[0]?.label ?? "") && (
        <p className="text-sm text-muted-foreground mt-3">
          Las fechas más recientes están a la vista. Desplazate por el gráfico
          para ver días anteriores o abrí la tabla de valores.
        </p>
      )}
      <button
        className="px-5 py-3 rounded-xl font-semibold mt-2"
        style={{ background: "var(--muted)" }}
        aria-expanded={ampliado}
        onClick={() => establecerAmpliado(!ampliado)}
      >
        {ampliado ? "Ocultar" : "Ver"} valores de {titulo.toLowerCase()}
      </button>
      {ampliado && (
        <div className="max-h-80 overflow-auto mt-3">
          <table className="w-full text-left">
            <caption className="sr-only">{titulo}</caption>
            <thead>
              <tr>
                <th scope="col">Fecha o categoría</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {elementos.map((elemento) => (
                <tr key={elemento.label}>
                  <th scope="row" className="py-2 font-normal">
                    {fechaGrafico(elemento.label)}
                  </th>
                  <td>
                    {elemento.value === null
                      ? "Sin datos"
                      : `${elemento.value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}${unidad}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function PanelEstadisticas({
  report: informe,
  vista,
}: {
  report: InformeEstadisticas
  vista: Extract<SeccionProgreso, "resumen" | "actividad" | "categorias">
}) {
  const [graficoActual, establecerGraficoActual] =
    useState<"ejercicios" | "precision" | "tiempo">("ejercicios")
  const { period: periodo, lifetime: historico } = informe
  const diasConActividad = informe.daily.filter(
    (dia) => dia.completedExercises > 0,
  ).length
  const graficosActividad = {
    ejercicios: {
      titulo: "Actividad por fecha",
      icono: "✅",
      unidad: "",
      valores: informe.daily.map((dia) => ({
        label: dia.date,
        value: dia.completedExercises,
      })),
    },
    precision: {
      titulo: "Precisión por fecha",
      icono: "🎯",
      unidad: "%",
      valores: informe.daily.map((dia) => ({
        label: dia.date,
        value: dia.accuracy,
      })),
    },
    tiempo: {
      titulo: "Tiempo activo por fecha (segundos)",
      icono: "⏱️",
      unidad: " s",
      valores: informe.daily.map((dia) => ({
        label: dia.date,
        value:
          dia.completedExercises && !dia.durationMeasurements
            ? null
            : dia.activeSeconds,
      })),
    },
  }
  const grafico = graficosActividad[graficoActual]
  const iconosCategorias = {
    memory: "🧠",
    language: "💬",
    calculation: "🔢",
    attentionRecognition: "🔎",
    speed: "⚡",
  }
  const mediciones = [
    [
      "✅",
      "#D8EDE3",
      "Ejercicios del período",
      periodo.completedExercises,
      "Una actividad completada cuenta como un ejercicio.",
    ],
    [
      "🎯",
      "#FDE8D8",
      "Precisión",
      formatearPrecision(periodo.accuracy),
      "Aciertos sobre todas las respuestas registradas.",
    ],
    [
      "⏱️",
      "#E4E0F5",
      "Tiempo activo del período",
      periodo.durationMeasurements
        ? formatearTiempoActivo(periodo.activeSeconds)
        : "Sin datos",
      "El tiempo de pausa no se cuenta.",
    ],
    [
      "🔥",
      "#F5E0DB",
      "Racha actual",
      `${informe.currentStreak} ${
        informe.currentStreak === 1 ? "día" : "días"
      }`,
      "Días consecutivos con actividades completadas.",
    ],
  ]
  return (
    <section className="space-y-7 progreso-panel">
      {periodo.completedExercises === 0 && (
        <div
          role="status"
          className="p-7 rounded-3xl border border-border bg-card"
        >
          <h2 className="text-2xl mb-3">
            No hay ejercicios completados en este período.
          </h2>
          <p>
            Podés elegir otro período o realizar una actividad. Tus resultados
            aparecerán aquí cuando termines.
          </p>
        </div>
      )}
      {periodo.completedExercises > 0 && diasConActividad < 2 && (
        <p
          role="status"
          className="p-5 rounded-2xl border border-border bg-card"
        >
          Todavía no hay actividad en dos fechas distintas para comparar tu
          desempeño a través del tiempo. Mostramos los resultados disponibles;
          podés seguir practicando a tu ritmo.
        </p>
      )}
      {vista === "resumen" && (
        <div className="space-y-6 transicion-pantalla" key="resumen">
          <h2 className="text-2xl font-bold">Tu resumen del período</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
            {mediciones.map(([icono, fondo, etiqueta, valor, ayuda]) => (
              <div
                key={etiqueta}
                className="tarjeta-indicador p-5 rounded-3xl"
                style={tarjeta}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="indicador-icono"
                    style={{ background: fondo }}
                  >
                    {icono}
                  </span>
                  <p className="text-base font-semibold">{etiqueta}</p>
                </div>
                <p className="text-3xl font-bold mt-4 text-primary">{valor}</p>
                <p className="text-sm mt-2 text-muted-foreground">{ayuda}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { titulo: "Esta semana", icono: "📅", totales: informe.week },
              { titulo: "Este mes", icono: "🗓️", totales: informe.month },
            ].map(({ titulo, icono, totales }) => (
              <section
                key={titulo}
                className="p-5 rounded-3xl flex items-start gap-4"
                style={tarjeta}
              >
                <span aria-hidden="true" className="indicador-icono bg-muted">
                  {icono}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{titulo}</h3>
                  <p className="text-2xl font-bold mt-2">
                    {totales.completedExercises}{" "}
                    {totales.completedExercises === 1
                      ? "ejercicio"
                      : "ejercicios"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tiempo activo:{" "}
                    {totales.durationMeasurements
                      ? formatearTiempoActivo(totales.activeSeconds)
                      : "Sin datos"}
                  </p>
                </div>
              </section>
            ))}
          </div>
          <details className="p-6 rounded-3xl" style={tarjeta}>
            <summary className="font-bold text-xl cursor-pointer">
              <span aria-hidden="true" className="mr-2">
                📌
              </span>
              Ver totales de mi cuenta
            </summary>
            <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
              {[
                ["Ejercicios totales", historico.completedExercises],
                ["Sesiones totales", historico.completedSessions],
                [
                  "Tiempo activo total",
                  formatearTiempoActivo(historico.activeSeconds),
                ],
                ["Días activos totales", informe.activeDays],
                ["Ejercicios esta semana", informe.week.completedExercises],
                ["Ejercicios este mes", informe.month.completedExercises],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta}>
                  <dt className="text-muted-foreground">{etiqueta}</dt>
                  <dd className="text-2xl font-bold mt-2">{valor}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      )}
      {vista === "actividad" && (
        <div className="space-y-6 transicion-pantalla" key="actividad">
          <div>
            <h2 className="text-2xl font-bold">Tu actividad en gráficos</h2>
            <p className="mt-2 text-muted-foreground">
              Elegí qué querés consultar. Cada gráfico tiene una tabla con los
              valores exactos.
            </p>
          </div>
          <div
            role="group"
            aria-label="Qué mostrar en el gráfico"
            className="flex flex-wrap gap-3"
          >
            {([
              ["ejercicios", "✅", "Ejercicios"],
              ["precision", "🎯", "Precisión"],
              ["tiempo", "⏱️", "Tiempo activo"],
            ] as const).map(([id, icono, etiqueta]) => (
              <button
                type="button"
                key={id}
                aria-pressed={graficoActual === id}
                onClick={() => establecerGraficoActual(id)}
                className="px-5 py-3 rounded-2xl font-semibold border border-border"
                style={{
                  background:
                    graficoActual === id ? "var(--primary)" : "var(--card)",
                  color:
                    graficoActual === id
                      ? "var(--primary-foreground)"
                      : "var(--foreground)",
                }}
              >
                <span aria-hidden="true" className="mr-2">
                  {icono}
                </span>
                {etiqueta}
              </button>
            ))}
          </div>
          <Grafico
            key={graficoActual}
            title={grafico.titulo}
            icono={grafico.icono}
            unit={grafico.unidad}
            items={grafico.valores}
          />
          <p className="text-muted-foreground">
            Sesiones del período: {periodo.completedSessions}. Sesiones este
            mes: {informe.month.completedSessions}. Cada sesión actual
            corresponde a un ejercicio.
          </p>
        </div>
      )}
      {vista === "categorias" && (
        <div className="space-y-6 transicion-pantalla" key="categorias">
          <h2 className="text-2xl font-bold">Resultados por categoría</h2>
          <p className="text-muted-foreground">
            Cada categoría tiene su propio nivel automático. Abrí una tarjeta
            para ver más información.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {informe.categories.map((categoria) => (
              <details
                key={categoria.category}
                className="categoria-progreso p-5 rounded-3xl"
                style={tarjeta}
              >
                <summary className="cursor-pointer">
                  <span className="font-bold text-xl">
                    <span aria-hidden="true" className="mr-3">
                      {iconosCategorias[categoria.category]}
                    </span>
                    {etiquetasCategorias[categoria.category]}
                  </span>
                  <span className="block mt-3 text-base">
                    {categoria.completedExercises} ejercicios ·{" "}
                    {formatearPrecision(categoria.accuracy)}
                  </span>
                  <span className="inline-block mt-3 px-3 py-1 rounded-full bg-muted text-sm font-semibold">
                    Nivel actual: {niveles[categoria.currentLevel]}
                  </span>
                </summary>
                <dl className="space-y-3 mt-5 pt-4 border-t border-border">
                  <div>
                    <dt>Tiempo activo</dt>
                    <dd className="font-bold">
                      {categoria.durationMeasurements
                        ? formatearTiempoActivo(categoria.activeSeconds)
                        : "Sin datos"}
                    </dd>
                  </div>
                  <div>
                    <dt>Última actividad del período</dt>
                    <dd>
                      {categoria.lastActivity
                        ? new Date(categoria.lastActivity).toLocaleString(
                            "es-AR",
                          )
                        : "Sin actividad"}
                    </dd>
                  </div>
                </dl>
              </details>
            ))}
          </div>
          <details className="p-6 rounded-3xl" style={tarjeta}>
            <summary className="font-bold text-xl cursor-pointer">
              <span aria-hidden="true" className="mr-2">
                📊
              </span>
              Comparar categorías
            </summary>
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 mt-5">
              <Grafico
                title="Precisión por categoría"
                unit="%"
                items={informe.categories.map((categoria) => ({
                  label: etiquetasCategorias[categoria.category],
                  value: categoria.accuracy,
                }))}
              />
              <Grafico
                title="Ejercicios por categoría"
                items={informe.categories.map((categoria) => ({
                  label: etiquetasCategorias[categoria.category],
                  value: categoria.completedExercises,
                }))}
              />
            </div>
          </details>
          <details className="p-6 rounded-3xl" style={tarjeta}>
            <summary className="text-xl font-bold cursor-pointer">
              Precisión según la dificultad utilizada
            </summary>
            <p className="my-4">
              Compará la dificultad de las actividades: los gráficos generales
              combinan ejercicios y niveles.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Object.entries(informe.difficulties).map(([nivel, valores]) => (
                <div key={nivel}>
                  <h3 className="font-bold">
                    {niveles[(nivel as keyof typeof niveles)]}
                  </h3>
                  <p>
                    {valores.completedExercises} ejercicios ·{" "}
                    {formatearPrecision(valores.accuracy)}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      <aside className="text-sm space-y-3">
        {periodo.durationMeasurements < periodo.completedExercises && (
          <p>
            Hay actividades antiguas sin duración registrada. El tiempo muestra
            solo las mediciones disponibles.
          </p>
        )}
        {periodo.accuracyMeasurements < periodo.completedExercises && (
          <p>
            La precisión incluye solo resultados con aciertos y errores
            registrados.
          </p>
        )}
        <details>
          <summary className="cursor-pointer font-semibold">
            <span aria-hidden="true" className="mr-2">
              ℹ️
            </span>
            Cómo leer y calcular estos datos
          </summary>
          <p>
            Estos resultados describen tus ejercicios en MenteClear. La
            precisión depende del ejercicio y de su dificultad; sus cambios no
            demuestran una mejora cognitiva.
          </p>
          <p className="mt-2">
            Días calculados en {informe.timeZone}. La semana comienza el lunes y
            se usa el mes calendario. La racha puede finalizar ayer si aún no
            realizaste actividades hoy. El tiempo activo proviene del
            dispositivo y excluye pausas.
          </p>
        </details>
      </aside>
    </section>
  )
}
