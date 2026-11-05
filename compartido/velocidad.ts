import { tiempoEficiencia } from "./medicionTiempo"
import { mezclar, type Nivel } from "./memoria"
import { visualConjunto } from "./atencionReconocimiento/generacion"
import { visualClave } from "./atencionReconocimiento"
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
    "Observá las dos figuras y elegí IGUALES o DIFERENTES. Se acepta solo la primera respuesta. Si se termina el tiempo, la ronda cuenta como un error.",
  touchColor:
    "Leé el color solicitado y tocá el botón correspondiente. Los botones también tienen el nombre del color. Si se termina el tiempo, la ronda cuenta como un error.",
  quickClassification:
    "Leé la palabra y elegí la categoría a la que pertenece. Se acepta solo la primera respuesta. Si se termina el tiempo, la ronda cuenta como un error.",
  visualReaction:
    "Esperá la señal sin tocar el área de juego. Cuando aparezca ¡TOCÁ AHORA!, tocá la señal. Tocar antes o dejar pasar el tiempo cuenta como un error. También podés usar Enter o la barra espaciadora sobre la señal.",
}

function configuraciones(
  reaccion: boolean,
  alternativas: number[],
): Record<Nivel, VelocidadConfiguracion> {
  return Object.fromEntries(
    (["easy", "normal", "hard", "veryHard"] as const).map((nivel, indice) => {
      const preguntaCantidad = (reaccion ? 6 : 8) + indice * 2
      const esperadoRespuestaMs = reaccion
        ? [1500, 1250, 1000, 800][indice]
        : [4000, 3500, 3000, 2500][indice]
      return [
        nivel,
        {
          questionCount: preguntaCantidad,
          timeoutMs: reaccion ? 4500 - indice * 500 : 8000 - indice * 1000,
          expectedResponseMs: esperadoRespuestaMs,
          optionCount: alternativas[indice],
          waitMinimumMs: reaccion ? 1500 : 0,
          waitMaximumMs: reaccion ? 3500 : 0,
          targetTimeSeconds: (preguntaCantidad * esperadoRespuestaMs) / 1000,
        },
      ]
    }),
  ) as Record<Nivel, VelocidadConfiguracion>
}

export const velocidadConfiguraciones: Record<TipoVelocidad, Record<Nivel, VelocidadConfiguracion>> =
  {
    quickResponse: configuraciones(false, [2, 2, 2, 2]),
    touchColor: configuraciones(false, [3, 4, 5, 6]),
    quickClassification: configuraciones(false, [2, 2, 3, 4]),
    visualReaction: configuraciones(true, [1, 1, 1, 1]),
  }

export function generarVelocidad(
  tipo: TipoVelocidad,
  nivel: Nivel,
): VelocidadInstancia {
  const configuracion = velocidadConfiguraciones[tipo][nivel]
  const conjunto = mezclar(visualConjunto(nivel))
  const categorias = clasificacionCategorias.slice(0, configuracion.optionCount)
  const banco = mezclar(
    clasificacionElementos.filter(
      (elemento) =>
        categorias.includes(elemento.category) &&
        (nivel !== "easy" || elemento.familiar),
    ),
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
          const primero = conjunto[indice % conjunto.length],
            segundo = coincidencia[indice]
              ? primero
              : conjunto[(indice + 1) % conjunto.length]
          return {
            id,
            kind: tipo,
            pair: [primero, segundo],
            expectedAnswer:
              visualClave(primero) === visualClave(segundo)
                ? "IGUALES"
                : "DIFERENTES",
            options: ["IGUALES", "DIFERENTES"],
          }
        }
        case "touchColor": {
          let opciones = mezclar(colores.map((color) => color.id))
          if (indice % 2) opciones = opciones.slice(1).concat(opciones[0])
          return {
            id,
            kind: tipo,
            requestedColor: colores[indice % colores.length].id,
            expectedAnswer: colores[indice % colores.length].id,
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
            options: ["react"],
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
      if (respuesta.status === "answered") {
        if (
          typeof respuesta.submittedAnswer !== "string" ||
          !ensayo.options.includes(respuesta.submittedAnswer) ||
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
    .filter((resultado) => resultado.status === "answered")
    .map((resultado) => resultado.responseTimeMs!)
    .sort((izquierda, derecha) => izquierda - derecha)
  const promedioRespuestaTiempoMs = tiempos.length
    ? tiempos.reduce((suma, tiempo) => suma + tiempo, 0) / tiempos.length
    : null
  const respuestaTiempoEficiencia =
    ensayoResultados.reduce(
      (suma, resultado) =>
        suma +
        (resultado.status === "answered"
          ? tiempoEficiencia(
              resultado.responseTimeMs! / 1000,
              instancia.config.expectedResponseMs / 1000,
            )
          : 0),
      0,
    ) / ensayoResultados.length
  const comun = {
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
