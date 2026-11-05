import { nombres, tiposMemoria } from "../../../compartido/memoria"
import { lenguajeNombres, tiposLenguaje } from "../../../compartido/lenguaje"
import { nombresCalculo, tiposCalculo } from "../../../compartido/calculo"
import {
  nombresAtencion,
  tiposAtencion,
} from "../../../compartido/atencionReconocimiento"
import { nombresVelocidad, tiposVelocidad } from "../../../compartido/velocidad"
import type { IdFuncionCognitiva } from "../../../compartido/resultados"

export const etiquetasCategorias: Record<IdFuncionCognitiva, string> = {
  memory: "Memoria",
  language: "Lenguaje",
  calculation: "Cálculo",
  attentionRecognition: "Atención y reconocimiento",
  speed: "Velocidad",
}
export const ejerciciosHistorial = [
  ...tiposMemoria.map((tipo) => ({
    type: tipo,
    name: nombres[tipo],
    category: "memory",
  })),
  ...tiposLenguaje.map((tipo) => ({
    type: tipo,
    name: lenguajeNombres[tipo],
    category: "language",
  })),
  ...tiposCalculo.map((tipo) => ({
    type: tipo,
    name: nombresCalculo[tipo],
    category: "calculation",
  })),
  ...tiposAtencion.map((tipo) => ({
    type: tipo,
    name: nombresAtencion[tipo],
    category: "attentionRecognition",
  })),
  ...tiposVelocidad.map((tipo) => ({
    type: tipo,
    name: nombresVelocidad[tipo],
    category: "speed",
  })),
  {
    type: "memoryPairs",
    name: "Parejas (versión anterior)",
    category: "memory",
  },
]
