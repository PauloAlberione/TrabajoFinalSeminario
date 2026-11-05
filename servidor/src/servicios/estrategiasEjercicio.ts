import {
  generarVelocidad,
  evaluarVelocidad,
  velocidadConfiguraciones,
  nombresVelocidad,
  type TipoVelocidad,
  type VelocidadInstancia,
} from "../../../compartido/velocidad"
import {
  generarAtencion,
  evaluarAtencion,
  atencionConfiguraciones,
  nombresAtencion,
  type TipoAtencion,
  type AtencionInstancia,
} from "../../../compartido/atencionReconocimiento"
import {
  generarCalculo,
  evaluarCalculo,
  calculoConfiguraciones,
  nombresCalculo,
  type TipoCalculo,
  type CalculoInstancia,
} from "../../../compartido/calculo"
import {
  generarLenguaje,
  evaluarLenguaje,
  lenguajeConfiguraciones,
  lenguajeNombres,
  type TipoLenguaje,
  type LenguajeInstancia,
} from "../../../compartido/lenguaje"
import {
  generarMemoria,
  evaluarMemoria,
  configuraciones as memoriaConfiguraciones,
  nombres,
  type TipoMemoria,
  type InstanciaMemoria,
} from "../../../compartido/memoria"
import type { NivelDificultad, EjercicioTipo } from "../tipos/dominio"
import type {
  DificultadConfiguracion,
  EjercicioEvaluacion,
  InstanciaEjercicio,
  EjercicioEstrategia,
} from "../tipos/ejercicios"

const niveles: NivelDificultad[] = ["easy", "normal", "hard", "veryHard"]
const configuraciones: Record<Exclude<EjercicioTipo, TipoMemoria | TipoLenguaje | TipoCalculo | TipoAtencion | TipoVelocidad>, Record<NivelDificultad, DificultadConfiguracion>> =
  {
    memoryPairs: {
      easy: { questionCount: 4, targetTimeSeconds: 60 },
      normal: { questionCount: 6, targetTimeSeconds: 75 },
      hard: { questionCount: 8, targetTimeSeconds: 90 },
      veryHard: { questionCount: 10, targetTimeSeconds: 110 },
    },
  }

function evaluar(
  respuestasCorrectas: number,
  configuracion: DificultadConfiguracion,
  efectivoTiempoSegundos: number,
): EjercicioEvaluacion {
  return {
    accuracy: (respuestasCorrectas / configuracion.questionCount) * 100,
    actualResponseTimeSeconds: efectivoTiempoSegundos,
    correctAnswers: respuestasCorrectas,
    errors: configuracion.questionCount - respuestasCorrectas,
    totalQuestions: configuracion.questionCount,
    actualTimeSeconds: efectivoTiempoSegundos,
    targetTimeSeconds: configuracion.targetTimeSeconds,
  }
}

class ConfiguradoEstrategia implements EjercicioEstrategia {
  constructor(
    readonly type: keyof typeof configuraciones,
    readonly cognitiveFunctionId: InstanciaEjercicio["cognitiveFunctionId"],
    private readonly prompt: string,
  ) {}
  getDifficultyConfig(nivel: NivelDificultad) {
    return configuraciones[this.type][nivel]
  }
  generateExercise(nivel: NivelDificultad): InstanciaEjercicio {
    const configuracion = this.getDifficultyConfig(nivel)
    return {
      id: `${this.type}-${Date.now()}`,
      type: this.type,
      cognitiveFunctionId: this.cognitiveFunctionId,
      prompt: this.prompt,
      payload: { questionCount: configuracion.questionCount, level: nivel },
      targetTimeSeconds: configuracion.targetTimeSeconds,
    }
  }
  evaluateResponse(
    instancia: InstanciaEjercicio,
    respuesta: unknown,
    efectivoTiempoSegundos: number,
  ) {
    const configuracion = this.getDifficultyConfig(
      (instancia.payload as { level: NivelDificultad }).level,
    )
    const respuestasCorrectas =
      typeof respuesta === "object" &&
      respuesta !== null &&
      "correctAnswers" in respuesta
        ? Number((respuesta as { correctAnswers: unknown }).correctAnswers)
        : Number(respuesta)
    if (
      !Number.isInteger(respuestasCorrectas) ||
      respuestasCorrectas < 0 ||
      respuestasCorrectas > configuracion.questionCount
    )
      throw new Error("Respuesta de ejercicio inválida.")
    return evaluar(respuestasCorrectas, configuracion, efectivoTiempoSegundos)
  }
}

class MemoriaEstrategia implements EjercicioEstrategia {
  readonly cognitiveFunctionId = "memory" as const
  constructor(readonly type: TipoMemoria) {}
  getDifficultyConfig(nivel: NivelDificultad) {
    const configuracion = memoriaConfiguraciones[this.type][nivel]
    return {
      ...configuracion,
      questionCount: configuracion.rounds * configuracion.size,
    }
  }
  generateExercise(nivel: NivelDificultad): InstanciaEjercicio {
    const contenido = generarMemoria(this.type, nivel)
    return {
      id: this.type,
      type: this.type,
      cognitiveFunctionId: "memory",
      prompt: nombres[this.type],
      payload: contenido,
      targetTimeSeconds: contenido.config.targetTimeSeconds,
    }
  }
  evaluateResponse(instancia: InstanciaEjercicio, respuesta: unknown) {
    return evaluarMemoria(instancia.payload as InstanciaMemoria, respuesta)
  }
}

class LenguajeEstrategia implements EjercicioEstrategia {
  readonly cognitiveFunctionId = "language" as const
  constructor(readonly type: TipoLenguaje) {}
  getDifficultyConfig(nivel: NivelDificultad) {
    return lenguajeConfiguraciones[this.type][nivel]
  }
  generateExercise(nivel: NivelDificultad): InstanciaEjercicio {
    const contenido = generarLenguaje(this.type, nivel)
    return {
      id: this.type,
      type: this.type,
      cognitiveFunctionId: "language",
      prompt: lenguajeNombres[this.type],
      payload: contenido,
      targetTimeSeconds: contenido.config.targetTimeSeconds,
    }
  }
  evaluateResponse(instancia: InstanciaEjercicio, respuesta: unknown) {
    return evaluarLenguaje(instancia.payload as LenguajeInstancia, respuesta)
  }
}

class CalculoEstrategia implements EjercicioEstrategia {
  readonly cognitiveFunctionId = "calculation" as const
  constructor(readonly type: TipoCalculo) {}
  getDifficultyConfig(nivel: NivelDificultad) {
    return calculoConfiguraciones[this.type][nivel]
  }
  generateExercise(nivel: NivelDificultad): InstanciaEjercicio {
    const contenido = generarCalculo(this.type, nivel)
    return {
      id: this.type,
      type: this.type,
      cognitiveFunctionId: this.cognitiveFunctionId,
      prompt: nombresCalculo[this.type],
      payload: contenido,
      targetTimeSeconds: contenido.config.targetTimeSeconds,
    }
  }
  evaluateResponse(instancia: InstanciaEjercicio, respuesta: unknown) {
    return evaluarCalculo(instancia.payload as CalculoInstancia, respuesta)
  }
}

class AtencionEstrategia implements EjercicioEstrategia {
  readonly cognitiveFunctionId = "attentionRecognition" as const
  constructor(readonly type: TipoAtencion) {}
  getDifficultyConfig(nivel: NivelDificultad) {
    return atencionConfiguraciones[this.type][nivel]
  }
  generateExercise(nivel: NivelDificultad): InstanciaEjercicio {
    const contenido = generarAtencion(this.type, nivel)
    return {
      id: this.type,
      type: this.type,
      cognitiveFunctionId: this.cognitiveFunctionId,
      prompt: nombresAtencion[this.type],
      payload: contenido,
      targetTimeSeconds: contenido.config.targetTimeSeconds,
    }
  }
  evaluateResponse(instancia: InstanciaEjercicio, respuesta: unknown) {
    return evaluarAtencion(instancia.payload as AtencionInstancia, respuesta)
  }
}

class VelocidadEstrategia implements EjercicioEstrategia {
  readonly cognitiveFunctionId = "speed" as const
  constructor(readonly type: TipoVelocidad) {}
  getDifficultyConfig(nivel: NivelDificultad) {
    return velocidadConfiguraciones[this.type][nivel]
  }
  generateExercise(nivel: NivelDificultad): InstanciaEjercicio {
    const contenido = generarVelocidad(this.type, nivel)
    return {
      id: this.type,
      type: this.type,
      cognitiveFunctionId: this.cognitiveFunctionId,
      prompt: nombresVelocidad[this.type],
      payload: contenido,
      targetTimeSeconds: contenido.config.targetTimeSeconds,
    }
  }
  evaluateResponse(instancia: InstanciaEjercicio, respuesta: unknown) {
    return evaluarVelocidad(instancia.payload as VelocidadInstancia, respuesta)
  }
}

const estrategias: Record<EjercicioTipo, EjercicioEstrategia> = {
  imagePairs: new MemoriaEstrategia("imagePairs"),
  colorSequence: new MemoriaEstrategia("colorSequence"),
  wordList: new MemoriaEstrategia("wordList"),
  rememberOrder: new MemoriaEstrategia("rememberOrder"),
  memoryPairs: new ConfiguradoEstrategia(
    "memoryPairs",
    "memory",
    "Encuentra las parejas",
  ),
  wordAssociation: new LenguajeEstrategia("wordAssociation"),
  simpleCrossword: new LenguajeEstrategia("simpleCrossword"),
  completeSentence: new LenguajeEstrategia("completeSentence"),
  synonymsAntonyms: new LenguajeEstrategia("synonymsAntonyms"),
  mentalCalculation: new CalculoEstrategia("mentalCalculation"),
  numberSequence: new CalculoEstrategia("numberSequence"),
  orderNumbers: new CalculoEstrategia("orderNumbers"),
  subtractionDifference: new CalculoEstrategia("subtractionDifference"),
  identifyElements: new AtencionEstrategia("identifyElements"),
  followObject: new AtencionEstrategia("followObject"),
  recognizePattern: new AtencionEstrategia("recognizePattern"),
  hiddenFigure: new AtencionEstrategia("hiddenFigure"),
  quickResponse: new VelocidadEstrategia("quickResponse"),
  touchColor: new VelocidadEstrategia("touchColor"),
  quickClassification: new VelocidadEstrategia("quickClassification"),
  visualReaction: new VelocidadEstrategia("visualReaction"),
}

export function obtenerEjercicioEstrategia(
  tipo: EjercicioTipo,
): EjercicioEstrategia {
  const estrategia = estrategias[tipo]
  if (!estrategia) throw new Error("Tipo de ejercicio desconocido.")
  return estrategia
}

export { niveles }
