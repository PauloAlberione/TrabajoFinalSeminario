import { Timestamp } from "firebase-admin/firestore"
import { validarPuntoControl } from "../../../compartido/sesionPuntoControl"
import {
  CATEGORIA_IDS,
  normalizarCategoria,
} from "../../../compartido/resultados"
import { DIFICULTAD_NIVELES } from "../tipos/dominio"
import type { InstanciaEjercicio } from "../tipos/ejercicios"
import type {
  ActividadCancelada,
  AvanceParcial,
  RespuestaParcial,
} from "../../../compartido/sesionesCanceladas"

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown>
    : {}
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : []
}

function texto(valor: unknown): string {
  if (typeof valor === "string" || typeof valor === "number")
    return String(valor)
  if (Array.isArray(valor)) return valor.map(texto).filter(Boolean).join(" → ")
  return ""
}

function fecha(valor: unknown): string | null {
  const marca =
    valor instanceof Timestamp
      ? valor.toDate()
      : valor instanceof Date
        ? valor
        : typeof valor === "string"
          ? new Date(valor)
          : null
  return marca && Number.isFinite(marca.getTime()) ? marca.toISOString() : null
}

function respuesta(valor: unknown, indice: number): RespuestaParcial {
  const datos = objeto(valor)
  const estado =
    datos.status === "timeout" || datos.status === "falseStart"
      ? datos.status
      : "submitted"
  const enviado =
    datos.answer ?? datos.selection ?? datos.submittedAnswer ?? valor
  const tiempo =
    typeof datos.responseTimeSeconds === "number"
      ? datos.responseTimeSeconds
      : typeof datos.responseTimeMs === "number"
        ? datos.responseTimeMs / 1000
        : undefined
  return {
    label: `Respuesta o intento ${indice + 1}`,
    response:
      estado === "timeout"
        ? "Sin respuesta dentro del tiempo"
        : estado === "falseStart"
          ? "Respuesta anticipada"
          : texto(enviado) || "Respuesta registrada sin texto",
    status: estado,
    ...(tiempo !== undefined && Number.isFinite(tiempo) && tiempo >= 0
      ? { responseTimeSeconds: tiempo }
      : {}),
  }
}

export function resumirAvanceParcial(
  ejercicio: InstanciaEjercicio,
  guardado: unknown,
  detalles = false,
): AvanceParcial | null {
  if (!guardado) return null
  let punto
  try {
    punto = validarPuntoControl(ejercicio, guardado)
  } catch {
    return null
  }
  const estado = punto.state,
    contenido = objeto(ejercicio.payload)
  const pasos = lista(
    contenido.rounds ?? contenido.questions ?? contenido.trials,
  )
  let respuestas = lista(estado.answers).map((valor, indice) => {
    const datos = objeto(valor)
    const seleccion = datos.selection
    if (
      ejercicio.cognitiveFunctionId === "attentionRecognition" &&
      Array.isArray(seleccion)
    ) {
      const posiciones = seleccion.map((valor) =>
        typeof valor === "number" ? valor + 1 : valor,
      )
      return {
        ...respuesta({ ...datos, selection: posiciones }, indice),
        response: `Posiciones elegidas: ${texto(posiciones)}`,
      }
    }
    const registro = respuesta(valor, indice)
    return ejercicio.type === "visualReaction" && datos.status === "answered"
      ? { ...registro, response: "Reacción registrada" }
      : registro
  })
  const borradores: RespuestaParcial[] = []
  const agregar = (etiqueta: string, valor: unknown) => {
    const escrito = texto(valor)
    if (escrito)
      borradores.push({ label: etiqueta, response: escrito, status: "draft" })
  }
  let descripcion: string | undefined
  if (ejercicio.type === "simpleCrossword") {
    const tablero = objeto(estado.crossword),
      palabras = lista(objeto(contenido.puzzle).words)
    respuestas = Object.entries(objeto(tablero.attempts)).flatMap(
      ([id, intentos]) => {
        const palabra = palabras
          .map(objeto)
          .find((palabra) => palabra.id === id)
        return lista(intentos).map((valor, indice) => ({
          label: `${texto(palabra?.clue) || "Pista del crucigrama"} · intento ${indice + 1}`,
          response: texto(valor),
          status: "submitted" as const,
        }))
      },
    )
    for (const [casilla, letra] of Object.entries(objeto(tablero.letters)))
      agregar(
        /^\d+-\d+$/.test(casilla)
          ? `Fila ${Number(casilla.split("-")[0]) + 1}, columna ${Number(casilla.split("-")[1]) + 1}`
          : `Casilla ${casilla}`,
        letra,
      )
    descripcion = `${Object.keys(objeto(tablero.finished)).length} pistas finalizadas de ${palabras.length}. Las letras conservadas pueden pertenecer a pistas sin finalizar.`
  } else if (ejercicio.type === "imagePairs") {
    descripcion = `${new Set(lista(estado.matched)).size} tarjetas emparejadas. Las respuestas registradas son intentos de formar parejas.`
  }
  if (
    !estado.locked &&
    ["question", "response"].includes(punto.phase) &&
    ejercicio.type !== "simpleCrossword"
  ) {
    if (ejercicio.cognitiveFunctionId === "calculation") {
      agregar("Número escrito sin enviar", estado.numericValue)
      agregar("Opción elegida sin enviar", estado.selectedOption)
      agregar("Orden elegido sin enviar", estado.selectedOrder)
    } else if (ejercicio.cognitiveFunctionId === "attentionRecognition") {
      agregar(
        "Posiciones elegidas sin enviar",
        lista(estado.selected).map((valor) =>
          typeof valor === "number" ? valor + 1 : valor,
        ),
      )
      agregar("Opción elegida sin enviar", estado.choice)
      lista(estado.attempts).forEach((valor, indice) =>
        respuestas.push({
          label: `Intento del paso actual ${indice + 1}`,
          response: `Posición elegida: ${
            typeof valor === "number" ? valor + 1 : texto(valor)
          }`,
          status: "submitted",
        }),
      )
    } else agregar("Selección sin enviar", estado.selected)
  }
  return {
    activeSeconds: punto.activeSeconds,
    step: punto.step + 1,
    totalSteps: pasos.length || 1,
    recordedResponses: respuestas.length,
    ...(descripcion ? { description: descripcion } : {}),
    ...(detalles ? { responses: respuestas, drafts: borradores } : {}),
  }
}

export function presentarCancelacion(
  id: string,
  datos: Record<string, unknown>,
  detalles = false,
): ActividadCancelada {
  const ejercicio = objeto(datos.exercise),
    contenido = objeto(ejercicio.payload)
  const categoria = CATEGORIA_IDS.find(
    (categoria) =>
      categoria === normalizarCategoria(String(ejercicio.cognitiveFunctionId)),
  )
  const nivel = DIFICULTAD_NIVELES.find((nivel) => nivel === contenido.level)
  return {
    id,
    status: "cancelled",
    exerciseName: texto(ejercicio.prompt) || "Actividad sin nombre registrado",
    exerciseType: texto(ejercicio.type),
    ...(categoria ? { cognitiveFunctionId: categoria } : {}),
    ...(nivel ? { difficultyLevel: nivel } : {}),
    startedAt: fecha(datos.startedAt),
    endedAt: fecha(datos.endedAt),
    partialProgress: categoria
      ? resumirAvanceParcial(
          {
            ...ejercicio,
            cognitiveFunctionId: categoria,
          } as unknown as InstanciaEjercicio,
          datos.checkpoint,
          detalles,
        )
      : null,
  }
}
