import { configuraciones, type TipoMemoria, type Nivel } from "./memoria"
import { lenguajeConfiguraciones, type TipoLenguaje } from "./lenguaje"
import { crucigramaCrucigramas } from "./crucigramasLenguaje"
import {
  mentalConfiguraciones,
  secuenciaConfiguraciones,
  ordenConfiguraciones,
  restaConfiguraciones,
} from "./calculo/configuraciones"
import type { TipoCalculo } from "./calculo"
import {
  atencionConfiguraciones,
  type TipoAtencion,
} from "./atencionReconocimiento"
import { velocidadConfiguraciones, type TipoVelocidad } from "./velocidad"

export type EjercicioConDificultad = TipoMemoria | TipoLenguaje | TipoCalculo | TipoAtencion | TipoVelocidad

const segundos = (milisegundos: number) =>
  `${(milisegundos / 1000).toLocaleString("es-AR")} s`

export function describirDificultad(
  tipo: EjercicioConDificultad,
  nivel: Nivel,
): string[] {
  switch (tipo) {
    case "imagePairs": {
      const configuracion = configuraciones[tipo][nivel]
      return [
        `${configuracion.size} parejas`,
        `${configuracion.size * 2} tarjetas para explorar`,
      ]
    }
    case "colorSequence": {
      const configuracion = configuraciones[tipo][nivel]
      return [
        `Secuencias de ${configuracion.size} colores`,
        `Paleta de ${configuracion.paletteSize} colores`,
        `${segundos(configuracion.presentationMs)} por color`,
      ]
    }
    case "wordList": {
      const configuracion = configuraciones[tipo][nivel]
      return [
        `${configuracion.size} palabras para recordar`,
        `${configuracion.distractors} palabras distractoras`,
        `${segundos(configuracion.presentationMs)} para memorizar`,
      ]
    }
    case "rememberOrder": {
      const configuracion = configuraciones[tipo][nivel]
      return [
        `${configuracion.size} elementos en orden`,
        `${segundos(configuracion.presentationMs)} para observar`,
      ]
    }
    case "wordAssociation":
    case "completeSentence":
    case "synonymsAntonyms": {
      const configuracion = lenguajeConfiguraciones[tipo][nivel]
      return [
        `${configuracion.optionCount} opciones por pregunta`,
        nivel === "easy"
          ? "Relaciones directas y vocabulario cotidiano"
          : nivel === "normal"
            ? "Combina preguntas directas y de contexto"
            : "Preguntas de contexto y distractores más próximos",
      ]
    }
    case "simpleCrossword": {
      const crucigramas = crucigramaCrucigramas[nivel]
      const longitud = Math.max(
        ...crucigramas.flatMap((crucigrama) =>
          crucigrama.words.map((palabra) => palabra.answer.length),
        ),
      )
      return [
        `${lenguajeConfiguraciones[tipo][nivel].questionCount} palabras entrecruzadas`,
        `Palabras de hasta ${longitud} letras`,
      ]
    }
    case "mentalCalculation": {
      const configuracion = mentalConfiguraciones[nivel]
      const operaciones = {
        addition: "sumas",
        subtraction: "restas",
        multiplication: "multiplicaciones",
        division: "divisiones",
      }
      return [
        `Números entre ${configuracion.minimum} y ${configuracion.maximum}`,
        configuracion.operations
          .map((operacion) => operaciones[operacion])
          .join(", "),
        ...(configuracion.twoStepEvery
          ? ["Incluye operaciones de dos pasos"]
          : []),
      ]
    }
    case "numberSequence": {
      const configuracion = secuenciaConfiguraciones[nivel]
      const patrones = {
        constantAdd: "sumas",
        constantSubtract: "restas",
        multiply: "multiplicaciones",
        alternating: "reglas alternadas",
        increasingDifference: "diferencias crecientes",
        mixed: "reglas combinadas",
      }
      return [
        `Secuencias de ${configuracion.lengths.join(" o ")} posiciones`,
        `${configuracion.optionCount} opciones`,
        configuracion.patterns.map((patron) => patrones[patron]).join(", "),
      ]
    }
    case "orderNumbers": {
      const configuracion = ordenConfiguraciones[nivel]
      return [
        `${configuracion.numbersPerRound} números por ronda`,
        `Rango de ${configuracion.minimum} a ${configuracion.maximum}`,
        "Orden ascendente o descendente según la consigna",
      ]
    }
    case "subtractionDifference": {
      const configuracion = restaConfiguraciones[nivel]
      return [
        `Números entre ${configuracion.minimum} y ${configuracion.maximum}`,
        configuracion.allowNegative
          ? "Las restas pueden tener resultados negativos"
          : "Restas con resultados no negativos",
      ]
    }
    case "identifyElements":
    case "hiddenFigure": {
      const configuracion = atencionConfiguraciones[tipo][nivel]
      return [
        `${configuracion.elementCount} figuras para explorar`,
        `${configuracion.targetCount} ${
          configuracion.targetCount === 1
            ? "figura objetivo"
            : "figuras objetivo"
        }`,
        nivel === "easy"
          ? "Diferencias de forma"
          : nivel === "veryHard"
            ? "Figuras de la misma forma con distintos atributos"
            : "Diferencias de forma, orientación y relleno",
      ]
    }
    case "followObject": {
      const configuracion = atencionConfiguraciones[tipo][nivel]
      return [
        `${configuracion.elementCount} objetos en movimiento`,
        `${configuracion.movementComplexity} tramos de recorrido`,
        `${configuracion.previewSeconds.toLocaleString("es-AR")} s para identificar el objeto`,
      ]
    }
    case "recognizePattern": {
      const configuracion = atencionConfiguraciones[tipo][nivel]
      return [
        `Patrones de ${configuracion.patternLength} figuras`,
        `${configuracion.optionCount} opciones`,
        nivel === "easy"
          ? "Repeticiones y cambios de orientación"
          : "Grupos y atributos combinados según el patrón",
      ]
    }
    case "quickResponse": {
      const configuracion = velocidadConfiguraciones[tipo][nivel]
      return [
        `${configuracion.comparisonCount ?? 1} figuras por grupo`,
        nivel === "easy"
          ? "Compará la forma"
          : nivel === "normal"
            ? "Compará forma y relleno"
            : "Compará orientación, relleno y tamaño",
        `${segundos(configuracion.timeoutMs)} por ronda`,
      ]
    }
    case "touchColor": {
      const configuracion = velocidadConfiguraciones[tipo][nivel]
      return [
        `${configuracion.optionCount} colores disponibles`,
        configuracion.selectionCount === 2
          ? "Tocá dos colores en el orden indicado"
          : "Tocá un color por ronda",
        `${segundos(configuracion.timeoutMs)} por ronda`,
      ]
    }
    case "quickClassification": {
      const configuracion = velocidadConfiguraciones[tipo][nivel]
      return [
        `${configuracion.optionCount} categorías para elegir`,
        nivel === "easy"
          ? "Palabras del grupo inicial"
          : "Palabras de vocabulario ampliado",
        `${segundos(configuracion.timeoutMs)} por ronda`,
      ]
    }
    case "visualReaction": {
      const configuracion = velocidadConfiguraciones[tipo][nivel]
      return [
        configuracion.optionCount === 1
          ? "Una señal de respuesta"
          : `Una señal correcta y ${configuracion.optionCount - 1} distractores`,
        "Respondé solo a ¡TOCÁ AHORA!",
        `${segundos(configuracion.timeoutMs)} para responder a la señal`,
      ]
    }
  }
}
