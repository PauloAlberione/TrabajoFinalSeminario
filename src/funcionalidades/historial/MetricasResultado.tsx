import { etiquetaRespuestaVelocidad } from "../../../compartido/velocidad/respuestas"
import type { DetallesEjercicio } from "../../../compartido/resultados"

const etiquetas: Record<string, string> = {
  optionCount: "Alternativas por ronda",
  comparisonCount: "Figuras por grupo",
  selectionCount: "Colores solicitados por ronda",
  pairCount: "Parejas del tablero",
  pairAttempts: "Intentos de pareja",
  matchedPairs: "Parejas encontradas",
  mismatches: "Intentos sin pareja",
  rounds: "Rondas",
  sequenceLength: "Longitud de secuencia",
  totalPositions: "Posiciones evaluadas",
  correctPositions: "Posiciones correctas",
  wrongPositions: "Posiciones incorrectas",
  perfectRounds: "Rondas perfectas",
  targetWordsTotal: "Palabras objetivo",
  correctSelections: "Selecciones correctas",
  incorrectSelections: "Selecciones incorrectas",
  itemsPerSequence: "Elementos por secuencia",
  questionCount: "Preguntas",
  correctAnswers: "Aciertos",
  incorrectAnswers: "Errores",
  averageQuestionTime: "Tiempo medio por pregunta",
  synonymQuestions: "Preguntas de sinónimos",
  antonymQuestions: "Preguntas de antónimos",
  wordCount: "Palabras",
  solvedWords: "Palabras resueltas",
  firstAttemptCorrectWords: "Palabras acertadas al primer intento",
  incorrectAttempts: "Intentos incorrectos",
  revealedWords: "Palabras mostradas",
  numbersPerRound: "Números por ronda",
  incorrectPositions: "Posiciones incorrectas",
  ascendingRounds: "Rondas ascendentes",
  descendingRounds: "Rondas descendentes",
  directSubtractionQuestions: "Restas directas",
  differenceQuestions: "Preguntas de diferencia",
  correctDirectSubtractions: "Restas directas correctas",
  correctDifferences: "Diferencias correctas",
  totalTargets: "Objetivos",
  missedTargets: "Objetivos omitidos",
  falsePositiveSelections: "Selecciones de distractores",
  correctRounds: "Rondas correctas",
  incorrectRounds: "Rondas incorrectas",
  averageSelectionTime: "Tiempo medio de selección",
  objectCount: "Objetos",
  movementComplexity: "Complejidad del movimiento",
  figuresFound: "Figuras encontradas",
  firstAttemptCorrect: "Aciertos al primer intento",
  wrongAttempts: "Intentos incorrectos",
  revealedRounds: "Figuras mostradas",
  averageFindTime: "Tiempo medio de búsqueda",
  totalTrials: "Ensayos evaluados",
  attempts: "Intentos",
  timeouts: "Sin respuesta dentro del plazo",
  falseStarts: "Salidas anticipadas",
  averageResponseTimeMs: "Tiempo medio de respuesta",
  effectiveTimeSeconds: "Duración activa de respuesta",
  validReactions: "Reacciones válidas",
  medianResponseTimeMs: "Mediana de reacción",
  fastestResponseTimeMs: "Reacción más rápida",
  correctByOperation: "Aciertos por operación",
  errorsByOperation: "Errores por operación",
  patternTypesPlayed: "Patrones practicados",
  trialResults: "Detalle de ensayos",
}
const valores: Record<string, string> = {
  addition: "Suma",
  subtraction: "Resta",
  multiplication: "Multiplicación",
  division: "División",
  alternating: "Alternancia",
  repeatingGroup: "Grupo repetido",
  orientationCycle: "Cambio de orientación",
  sizeAlternation: "Cambio de tamaño",
  dualAttribute: "Dos atributos",
  arithmetic: "Progresión aritmética",
  geometric: "Progresión geométrica",
  ascending: "Ascendente",
  descending: "Descendente",
  answered: "Respondido",
  timeout: "Sin respuesta",
  falseStart: "Salida anticipada",
}

function mostrar(valor: unknown, clave: string): string {
  if (valor === null) return "Sin medición válida"
  if (typeof valor === "number" && Number.isFinite(valor))
    return `${Number(valor.toFixed(3)).toLocaleString("es-AR")}${
      clave.endsWith("Ms") ? " ms" : /Time|Seconds/.test(clave) ? " s" : ""
    }`
  if (typeof valor === "string") return valores[valor] ?? valor
  if (typeof valor === "boolean") return valor ? "Sí" : "No"
  if (Array.isArray(valor))
    return valor.map((elemento) => mostrar(elemento, "")).join(", ")
  if (valor && typeof valor === "object")
    return Object.entries(valor)
      .map(
        ([nombre, cantidad]) =>
          `${valores[nombre] ?? nombre}: ${mostrar(cantidad, "")}`,
      )
      .join(" · ")
  return "Dato no registrado"
}

export function MetricasResultado({
  details: detalles,
}: {
  details?: DetallesEjercicio
}) {
  if (!detalles)
    return (
      <p className="text-lg">
        No se registraron métricas específicas para este resultado.
      </p>
    )
  const campos = Object.entries(detalles).filter(
    ([clave, valor]) =>
      clave !== "exerciseType" &&
      clave !== "trialResults" &&
      valor !== undefined,
  )
  const ensayos = "trialResults" in detalles ? detalles.trialResults : undefined
  return (
    <section className="space-y-5" aria-label="Métricas del ejercicio">
      <h3 className="text-2xl font-bold">Detalles del ejercicio</h3>
      <dl className="grid sm:grid-cols-2 gap-4">
        {campos.map(([clave, valor]) => (
          <div
            key={clave}
            className="p-4 rounded-2xl"
            style={{ background: "var(--muted)" }}
          >
            <dt className="text-lg">{etiquetas[clave] ?? clave}</dt>
            <dd className="text-xl font-bold mt-1">{mostrar(valor, clave)}</dd>
          </div>
        ))}
      </dl>
      {ensayos && (
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Resultados de cada ensayo"
          tabIndex={0}
        >
          <table className="w-full text-left text-base">
            <caption className="text-xl font-bold text-left mb-3">
              Detalle de ensayos
            </caption>
            <thead>
              <tr>
                {[
                  "Ensayo",
                  "Respuesta esperada",
                  "Tu respuesta",
                  "Resultado",
                  "Estado",
                  "Tiempo",
                ].map((etiqueta) => (
                  <th key={etiqueta} scope="col" className="p-3">
                    {etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ensayos.map((ensayo) => (
                <tr
                  key={ensayo.trialId}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <th scope="row" className="p-3">
                    {ensayo.trialNumber}
                  </th>
                  <td className="p-3">
                    {etiquetaRespuestaVelocidad(ensayo.expectedAnswer)}
                  </td>
                  <td className="p-3">
                    {ensayo.submittedAnswer === null
                      ? ensayo.selectedAnswers?.length
                        ? `Seleccionaste: ${etiquetaRespuestaVelocidad(ensayo.selectedAnswers.join("|"))}`
                        : "Sin respuesta"
                      : ensayo.submittedAnswer
                        ? etiquetaRespuestaVelocidad(ensayo.submittedAnswer)
                        : "Sin dato"}
                  </td>
                  <td className="p-3">
                    {ensayo.correct === true
                      ? "Acierto"
                      : ensayo.correct === false
                        ? "Error"
                        : "Sin dato"}
                  </td>
                  <td className="p-3">
                    {valores[ensayo.status] ?? ensayo.status}
                  </td>
                  <td className="p-3">
                    {ensayo.responseTimeMs === null
                      ? "Sin medición"
                      : typeof ensayo.responseTimeMs === "number"
                        ? `${Number(ensayo.responseTimeMs.toFixed(3))} ms`
                        : "Sin dato"}
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
