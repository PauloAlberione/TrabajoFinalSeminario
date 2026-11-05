import { etiquetasCategorias } from "../funcionalidades/historial/catalogo"
import type { InformeEstadisticas } from "../../compartido/estadisticas"
import {
  formatearTiempoActivo,
  formatearPrecision,
} from "../funcionalidades/estadisticas/useEstadisticas"
import { type PerfilUsuario } from "../servicios/datosUsuario"
import { type Pantalla } from "../tipos/navegacion"
import { IconoNumeros, IconoFlecha } from "../componentes/Iconos"

export function PantallaInicio({
  onNavigate: alNavegar,
  profile: perfil,
  report: informe,
}: {
  onNavigate: (texto: Pantalla) => void
  profile: PerfilUsuario
  report: InformeEstadisticas
}) {
  const nombre = perfil.nombre || "Usuario"
  return (
    <div className="p-5 md:p-10 max-w-6xl mx-auto">
      <div
        className="rounded-3xl px-6 md:px-10 py-8 mb-8 flex flex-wrap items-center justify-between gap-6"
        style={{ background: "var(--primary)" }}
      >
        <div>
          <p
            className="text-base font-semibold mb-1"
            style={{ color: "var(--primary-foreground)" }}
          >
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1
            className="text-5xl font-bold leading-tight"
            style={{
              fontFamily: "Fraunces, serif",
              color: "var(--primary-foreground)",
            }}
          >
            Buenos días, {nombre} 👋
          </h1>
          <p
            className="text-lg mt-2"
            style={{ color: "var(--primary-foreground)" }}
          >
            Registraste actividad en {informe.activeDays} días. ¡Continuá a tu
            ritmo!
          </p>
        </div>
        <div
          className="flex items-center gap-4 px-8 py-5 rounded-2xl"
          style={{ background: "rgba(0,0,0,0.12)" }}
        >
          <span style={{ fontSize: "2.5rem" }}>🔥</span>
          <div>
            <p
              className="text-4xl font-bold"
              style={{
                fontFamily: "Fraunces, serif",
                color: "var(--primary-foreground)",
              }}
            >
              {informe.currentStreak}
            </p>
            <p
              className="text-base"
              style={{ color: "var(--primary-foreground)" }}
            >
              días seguidos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div
            className="rounded-3xl p-7"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Ejercicios realizados hoy
            </h2>
            <p
              className="text-4xl font-bold"
              style={{ color: "var(--primary)" }}
            >
              {informe.today.completedExercises}
            </p>
            <p className="text-lg mt-3">
              Tiempo activo:{" "}
              {formatearTiempoActivo(informe.today.activeSeconds)}
            </p>
            {informe.today.completedExercises === 0 && (
              <p className="mt-3">
                Todavía no completaste actividades hoy. Elegí una cuando
                quieras.
              </p>
            )}
          </div>
          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Seguir ejercitando
            </h2>
            <button
              onClick={() =>
                alNavegar(
                  ({
                    memory: "game",
                    language: "lenguaje-game",
                    calculation: "calculo-game",
                    attentionRecognition: "atencion-game",
                    speed: "velocidad-game",
                  } as const)[informe.suggestedCategory],
                )
              }
              className="w-full flex items-center gap-5 p-6 rounded-3xl text-left transition-all hover:scale-[1.01] active:scale-98"
              style={{
                background: "var(--secondary)",
                color: "white",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <IconoNumeros />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">
                  {etiquetasCategorias[informe.suggestedCategory]}
                </p>
                <p
                  className="text-base"
                  style={{ color: "var(--secondary-foreground)" }}
                >
                  Categoría sin actividad o practicada hace más tiempo. Podés
                  elegir otra en Actividades.
                </p>
              </div>
              <IconoFlecha />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div
            className="rounded-3xl p-6"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
            }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Esta semana
            </h2>
            <div className="space-y-4">
              {[
                {
                  emoji: "🧩",
                  label: "Sesiones",
                  value: `${informe.week.completedSessions}`,
                },
                {
                  emoji: "✅",
                  label: "Ejercicios",
                  value: `${informe.week.completedExercises}`,
                },
                {
                  emoji: "⏱️",
                  label: "Tiempo activo",
                  value: formatearTiempoActivo(informe.week.activeSeconds),
                },
                {
                  emoji: "🎯",
                  label: "Precisión ponderada",
                  value: formatearPrecision(informe.week.accuracy),
                },
              ].map((texto, indice) => (
                <div key={indice} className="flex items-center justify-between">
                  <span
                    className="flex items-center gap-3 text-base font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <span className="text-xl">{texto.emoji}</span>
                    {texto.label}
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{
                      color: "var(--foreground)",
                      fontFamily: "Fraunces, serif",
                    }}
                  >
                    {texto.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-3xl p-6"
            style={{ background: "var(--accent)" }}
          >
            <p
              className="text-sm font-bold uppercase tracking-wide mb-2"
              style={{ color: "var(--accent-foreground)" }}
            >
              Consejo del día
            </p>
            <p
              className="text-base font-semibold leading-relaxed"
              style={{ color: "var(--accent-foreground)" }}
            >
              Elegí actividades que disfrutes y hacé pausas cuando lo necesites.
              Los resultados describen tu práctica en MenteClear.
            </p>
          </div>
          <div
            className="rounded-3xl p-6"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
            }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Logros recientes
            </h2>
            <div className="space-y-3">
              {(informe.currentStreak > 0
                ? [
                    {
                      icon: "🌟",
                      label: `${informe.currentStreak} días seguidos`,
                      sub: "Actual",
                    },
                  ]
                : []
              ).map((segundo, indice) => (
                <div key={indice} className="flex items-center gap-3">
                  <span className="text-2xl">{segundo.icon}</span>
                  <div>
                    <p className="text-sm font-bold leading-tight">
                      {segundo.label}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {segundo.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
