import type { ReactElement } from "react"
import { type NivelDificultad } from "../../tipos/ejercicios"
import { type Pantalla } from "../../tipos/navegacion"
import {
  IconoMemoria,
  IconoPalabras,
  IconoNumeros,
  IconoAtencion,
  IconoVelocidad,
} from "../../componentes/Iconos"

export const categoriasEjercicios: {
  id: string
  label: string
  color: string
  bg: string
  icon: ReactElement
  description: string
  demoScreen: Pantalla
  activities: {
    name: string
    time: string
  }[]
}[] = [
  {
    id: "memoria",
    label: "Memoria",
    color: "var(--categoria-memoria)",
    bg: "#FDE8D8",
    demoScreen: "game",
    icon: <IconoMemoria />,
    description:
      "Ejercita tu capacidad de recordar imágenes, palabras y secuencias.",
    activities: [
      { name: "Pareja de imágenes", time: "10 min" },
      { name: "Secuencia de colores", time: "8 min" },
      { name: "Lista de palabras", time: "12 min" },
      { name: "Recuerda el orden", time: "9 min" },
    ],
  },
  {
    id: "lenguaje",
    label: "Lenguaje",
    color: "var(--categoria-lenguaje)",
    bg: "#D8EDE3",
    demoScreen: "lenguaje-game",
    icon: <IconoPalabras />,
    description:
      "Mejora tu fluencia verbal, vocabulario y comprensión lectora.",
    activities: [
      { name: "Asociación de palabras", time: "10 min" },
      { name: "Crucigrama simple", time: "15 min" },
      { name: "Completar la frase", time: "8 min" },
      { name: "Sinónimos y antónimos", time: "12 min" },
    ],
  },
  {
    id: "calculo",
    label: "Cálculo",
    color: "var(--categoria-calculo)",
    bg: "#E4E0F5",
    demoScreen: "calculo-game",
    icon: <IconoNumeros />,
    description:
      "Practica operaciones matemáticas sencillas y series numéricas.",
    activities: [
      { name: "Cálculo mental", time: "8 min" },
      { name: "Secuencias numéricas", time: "10 min" },
      { name: "Ordenar números", time: "7 min" },
      { name: "Resta y diferencia", time: "9 min" },
    ],
  },
  {
    id: "atencion",
    label: "Atención y reconocimiento",
    color: "var(--categoria-atencion)",
    bg: "#F5E0DB",
    demoScreen: "atencion-game",
    icon: <IconoAtencion />,
    description:
      "Entrena la concentración, la observación y el reconocimiento visual.",
    activities: [
      { name: "Identificar elementos", time: "10 min" },
      { name: "Seguir el objeto", time: "6 min" },
      { name: "Reconoce el patrón", time: "8 min" },
      { name: "Figura oculta", time: "12 min" },
    ],
  },
  {
    id: "velocidad",
    label: "Velocidad",
    color: "var(--categoria-velocidad)",
    bg: "#D0EBF4",
    demoScreen: "velocidad-game",
    icon: <IconoVelocidad />,
    description:
      "Mejora la rapidez de respuesta y el procesamiento de la información.",
    activities: [
      { name: "Respuesta rápida", time: "6 min" },
      { name: "Toca el color correcto", time: "7 min" },
      { name: "Clasificar rápido", time: "8 min" },
      { name: "Reacción visual", time: "5 min" },
    ],
  },
]
export const COLORES_DIFICULTAD: Record<NivelDificultad, string> = {
  easy: "#D8EDE3",
  normal: "#FDE8D8",
  hard: "#E4E0F5",
  veryHard: "#F5E0DB",
}
