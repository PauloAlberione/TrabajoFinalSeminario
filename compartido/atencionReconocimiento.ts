import type { Nivel } from "./memoria"
import {
  generarBuscar,
  generarSeguimiento,
  generarPatrones,
  visualClave,
} from "./atencionReconocimiento/generacion"
import type {
  TipoAtencion,
  AtencionConfiguracion,
  AtencionInstancia,
  AtencionRespuesta,
  AtencionDetalles,
} from "./atencionReconocimiento/tipos"

export type * from "./atencionReconocimiento/tipos"

export {
  visualClave,
  seguimientoPosicion,
} from "./atencionReconocimiento/generacion"

export const tiposAtencion: TipoAtencion[] = [
  "identifyElements",
  "followObject",
  "recognizePattern",
  "hiddenFigure",
]
export const nombresAtencion: Record<TipoAtencion, string> = {
  identifyElements: "Identificar elementos",
  followObject: "Seguir el objeto",
  recognizePattern: "Reconoce el patrón",
  hiddenFigure: "Figura oculta",
}
export const atencionInstrucciones: Record<TipoAtencion, string> = {
  identifyElements:
    "Buscá todos los elementos iguales a la muestra. La muestra permanece visible. Podés seleccionar y deseleccionar antes de confirmar.",
  followObject:
    "Observá el objeto marcado durante la preparación. Cuando desaparezca la marca, seguí su movimiento. Al detenerse, seleccioná el objeto que seguiste y confirmá.",
  recognizePattern:
    "Observá cómo se repiten o cambian las figuras. Elegí la figura que falta y confirmá. Podés cambiar tu selección antes de confirmar.",
  hiddenFigure:
    "Buscá la única figura igual a la muestra y seleccionála. Si te equivocás, podés volver a intentar. Después de tres intentos incorrectos se mostrará la figura.",
}
const base: AtencionConfiguracion = {
  questionCount: 0,
  targetTimeSeconds: 0,
  elementCount: 0,
  targetCount: 0,
  optionCount: 0,
  previewSeconds: 0,
  movementSeconds: 0,
  movementComplexity: 0,
  patternLength: 0,
  patterns: [],
}

function configuraciones(
  valores: Partial<AtencionConfiguracion>[],
): Record<Nivel, AtencionConfiguracion> {
  return Object.fromEntries(
    (["easy", "normal", "hard", "veryHard"] as const).map((nivel, indice) => [
      nivel,
      { ...base, ...valores[indice] },
    ]),
  ) as Record<Nivel, AtencionConfiguracion>
}

export const atencionConfiguraciones: Record<TipoAtencion, Record<Nivel, AtencionConfiguracion>> =
  {
    identifyElements: configuraciones([
      {
        questionCount: 5,
        elementCount: 12,
        targetCount: 2,
        targetTimeSeconds: 70,
      },
      {
        questionCount: 6,
        elementCount: 16,
        targetCount: 3,
        targetTimeSeconds: 90,
      },
      {
        questionCount: 7,
        elementCount: 24,
        targetCount: 4,
        targetTimeSeconds: 120,
      },
      {
        questionCount: 8,
        elementCount: 30,
        targetCount: 5,
        targetTimeSeconds: 150,
      },
    ]),
    followObject: configuraciones([
      {
        questionCount: 5,
        elementCount: 3,
        previewSeconds: 3,
        movementSeconds: 4,
        movementComplexity: 2,
        targetTimeSeconds: 30,
      },
      {
        questionCount: 6,
        elementCount: 4,
        previewSeconds: 3,
        movementSeconds: 5,
        movementComplexity: 3,
        targetTimeSeconds: 38,
      },
      {
        questionCount: 7,
        elementCount: 5,
        previewSeconds: 2.5,
        movementSeconds: 6,
        movementComplexity: 4,
        targetTimeSeconds: 48,
      },
      {
        questionCount: 8,
        elementCount: 6,
        previewSeconds: 2,
        movementSeconds: 7,
        movementComplexity: 5,
        targetTimeSeconds: 58,
      },
    ]),
    recognizePattern: configuraciones([
      {
        questionCount: 8,
        patternLength: 4,
        optionCount: 4,
        patterns: ["alternating", "repeatingGroup", "orientationCycle"],
        targetTimeSeconds: 70,
      },
      {
        questionCount: 10,
        patternLength: 5,
        optionCount: 4,
        patterns: ["repeatingGroup", "orientationCycle", "sizeAlternation"],
        targetTimeSeconds: 88,
      },
      {
        questionCount: 12,
        patternLength: 6,
        optionCount: 5,
        patterns: ["repeatingGroup", "orientationCycle", "dualAttribute"],
        targetTimeSeconds: 110,
      },
      {
        questionCount: 14,
        patternLength: 7,
        optionCount: 6,
        patterns: ["repeatingGroup", "dualAttribute", "sizeAlternation"],
        targetTimeSeconds: 130,
      },
    ]),
    hiddenFigure: configuraciones([
      {
        questionCount: 6,
        elementCount: 12,
        targetCount: 1,
        targetTimeSeconds: 70,
      },
      {
        questionCount: 7,
        elementCount: 18,
        targetCount: 1,
        targetTimeSeconds: 90,
      },
      {
        questionCount: 8,
        elementCount: 24,
        targetCount: 1,
        targetTimeSeconds: 115,
      },
      {
        questionCount: 9,
        elementCount: 30,
        targetCount: 1,
        targetTimeSeconds: 140,
      },
    ]),
  }

export function generarAtencion(
  tipo: TipoAtencion,
  nivel: Nivel,
): AtencionInstancia {
  const configuracion = atencionConfiguraciones[tipo][nivel]
  if (tipo === "followObject")
    return {
      type: tipo,
      level: nivel,
      config: configuracion,
      rounds: generarSeguimiento(nivel, configuracion),
    }
  if (tipo === "recognizePattern")
    return {
      type: tipo,
      level: nivel,
      config: configuracion,
      rounds: generarPatrones(nivel, configuracion),
    }
  return {
    type: tipo,
    level: nivel,
    config: configuracion,
    rounds: generarBuscar(nivel, configuracion),
  }
}

export function evaluarAtencion(
  instancia: AtencionInstancia,
  respuesta: unknown,
) {
  if (!respuesta || typeof respuesta !== "object")
    throw new Error("Respuesta inválida.")
  const entrada = respuesta as {
    answers?: AtencionRespuesta[]
    actualResponseTimeSeconds?: number
  }
  const tiempo = entrada.actualResponseTimeSeconds
  if (
    typeof tiempo !== "number" ||
    !Number.isFinite(tiempo) ||
    tiempo <= 0 ||
    tiempo > 86400
  )
    throw new Error("Tiempo inválido.")
  if (
    !Array.isArray(entrada.answers) ||
    entrada.answers.length !== instancia.rounds.length ||
    entrada.answers.some(
      (respuesta) =>
        !respuesta ||
        typeof respuesta.roundId !== "string" ||
        !Number.isFinite(respuesta.responseTimeSeconds) ||
        respuesta.responseTimeSeconds <= 0,
    ) ||
    new Set(entrada.answers.map((respuesta) => respuesta.roundId)).size !==
      instancia.rounds.length
  )
    throw new Error("Respuestas inválidas.")
  if (
    Math.abs(
      entrada.answers.reduce(
        (suma, respuesta) => suma + respuesta.responseTimeSeconds,
        0,
      ) - tiempo,
    ) > 0.1
  )
    throw new Error("Los tiempos no coinciden.")
  let correcto = 0,
    errores = 0,
    omitido = 0,
    falsoPositivos = 0,
    perfecto = 0,
    encontrado = 0,
    incorrecto = 0,
    mostrado = 0
  for (const ronda of instancia.rounds) {
    const seleccion = entrada.answers.find(
      (respuesta) => respuesta.roundId === ronda.id,
    )?.selection
    if (instancia.type === "followObject" && "objects" in ronda) {
      if (
        typeof seleccion !== "string" ||
        !ronda.objects.some((objeto) => objeto.id === seleccion)
      )
        throw new Error("Objeto inválido.")
      if (seleccion === ronda.targetId) correcto++
      else errores++
    } else if (instancia.type === "recognizePattern" && "options" in ronda) {
      if (
        typeof seleccion !== "string" ||
        !ronda.options.some((opcion) => visualClave(opcion) === seleccion)
      )
        throw new Error("Opción inválida.")
      if (seleccion === visualClave(ronda.correctAnswer)) correcto++
      else errores++
    } else if ("items" in ronda) {
      if (
        !Array.isArray(seleccion) ||
        seleccion.some(
          (indice) =>
            !Number.isInteger(indice) ||
            indice < 0 ||
            indice >= ronda.items.length,
        )
      )
        throw new Error("Selección inválida.")
      if (instancia.type === "identifyElements") {
        if (new Set(seleccion).size !== seleccion.length)
          throw new Error("Selección repetida.")
        const aciertos = seleccion.filter((indice) =>
          ronda.targetIndices.includes(indice),
        ).length
        const fallos = ronda.targetIndices.length - aciertos,
          extra = seleccion.length - aciertos
        correcto += aciertos
        omitido += fallos
        falsoPositivos += extra
        perfecto += Number(fallos + extra === 0)
      } else {
        if (
          seleccion.length < 1 ||
          seleccion.length > 3 ||
          new Set(seleccion).size !== seleccion.length
        )
          throw new Error("Intentos inválidos.")
        const acierto = seleccion.indexOf(ronda.targetIndices[0])
        if (
          (acierto >= 0 && acierto !== seleccion.length - 1) ||
          (acierto < 0 && seleccion.length !== 3)
        )
          throw new Error("Ronda incompleta.")
        correcto += Number(acierto === 0)
        encontrado += Number(acierto >= 0)
        incorrecto += acierto >= 0 ? acierto : 3
        mostrado += Number(acierto < 0)
      }
    }
  }
  let detalles: AtencionDetalles
  const cantidad = instancia.rounds.length
  switch (instancia.type) {
    case "identifyElements":
      errores = omitido + falsoPositivos
      detalles = {
        exerciseType: instancia.type,
        rounds: cantidad,
        totalTargets: cantidad * instancia.config.targetCount,
        correctSelections: correcto,
        missedTargets: omitido,
        falsePositiveSelections: falsoPositivos,
        perfectRounds: perfecto,
      }
      break
    case "followObject":
      detalles = {
        exerciseType: instancia.type,
        rounds: cantidad,
        correctRounds: correcto,
        incorrectRounds: errores,
        averageSelectionTime: tiempo / cantidad,
        objectCount: instancia.config.elementCount,
        movementComplexity: instancia.config.movementComplexity,
      }
      break
    case "recognizePattern":
      detalles = {
        exerciseType: instancia.type,
        questionCount: cantidad,
        correctAnswers: correcto,
        incorrectAnswers: errores,
        averageQuestionTime: tiempo / cantidad,
        patternTypesPlayed: [
          ...new Set(instancia.rounds.map((ronda) => ronda.patternType)),
        ],
      }
      break
    case "hiddenFigure":
      errores = cantidad - correcto
      detalles = {
        exerciseType: instancia.type,
        rounds: cantidad,
        figuresFound: encontrado,
        firstAttemptCorrect: correcto,
        wrongAttempts: incorrecto,
        revealedRounds: mostrado,
        averageFindTime: tiempo / cantidad,
      }
      break
  }
  const total = correcto + errores
  return {
    correctAnswers: correcto,
    errors: errores,
    totalQuestions: total,
    accuracy: total ? (correcto / total) * 100 : 0,
    actualTimeSeconds: tiempo,
    actualResponseTimeSeconds: tiempo,
    targetTimeSeconds: instancia.config.targetTimeSeconds,
    details: detalles,
  }
}
