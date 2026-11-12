import { useEffect, useRef } from "react"
import { audioJuego } from "../../../servicios/audioJuego"
import type { ResumenEjercicio } from "../../../../compartido/resultados"

export type { ResumenEjercicio } from "../../../../compartido/resultados"

import { etiquetaDificultad } from "../../../tipos/ejercicios"
import type { Nivel } from "../../../../compartido/memoria"

export function ResumenResultadoEjercicio({
  summary: resumen,
  onRepeat: alRepetir,
  onBack: alVolver,
  category: categoria,
  color = "#407453",
}: {
  summary: ResumenEjercicio
  onRepeat: () => void
  onBack: () => void
  category: string
  color?: string
}) {
  const reproducido = useRef(false)
  useEffect(() => {
    if (!reproducido.current) {
      reproducido.current = true
      audioJuego.reproducir("complete")
    }
  }, [])
  const orden: Nivel[] = ["easy", "normal", "hard", "veryHard"]
  const transicion =
    orden.indexOf(resumen.currentLevel) -
    orden.indexOf(resumen.difficultyBefore)
  const mensaje =
    resumen.adaptationStatus !== "applied"
      ? `Resultado guardado. Tu próximo ejercicio será de nivel ${etiquetaDificultad[resumen.currentLevel]}.`
      : transicion > 0
        ? `Avanzaste al nivel ${etiquetaDificultad[resumen.currentLevel]}.`
        : transicion < 0
          ? `El próximo ejercicio se realizará en nivel ${etiquetaDificultad[resumen.currentLevel]}.`
          : `Continuarás en el nivel ${etiquetaDificultad[resumen.currentLevel]}.`
  return (
    <section
      className="resultado-final p-5 md:p-8 rounded-3xl space-y-6"
      style={{ background: "var(--card)", border: "2px solid var(--border)" }}
    >
      <div className="resultado-cabecera">
        <div className="resultado-celebracion" aria-hidden="true">
          ✓
        </div>
        <div>
          <p className="antetitulo">{categoria} · Resultado guardado</p>
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            ¡Actividad completada!
          </h2>
          <p className="text-xl mt-2">{resumen.exerciseName}</p>
        </div>
      </div>
      <p className="text-lg text-muted-foreground">
        Terminaste una nueva práctica. Revisá tu resultado y elegí cómo seguir.
        También lo vas a encontrar en tu historial.
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-xl">
        {[
          ["Aciertos", resumen.correctAnswers, "✓"],
          ["Errores", resumen.errors, "↻"],
          ["Precisión", `${Math.round(resumen.accuracy)}%`, "◎"],
          ["Tiempo activo", `${resumen.actualTimeSeconds.toFixed(1)} s`, "◷"],
        ].map(([etiqueta, valor, icono]) => (
          <div
            key={etiqueta}
            className="resultado-metrica p-5 rounded-2xl bg-muted"
          >
            <dt>
              <span aria-hidden="true" className="resultado-metrica-icono">
                {icono}
              </span>
              {etiqueta}
            </dt>
            <dd className="text-2xl font-bold mt-2">{valor}</dd>
          </div>
        ))}
      </dl>
      <details className="rounded-2xl border border-border p-5">
        <summary className="font-bold cursor-pointer">
          Ver detalles de la actividad
        </summary>
        <p className="mt-4">
          Nivel utilizado: {etiquetaDificultad[resumen.difficultyBefore]}
        </p>
        {Number.isFinite(resumen.actualTimeSeconds) && (
          <p>Tiempo activo total: {resumen.actualTimeSeconds.toFixed(1)} s</p>
        )}
        <p>
          Tiempo de respuesta acumulado:{" "}
          {resumen.actualResponseTimeSeconds.toFixed(1)} s
        </p>
        {resumen.details?.exerciseType === "simpleCrossword" && (
          <div className="text-xl space-y-2">
            <p>
              Palabras resueltas: {resumen.details.solvedWords} de{" "}
              {resumen.details.wordCount}
            </p>
            <p>
              Aciertos al primer intento:{" "}
              {resumen.details.firstAttemptCorrectWords}
            </p>
            <p>Respuestas mostradas: {resumen.details.revealedWords}</p>
          </div>
        )}
        {resumen.details?.exerciseType === "hiddenFigure" && (
          <div className="text-xl space-y-2">
            <p>
              Figuras encontradas: {resumen.details.figuresFound} de{" "}
              {resumen.details.rounds}
            </p>
            <p>
              Aciertos al primer intento: {resumen.details.firstAttemptCorrect}
            </p>
            <p>Figuras mostradas: {resumen.details.revealedRounds}</p>
          </div>
        )}
        {resumen.details?.exerciseType === "identifyElements" && (
          <p className="text-xl">
            Elementos encontrados: {resumen.details.correctSelections} de{" "}
            {resumen.details.totalTargets}. Selecciones incorrectas:{" "}
            {resumen.details.falsePositiveSelections}.
          </p>
        )}
        {resumen.details && "timeouts" in resumen.details && (
          <div className="text-xl space-y-2">
            <p>Sin respuesta: {resumen.details.timeouts}</p>
            <p>
              Tiempo medio:{" "}
              {resumen.details.averageResponseTimeMs === null
                ? "Sin respuestas válidas"
                : `${Math.round(resumen.details.averageResponseTimeMs)} ms`}
            </p>
            {resumen.details.exerciseType === "visualReaction" && (
              <>
                <p>Salidas anticipadas: {resumen.details.falseStarts}</p>
                <p>
                  Mediana:{" "}
                  {resumen.details.medianResponseTimeMs === null
                    ? "Sin reacciones válidas"
                    : `${Math.round(resumen.details.medianResponseTimeMs)} ms`}
                </p>
                <p>
                  Reacción más rápida:{" "}
                  {resumen.details.fastestResponseTimeMs === null
                    ? "Sin reacciones válidas"
                    : `${Math.round(resumen.details.fastestResponseTimeMs)} ms`}
                </p>
              </>
            )}
          </div>
        )}
      </details>
      <div className="resultado-siguiente p-5 rounded-2xl border border-border">
        <span aria-hidden="true" className="text-3xl">
          →
        </span>
        <div>
          <p className="font-bold mb-1">Tu próxima actividad</p>
          <p className="text-xl">{mensaje}</p>
          <p className="text-base mt-2 text-muted-foreground">
            El nivel se adapta dentro de {categoria}. Cada categoría avanza por
            separado.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <button
          className="px-8 py-4 rounded-2xl text-xl font-bold"
          style={{ background: color, color: "white" }}
          onClick={alRepetir}
        >
          Repetir ejercicio
        </button>
        <button
          className="px-8 py-4 rounded-2xl text-xl font-bold"
          style={{
            background: "var(--card)",
            border: "2px solid var(--border)",
          }}
          onClick={alVolver}
        >
          Volver a {categoria}
        </button>
      </div>
    </section>
  )
}
