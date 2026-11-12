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
    descripcion: string
    simbolo: string
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
      {
        name: "Pareja de imágenes",
        descripcion:
          "Destapá las tarjetas y encontrá las imágenes que coinciden.",
        simbolo: "🃏",
      },
      {
        name: "Secuencia de colores",
        descripcion:
          "Observá los colores y repetí la secuencia en el mismo orden.",
        simbolo: "🎨",
      },
      {
        name: "Lista de palabras",
        descripcion: "Memorizá una lista y reconocé las palabras que viste.",
        simbolo: "📝",
      },
      {
        name: "Recuerda el orden",
        descripcion: "Recordá los elementos y reconstruí su orden.",
        simbolo: "🧺",
      },
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
      {
        name: "Asociación de palabras",
        descripcion: "Encontrá la relación entre las palabras.",
        simbolo: "🔗",
      },
      {
        name: "Crucigrama simple",
        descripcion:
          "Resolvé las pistas y completá las palabras en la cuadrícula.",
        simbolo: "✏️",
      },
      {
        name: "Completar la frase",
        descripcion: "Elegí la palabra que falta para completar la frase.",
        simbolo: "💬",
      },
      {
        name: "Sinónimos y antónimos",
        descripcion: "Buscá palabras con significado similar o contrario.",
        simbolo: "📖",
      },
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
      {
        name: "Cálculo mental",
        descripcion: "Resolvé las operaciones y escribí tu respuesta.",
        simbolo: "➕",
      },
      {
        name: "Secuencias numéricas",
        descripcion: "Descubrí qué número falta en la secuencia.",
        simbolo: "🔢",
      },
      {
        name: "Ordenar números",
        descripcion: "Organizá los números según la consigna.",
        simbolo: "↕️",
      },
      {
        name: "Resta y diferencia",
        descripcion: "Resolvé restas y encontrá la diferencia entre números.",
        simbolo: "➖",
      },
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
      {
        name: "Identificar elementos",
        descripcion: "Buscá los elementos que coinciden con la muestra.",
        simbolo: "🔎",
      },
      {
        name: "Seguir el objeto",
        descripcion:
          "Seguí el objeto mientras se mueve y encontralo al detenerse.",
        simbolo: "👀",
      },
      {
        name: "Reconoce el patrón",
        descripcion: "Observá las figuras y descubrí cuál completa el patrón.",
        simbolo: "🧩",
      },
      {
        name: "Figura oculta",
        descripcion: "Encontrá la figura que coincide con la muestra.",
        simbolo: "◇",
      },
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
      {
        name: "Respuesta rápida",
        descripcion:
          "Compará dos figuras y decidí si son iguales o diferentes.",
        simbolo: "⚡",
      },
      {
        name: "Toca el color correcto",
        descripcion:
          "Leé el color solicitado y elegí el botón correspondiente.",
        simbolo: "🎨",
      },
      {
        name: "Clasificar rápido",
        descripcion: "Elegí la categoría a la que pertenece cada palabra.",
        simbolo: "🗂️",
      },
      {
        name: "Reacción visual",
        descripcion: "Esperá la señal y respondé cuando aparezca.",
        simbolo: "🚦",
      },
    ],
  },
]
export const COLORES_DIFICULTAD: Record<NivelDificultad, string> = {
  easy: "#D8EDE3",
  normal: "#FDE8D8",
  hard: "#E4E0F5",
  veryHard: "#F5E0DB",
}
