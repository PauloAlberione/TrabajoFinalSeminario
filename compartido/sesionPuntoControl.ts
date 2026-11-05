import type { PuntoControlEjercicio } from "./sesionEjercicio"
import type { IdFuncionCognitiva } from "./resultados"

interface InstanciaEjercicio {
  id: string
  cognitiveFunctionId: IdFuncionCognitiva
  payload: unknown
}

const fases: Record<InstanciaEjercicio["cognitiveFunctionId"], string[]> = {
  memory: ["ready", "presentation", "response", "feedback", "saving"],
  language: ["question", "feedback", "saving"],
  calculation: ["question", "feedback", "saving"],
  attentionRecognition: [
    "preview",
    "movement",
    "question",
    "feedback",
    "saving",
  ],
  speed: ["waiting", "arming", "question", "feedback", "saving"],
}

function validarJson(valor: unknown, profundidad = 0): void {
  if (profundidad > 12) throw new Error("Estado demasiado complejo.")
  if (valor === null || typeof valor === "boolean") return
  if (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    Math.abs(valor) <= 100000000
  )
    return
  if (typeof valor === "string" && valor.length <= 2000) return
  if (Array.isArray(valor) && valor.length <= 10000) {
    valor.forEach((elemento) => validarJson(elemento, profundidad + 1))
    return
  }
  if (
    valor &&
    typeof valor === "object" &&
    Object.getPrototypeOf(valor) === Object.prototype
  ) {
    for (const [clave, elemento] of Object.entries(valor)) {
      if (["__proto__", "constructor", "prototype"].includes(clave))
        throw new Error("Campo de estado inválido.")
      validarJson(elemento, profundidad + 1)
    }
    return
  }
  throw new Error("Estado inválido.")
}

export function validarPuntoControl(
  ejercicio: InstanciaEjercicio,
  valor: unknown,
): PuntoControlEjercicio {
  validarJson(valor)
  if (!valor || typeof valor !== "object" || Array.isArray(valor))
    throw new Error("Estado inválido.")
  const entrada = valor as PuntoControlEjercicio
  const contenido = ejercicio.payload as {
    rounds?: unknown[]
    questions?: unknown[]
    trials?: unknown[]
  }
  const pasos =
    (contenido.rounds ?? contenido.trials ?? contenido.questions)?.length || 1
  if (
    entrada.version !== 1 ||
    entrada.exerciseId !== ejercicio.id ||
    !fases[ejercicio.cognitiveFunctionId].includes(entrada.phase) ||
    !Number.isInteger(entrada.step) ||
    entrada.step < 0 ||
    entrada.step >= pasos ||
    !Number.isFinite(entrada.activeSeconds) ||
    entrada.activeSeconds < 0 ||
    entrada.activeSeconds > 86400 ||
    !entrada.state ||
    typeof entrada.state !== "object" ||
    Array.isArray(entrada.state) ||
    new TextEncoder().encode(JSON.stringify(entrada)).length > 120000
  )
    throw new Error("Punto de recuperación inválido.")
  validarEjercicioEstado(ejercicio, entrada.state)
  if (
    typeof entrada.state.questionStart === "number" &&
    entrada.state.questionStart > entrada.activeSeconds + 0.000001
  )
    throw new Error("El tiempo de la pregunta supera el tiempo acumulado.")
  if (
    entrada.sequence !== undefined &&
    (!Number.isSafeInteger(entrada.sequence) || entrada.sequence < 0)
  )
    throw new Error("Versión de estado inválida.")
  return {
    ...(entrada.sequence !== undefined ? { sequence: entrada.sequence } : {}),
    version: 1,
    exerciseId: ejercicio.id,
    phase: entrada.phase,
    step: entrada.step,
    activeSeconds: entrada.activeSeconds,
    state: entrada.state,
  }
}

function validarEjercicioEstado(
  ejercicio: InstanciaEjercicio,
  estado: Record<string, unknown>,
) {
  const cadena = (clave: string) => {
    if (typeof estado[clave] !== "string")
      throw new Error("Texto de estado inválido.")
  }
  const arreglo = (clave: string) => {
    if (!Array.isArray(estado[clave]))
      throw new Error("Lista de estado inválida.")
    return estado[clave] as unknown[]
  }
  const noNegativo = (clave: string) => {
    if (
      typeof estado[clave] !== "number" ||
      !Number.isFinite(estado[clave]) ||
      Number(estado[clave]) < 0 ||
      Number(estado[clave]) > 86400000
    )
      throw new Error("Tiempo de estado inválido.")
  }
  cadena("feedback")
  if (typeof estado.locked !== "boolean" || !("pending" in estado))
    throw new Error("Estado incompleto.")
  arreglo("answers")
  if (ejercicio.cognitiveFunctionId === "memory") {
    for (const clave of ["selected", "matched", "reveal"]) arreglo(clave)
    noNegativo("phaseElapsed")
    if (
      (estado.selected as unknown[]).some(
        (elemento) => typeof elemento !== "string",
      ) ||
      (estado.answers as unknown[]).some(
        (elemento) =>
          !Array.isArray(elemento) ||
          elemento.some((valor) => typeof valor !== "string"),
      )
    )
      throw new Error("Respuestas de memoria inválidas.")
    const instancia = ejercicio.payload as { rounds: { options: string[] }[] }
    for (const clave of ["matched", "reveal"])
      if (
        (estado[clave] as unknown[]).some(
          (elemento) =>
            !Number.isInteger(elemento) ||
            Number(elemento) < 0 ||
            Number(elemento) >= instancia.rounds[0].options.length,
        )
      )
        throw new Error("Tarjetas inválidas.")
    return
  }
  if (ejercicio.cognitiveFunctionId === "speed") {
    noNegativo("waiting")
    const instancia = ejercicio.payload as { trials: { id: string }[] }
    if (
      (estado.answers as { trialId?: string }[]).some(
        (elemento) =>
          !elemento ||
          !instancia.trials.some((ensayo) => ensayo.id === elemento.trialId),
      )
    )
      throw new Error("Ensayos inválidos.")
    return
  }
  noNegativo("questionStart")
  if (ejercicio.cognitiveFunctionId === "language") {
    if (estado.selected !== null && typeof estado.selected !== "string")
      throw new Error("Selección inválida.")
    const crucigrama = estado.crossword
    if (crucigrama !== null) {
      if (
        !crucigrama ||
        typeof crucigrama !== "object" ||
        Array.isArray(crucigrama)
      )
        throw new Error("Crucigrama inválido.")
      const tablero = crucigrama as Record<string, unknown>
      if (
        typeof tablero.selectedId !== "string" ||
        typeof tablero.feedback !== "string" ||
        !tablero.letters ||
        !tablero.attempts ||
        !tablero.finished ||
        [tablero.letters, tablero.attempts, tablero.finished].some(
          (elemento) => typeof elemento !== "object" || Array.isArray(elemento),
        )
      )
        throw new Error("Crucigrama incompleto.")
      const definicionCrucigrama = (ejercicio.payload as {
        puzzle?: { words: { id: string }[] }
      }).puzzle
      if (
        !definicionCrucigrama ||
        !definicionCrucigrama.words.some(
          (palabra) => palabra.id === tablero.selectedId,
        )
      )
        throw new Error("Pista inválida.")
      if (
        Object.values(tablero.letters as Record<string, unknown>).some(
          (letra) => typeof letra !== "string" || letra.length > 1,
        )
      )
        throw new Error("Letra inválida.")
      if (
        Object.entries(tablero.attempts as Record<string, unknown>).some(
          ([id, intentos]) =>
            !definicionCrucigrama.words.some((palabra) => palabra.id === id) ||
            !Array.isArray(intentos) ||
            intentos.length > 3 ||
            intentos.some((respuesta) => typeof respuesta !== "string"),
        )
      )
        throw new Error("Intentos inválidos.")
      if (
        Object.entries(tablero.finished as Record<string, unknown>).some(
          ([id, estado]) =>
            !definicionCrucigrama.words.some((palabra) => palabra.id === id) ||
            !["solved", "revealed"].includes(String(estado)),
        )
      )
        throw new Error("Palabra inválida.")
    }
  } else if (ejercicio.cognitiveFunctionId === "calculation") {
    cadena("numericValue")
    arreglo("selectedOrder")
    if (
      (estado.selectedOrder as unknown[]).some(
        (elemento) => typeof elemento !== "number",
      )
    )
      throw new Error("Orden inválido.")
    if (
      estado.selectedOption !== null &&
      typeof estado.selectedOption !== "number"
    )
      throw new Error("Opción inválida.")
  } else {
    arreglo("selected")
    arreglo("attempts")
    noNegativo("elapsed")
    if (
      [...estado.selected as unknown[], ...estado.attempts as unknown[]].some(
        (elemento) => !Number.isInteger(elemento) || Number(elemento) < 0,
      )
    )
      throw new Error("Selección inválida.")
    if (estado.choice !== null && typeof estado.choice !== "string")
      throw new Error("Opción inválida.")
  }
}
