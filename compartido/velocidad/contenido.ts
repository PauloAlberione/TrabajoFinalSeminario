export const velocidadColores = [
  { id: "red", name: "ROJO", background: "#B82424", foreground: "#FFFFFF" },
  { id: "blue", name: "AZUL", background: "#174BBD", foreground: "#FFFFFF" },
  { id: "green", name: "VERDE", background: "#206639", foreground: "#FFFFFF" },
  {
    id: "yellow",
    name: "AMARILLO",
    background: "#F2D33A",
    foreground: "#222222",
  },
  {
    id: "purple",
    name: "VIOLETA",
    background: "#713890",
    foreground: "#FFFFFF",
  },
  {
    id: "orange",
    name: "NARANJA",
    background: "#EE8B2C",
    foreground: "#222222",
  },
  { id: "pink", name: "ROSA", background: "#B62562", foreground: "#FFFFFF" },
  { id: "brown", name: "MARRÓN", background: "#794428", foreground: "#FFFFFF" },
]
export const clasificacionCategorias = [
  "ANIMALES",
  "VEHÍCULOS",
  "ROPA",
  "INSTRUMENTOS",
] as const

export type ClasificacionCategoria = typeof clasificacionCategorias[number]

export interface ClasificacionElemento {
  id: string
  label: string
  category: ClasificacionCategoria
  familiar: boolean
}

const elementos: Record<ClasificacionCategoria, string[]> = {
  ANIMALES: [
    "PERRO",
    "GATO",
    "CABALLO",
    "VACA",
    "OVEJA",
    "CONEJO",
    "ELEFANTE",
    "JIRAFA",
    "TORTUGA",
    "DELFÍN",
  ],
  VEHÍCULOS: [
    "AUTO",
    "COLECTIVO",
    "BICICLETA",
    "CAMIÓN",
    "TREN",
    "MOTO",
    "AVIÓN",
    "BARCO",
    "TRANVÍA",
    "HELICÓPTERO",
  ],
  ROPA: [
    "CAMISA",
    "PANTALÓN",
    "POLLERA",
    "VESTIDO",
    "CAMPERA",
    "SACO",
    "BUZO",
    "PULÓVER",
    "REMERA",
    "CHALECO",
  ],
  INSTRUMENTOS: [
    "GUITARRA",
    "PIANO",
    "VIOLÍN",
    "TAMBOR",
    "FLAUTA",
    "TROMPETA",
    "ARPA",
    "ACORDEÓN",
    "CLARINETE",
    "SAXOFÓN",
  ],
}
export const clasificacionElementos: ClasificacionElemento[] =
  clasificacionCategorias.flatMap((categoria) =>
    elementos[categoria].map((etiqueta, indice) => ({
      id: `${categoria}-${indice}`,
      label: etiqueta,
      category: categoria,
      familiar: indice < 4,
    })),
  )
