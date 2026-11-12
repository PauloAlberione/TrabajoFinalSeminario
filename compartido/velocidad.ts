import { tiempoEficiencia } from "./medicionTiempo"
import { mezclar, type Nivel } from "./memoria"
import { generarComparaciones } from "./velocidad/comparaciones"
import { respuestaVelocidadValida } from "./velocidad/respuestas"
export {
  coloresSolicitados,
  respuestaVelocidadValida,
  etiquetaRespuestaVelocidad,
} from "./velocidad/respuestas"
import {
  clasificacionCategorias,
  clasificacionElementos,
  velocidadColores,
} from "./velocidad/contenido"
import type {
  TipoVelocidad,
  VelocidadConfiguracion,
  VelocidadInstancia,
  VelocidadEnsayo,
  EntregaVelocidad,
  VelocidadDetalles,
  VelocidadEnsayoResultado,
} from "./velocidad/tipos"

export type * from "./velocidad/tipos"

export {
  velocidadColores,
  clasificacionElementos,
  clasificacionCategorias,
} from "./velocidad/contenido"

export const tiposVelocidad: TipoVelocidad[] = [
  "quickResponse",
  "touchColor",
  "quickClassification",
  "visualReaction",
]
export const nombresVelocidad: Record<TipoVelocidad, string> = {
  quickResponse: "Respuesta rápida",
  touchColor: "Toca el color correcto",
  quickClassification: "Clasificar rápido",
  visualReaction: "Reacción visual",
}
export const velocidadInstrucciones: Record<TipoVelocidad, string> = {
  quickResponse:
    "Compará las figuras de los dos grupos y elegí IGUALES si coinciden todas en la misma posición, o DIFERENTES si cambia alguna. En los niveles avanzados se comparan más figuras y sus atributos. Se acepta solo la primera respuesta. Si se termina el tiempo, la ronda cuenta como un error.",
  touchColor:
    "Leé el color solicitado y tocá el botón correspondiente. En Muy difícil se piden dos colores: tocálos en el orden indicado, sin confirmar entre ambos. Los botones también tienen el nombre del color. Si se termina el tiempo, la ronda cuenta como un error.",
  quickClassification:
    "Leé la palabra y elegí la categoría a la que pertenece. Se acepta solo la primera respuesta. Si se termina el tiempo, la ronda cuenta como un error.",
  visualReaction:
    "Esperá la señal sin tocar el área de juego. Cuando aparezca ¡TOCÁ AHORA!, tocá esa señal. En los niveles superiores también aparecen botones NO TOCAR: son distractores y tocarlos cuenta como error. Tocar antes o dejar pasar el tiempo cuenta como un error. También podés usar Enter o la barra espaciadora sobre la señal.",
}

function configuraciones(
  alternativas: number[],
  ajustes: {
    reaccion?: boolean
    limites?: number[]
    esperados?: number[]
    comparaciones?: number[]
    selecciones?: number[]
  } = {},
): Record<Nivel, VelocidadConfiguracion> {
  return Object.fromEntries(
    (["easy", "normal", "hard", "veryHard"] as const).map((nivel, indice) => {
      const cantidad = (ajustes.reaccion ? 6 : 8) + indice * 2
      const esperadoMs = (ajustes.esperados ?? [4000, 3500, 3000, 2500])[indice]
      return [
        nivel,
        {
          questionCount: cantidad,
          timeoutMs: (ajustes.limites ?? [8000, 7000, 6000, 5000])[indice],
          expectedResponseMs: esperadoMs,
          optionCount: alternativas[indice],
          waitMinimumMs: ajustes.reaccion ? 1500 : 0,
          waitMaximumMs: ajustes.reaccion ? 3500 : 0,
          targetTimeSeconds: (cantidad * esperadoMs) / 1000,
          comparisonCount: ajustes.comparaciones?.[indice] ?? 1,
          selectionCount: ajustes.selecciones?.[indice] ?? 1,
        },
      ]
    }),
  ) as Record<Nivel, VelocidadConfiguracion>
}

export const velocidadConfiguraciones: Record<TipoVelocidad, Record<Nivel, VelocidadConfiguracion>> =
  {
    quickResponse: configuraciones([2, 2, 2, 2], {
      comparaciones: [1, 1, 2, 3],
      limites: [8000, 7000, 9000, 11000],
      esperados: [4000, 3500, 4500, 5500],
    }),
    touchColor: configuraciones([3, 4, 6, 8], {
      selecciones: [1, 1, 1, 2],
      limites: [8000, 7000, 6000, 8000],
      esperados: [4000, 3500, 3000, 4500],
    }),
    quickClassification: configuraciones([2, 2, 3, 4]),
    visualReaction: configuraciones([1, 2, 3, 4], {
      reaccion: true,
      limites: [4500, 4500, 5000, 5500],
      esperados: [1500, 1600, 1800, 2000],
    }),
  }

export function generarVelocidad(
  tipo: TipoVelocidad,
  nivel: Nivel,
): VelocidadInstancia {
  const configuracion = velocidadConfiguraciones[tipo][nivel]
  const categorias = clasificacionCategorias.slice(0, configuracion.optionCount)
  const bancoDisponible = clasificacionElementos.filter(
    (elemento) =>
      categorias.includes(elemento.category) &&
      (nivel !== "easy" || elemento.familiar),
  )
  const banco = mezclar(
    nivel === "easy"
      ? bancoDisponible
      : bancoDisponible.filter((elemento) => !elemento.familiar),
  )
  const coincidencia = mezclar(
    Array.from(
      { length: configuracion.questionCount },
      (_, indice) => indice % 2 === 0,
    ),
  )
  const colores = velocidadColores.slice(0, configuracion.optionCount)
  const ensayos: VelocidadEnsayo[] = Array.from(
    { length: configuracion.questionCount },
    (_, indice) => {
      const id = `${tipo}-${indice}`
      switch (tipo) {
        case "quickResponse": {
          const parejas = generarComparaciones(
            nivel,
            configuracion.comparisonCount ?? 1,
            coincidencia[indice],
            indice,
          )
          return {
            id,
            kind: tipo,
            pair: parejas[0],
            comparisonPairs: parejas,
            expectedAnswer: coincidencia[indice] ? "IGUALES" : "DIFERENTES",
            options: ["IGUALES", "DIFERENTES"],
          }
        }
        case "touchColor": {
          let opciones = mezclar(colores.map((color) => color.id))
          if (indice % 2) opciones = opciones.slice(1).concat(opciones[0])
          const solicitados = Array.from(
            { length: configuracion.selectionCount ?? 1 },
            (_, posicion) => colores[(indice + posicion) % colores.length].id,
          )
          return {
            id,
            kind: tipo,
            requestedColor: solicitados[0],
            requestedColors: solicitados,
            expectedAnswer: solicitados.join("|"),
            options: opciones,
          }
        }
        case "quickClassification": {
          const elemento = banco[indice]
          return {
            id,
            kind: tipo,
            itemId: elemento.id,
            label: elemento.label,
            expectedAnswer: elemento.category,
            options: mezclar(categorias),
          }
        }
        case "visualReaction":
          return {
            id,
            kind: tipo,
            waitingMs:
              configuracion.waitMinimumMs +
              Math.floor(
                Math.random() *
                  (configuracion.waitMaximumMs -
                    configuracion.waitMinimumMs +
                    1),
              ),
            position:
              nivel === "easy" || nivel === "normal"
                ? "center"
                : (["left", "center", "right"] as const)[indice % 3],
            expectedAnswer: "react",
            options: mezclar([
              "react",
              ...Array.from(
                { length: configuracion.optionCount - 1 },
                (_, posicion) => `distractor-${posicion}`,
              ),
            ]),
          }
      }
    },
  )
  // Evita repetir por azar el mismo orden de colores en ensayos consecutivos.
  for (let indice = 1; indice < ensayos.length; indice++)
    if (
      tipo === "touchColor" &&
      ensayos[indice].options.join() === ensayos[indice - 1].options.join()
    )
      ensayos[indice].options.push(ensayos[indice].options.shift()!)
  return { type: tipo, level: nivel, config: configuracion, trials: ensayos }
}

export function evaluarVelocidad(
  instancia: VelocidadInstancia,
  respuesta: unknown,
) {
  if (!respuesta || typeof respuesta !== "object")
    throw new Error("Respuesta inválida.")
  const entrada = respuesta as Partial<EntregaVelocidad>
  if (
    !Array.isArray(entrada.answers) ||
    entrada.answers.length !== instancia.trials.length ||
    entrada.answers.some(
      (respuesta) => !respuesta || typeof respuesta.trialId !== "string",
    ) ||
    new Set(entrada.answers.map((respuesta) => respuesta.trialId)).size !==
      instancia.trials.length
  )
    throw new Error("Rondas incompletas.")
  const ensayoResultados: VelocidadEnsayoResultado[] = instancia.trials.map(
    (ensayo, indice) => {
      const respuesta = entrada.answers!.find(
        (respuesta) => respuesta.trialId === ensayo.id,
      )
      if (
        !respuesta ||
        !["answered", "timeout", "falseStart"].includes(respuesta.status)
      )
        throw new Error("Ronda inválida.")
      const tiempo = respuesta.responseTimeMs
      if (
        respuesta.selectedAnswers !== undefined &&
        (ensayo.kind !== "touchColor" ||
          !Array.isArray(respuesta.selectedAnswers) ||
          respuesta.selectedAnswers.length >
            (ensayo.requestedColors?.length ?? 1) ||
          new Set(respuesta.selectedAnswers).size !==
            respuesta.selectedAnswers.length ||
          respuesta.selectedAnswers.some(
            (color) =>
              typeof color !== "string" || !ensayo.options.includes(color),
          ) ||
          (respuesta.status === "answered" &&
            respuesta.selectedAnswers.join("|") !== respuesta.submittedAnswer))
      )
        throw new Error("Selecciones de colores inválidas.")
      if (respuesta.status === "answered") {
        if (
          typeof respuesta.submittedAnswer !== "string" ||
          !respuestaVelocidadValida(ensayo, respuesta.submittedAnswer) ||
          typeof tiempo !== "number" ||
          !Number.isFinite(tiempo) ||
          tiempo <= 0 ||
          tiempo > instancia.config.timeoutMs
        )
          throw new Error("Respuesta inválida.")
      } else if (respuesta.status === "timeout") {
        if (
          respuesta.submittedAnswer !== null ||
          tiempo !== instancia.config.timeoutMs
        )
          throw new Error("Vencimiento inválido.")
      } else if (
        instancia.type !== "visualReaction" ||
        respuesta.submittedAnswer !== null ||
        tiempo !== null
      )
        throw new Error("Salida anticipada inválida.")
      return {
        trialId: respuesta.trialId,
        status: respuesta.status,
        submittedAnswer: respuesta.submittedAnswer,
        responseTimeMs: respuesta.responseTimeMs,
        ...(respuesta.selectedAnswers
          ? { selectedAnswers: respuesta.selectedAnswers }
          : {}),
        trialNumber: indice + 1,
        stimulusId:
          ensayo.kind === "quickClassification" ? ensayo.itemId : ensayo.id,
        expectedAnswer: ensayo.expectedAnswer,
        correct:
          respuesta.status === "answered" &&
          respuesta.submittedAnswer === ensayo.expectedAnswer,
        timeout: respuesta.status === "timeout",
        falseStart: respuesta.status === "falseStart",
        effectiveTimeMs: respuesta.status === "falseStart" ? 0 : tiempo!,
      }
    },
  )
  const efectivoRespuestaTiempoSegundos =
    ensayoResultados.reduce(
      (suma, resultado) => suma + resultado.effectiveTimeMs,
      0,
    ) / 1000
  if (
    typeof entrada.actualResponseTimeSeconds !== "number" ||
    !Number.isFinite(entrada.actualResponseTimeSeconds) ||
    entrada.actualResponseTimeSeconds < 0 ||
    Math.abs(
      entrada.actualResponseTimeSeconds - efectivoRespuestaTiempoSegundos,
    ) > 0.001
  )
    throw new Error("Los tiempos no coinciden.")
  const respuestasCorrectas = ensayoResultados.filter(
      (resultado) => resultado.correct,
    ).length,
    errores = ensayoResultados.length - respuestasCorrectas
  const tiempos = ensayoResultados
    .filter(
      (resultado) =>
        resultado.status === "answered" &&
        (instancia.type !== "visualReaction" || resultado.correct),
    )
    .map((resultado) => resultado.responseTimeMs!)
    .sort((izquierda, derecha) => izquierda - derecha)
  const promedioRespuestaTiempoMs = tiempos.length
    ? tiempos.reduce((suma, tiempo) => suma + tiempo, 0) / tiempos.length
    : null
  const respuestaTiempoEficiencia =
    ensayoResultados.reduce(
      (suma, resultado) =>
        suma +
        (resultado.status === "answered" &&
        (instancia.type !== "visualReaction" || resultado.correct)
          ? tiempoEficiencia(
              resultado.responseTimeMs! / 1000,
              instancia.config.expectedResponseMs / 1000,
            )
          : 0),
      0,
    ) / ensayoResultados.length
  const comun = {
    optionCount: instancia.trials[0].options.length,
    ...(instancia.trials[0].kind === "touchColor"
      ? { selectionCount: instancia.trials[0].requestedColors?.length ?? 1 }
      : {}),
    ...(instancia.trials[0].kind === "quickResponse"
      ? { comparisonCount: instancia.trials[0].comparisonPairs?.length ?? 1 }
      : {}),
    totalTrials: ensayoResultados.length,
    attempts: ensayoResultados.filter(
      (resultado) => resultado.status !== "timeout",
    ).length,
    correctAnswers: respuestasCorrectas,
    incorrectAnswers: errores,
    timeouts: ensayoResultados.filter((resultado) => resultado.timeout).length,
    falseStarts: ensayoResultados.filter((resultado) => resultado.falseStart)
      .length,
    averageResponseTimeMs: promedioRespuestaTiempoMs,
    effectiveTimeSeconds: efectivoRespuestaTiempoSegundos,
    trialResults: ensayoResultados,
  }
  const detalles: VelocidadDetalles =
    instancia.type === "visualReaction"
      ? {
          ...comun,
          exerciseType: instancia.type,
          validReactions: tiempos.length,
          medianResponseTimeMs: tiempos.length
            ? (tiempos[Math.floor((tiempos.length - 1) / 2)] +
                tiempos[Math.floor(tiempos.length / 2)]) /
              2
            : null,
          fastestResponseTimeMs: tiempos[0] ?? null,
        }
      : { ...comun, exerciseType: instancia.type }
  return {
    ...comun,
    correctAnswers: respuestasCorrectas,
    errors: errores,
    totalQuestions: ensayoResultados.length,
    accuracy: (respuestasCorrectas / ensayoResultados.length) * 100,
    actualTimeSeconds: efectivoRespuestaTiempoSegundos,
    actualResponseTimeSeconds: efectivoRespuestaTiempoSegundos,
    targetTimeSeconds: instancia.config.targetTimeSeconds,
    responseTimeEfficiency: respuestaTiempoEficiencia,
    details: detalles,
  }
}
