import type { Nivel } from "./memoria"

export interface CrucigramaPalabra {
  id: string
  answer: string
  clue: string
  row: number
  column: number
  direction: "across" | "down"
}

export interface CrucigramaCrucigrama {
  id: string
  rows: number
  columns: number
  words: CrucigramaPalabra[]
}

export function normalizarRespuesta(valor: string) {
  return valor
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

type Entrada = [string, string, number, number, "across" | "down"]

function crucigrama(
  id: string,
  filas: number,
  columnas: number,
  entradas: Entrada[],
): CrucigramaCrucigrama {
  return {
    id,
    rows: filas,
    columns: columnas,
    words: entradas.map(
      ([respuesta, pista, fila, columna, direccion], indice) => ({
        id: `${id}-${indice}`,
        answer: respuesta,
        clue: pista,
        row: fila,
        column: columna,
        direction: direccion,
      }),
    ),
  }
}

export const crucigramaCrucigramas: Record<Nivel, CrucigramaCrucigrama[]> = {
  easy: [
    crucigrama("easy-casa", 8, 4, [
      ["CASA", "Lugar donde vivimos.", 3, 0, "across"],
      ["CAMA", "Mueble donde dormimos.", 3, 0, "down"],
      ["SAL", "Condimento salado.", 3, 2, "down"],
      ["PATO", "Ave que nada y hace cuac.", 2, 3, "down"],
    ]),
    crucigrama("easy-luna", 8, 4, [
      ["LUNA", "Satélite natural de la Tierra.", 3, 0, "across"],
      ["LUZ", "Nos permite ver cuando está oscuro.", 3, 0, "down"],
      ["NUBE", "Masa blanca o gris que vemos en el cielo.", 3, 2, "down"],
      ["GATO", "Animal doméstico que maúlla.", 2, 3, "down"],
    ]),
  ],
  normal: [
    crucigrama("normal-camino", 11, 6, [
      [
        "CAMINO",
        "Vía por la que podemos ir de un lugar a otro.",
        5,
        0,
        "across",
      ],
      [
        "CAMISA",
        "Prenda con cuello y botones que cubre el torso.",
        5,
        0,
        "down",
      ],
      ["MESA", "Mueble sobre el que apoyamos platos para comer.", 5, 2, "down"],
      ["NUBE", "Puede tapar el sol y traer lluvia.", 5, 4, "down"],
      ["LIBRO", "Conjunto de páginas encuadernadas para leer.", 1, 5, "down"],
    ]),
    crucigrama("normal-jardin", 10, 6, [
      [
        "JARDÍN",
        "Espacio de una casa donde se cultivan flores.",
        5,
        0,
        "across",
      ],
      ["JARRA", "Recipiente con asa para servir agua.", 5, 0, "down"],
      ["PERA", "Fruta que se ensancha hacia abajo.", 3, 2, "down"],
      ["SILLA", "Asiento con respaldo para una persona.", 4, 4, "down"],
      [
        "NIDO",
        "Refugio que construyen las aves para sus huevos.",
        5,
        5,
        "down",
      ],
    ]),
  ],
  hard: [
    crucigrama("hard-ventana", 13, 7, [
      [
        "VENTANA",
        "Abertura de una pared que deja pasar luz y aire.",
        6,
        0,
        "across",
      ],
      ["VERANO", "Estación que sigue a la primavera.", 6, 0, "down"],
      ["VIENTO", "Aire que se desplaza y mueve las hojas.", 3, 2, "down"],
      ["TIJERA", "Herramienta con dos hojas que permite cortar.", 6, 3, "down"],
      [
        "ARENA",
        "Material de pequeños granos que cubre muchas playas.",
        6,
        4,
        "down",
      ],
      [
        "NARANJA",
        "Fruta cítrica que suele exprimirse para hacer jugo.",
        5,
        6,
        "down",
      ],
    ]),
    crucigrama("hard-camisa", 14, 6, [
      [
        "CAMISA",
        "Prenda de torso que suele abrocharse con botones.",
        6,
        0,
        "across",
      ],
      [
        "COCINA",
        "Lugar de la casa donde se preparan los alimentos.",
        6,
        0,
        "down",
      ],
      [
        "HARINA",
        "Ingrediente molido que se amasa para hacer pan.",
        5,
        1,
        "down",
      ],
      ["CAMINO", "Vía que conecta dos lugares.", 4, 2, "down"],
      ["SOMBRERO", "Prenda que cubre la cabeza y tiene ala.", 6, 4, "down"],
      [
        "ARENA",
        "Material fino formado por pequeños granos de roca.",
        6,
        5,
        "down",
      ],
    ]),
  ],
  veryHard: [
    crucigrama("veryhard-primavera", 16, 9, [
      ["PRIMAVERA", "Estación entre el invierno y el verano.", 6, 0, "across"],
      [
        "PARAGUAS",
        "Objeto plegable que nos protege de la lluvia.",
        6,
        0,
        "down",
      ],
      ["BRÚJULA", "Instrumento cuya aguja señala el norte.", 5, 1, "down"],
      [
        "TIJERA",
        "Sus dos hojas articuladas permiten cortar papel.",
        5,
        2,
        "down",
      ],
      [
        "MADERA",
        "Material del tronco que trabaja un carpintero.",
        6,
        3,
        "down",
      ],
      [
        "VENTANA",
        "Permite que entre luz natural a una habitación.",
        6,
        5,
        "down",
      ],
      ["CAMISA", "Prenda de torso con cuello y botones.", 5, 8, "down"],
    ]),
    crucigrama("veryhard-mariposa", 15, 8, [
      [
        "MARIPOSA",
        "Insecto de alas amplias que pasa por una etapa de oruga.",
        6,
        0,
        "across",
      ],
      [
        "MADERA",
        "Material de origen vegetal usado para fabricar muebles.",
        6,
        0,
        "down",
      ],
      [
        "JARDÍN",
        "Espacio al aire libre destinado al cultivo de plantas ornamentales.",
        5,
        1,
        "down",
      ],
      ["BRÚJULA", "Nos permite orientarnos indicando el norte.", 5, 2, "down"],
      [
        "TIJERA",
        "Herramienta que corta al acercar sus dos hojas.",
        5,
        3,
        "down",
      ],
      [
        "PARAGUAS",
        "Objeto con tela desplegable que evita mojarnos bajo la lluvia.",
        6,
        4,
        "down",
      ],
      [
        "CAMINO",
        "Vía que permite desplazarse entre dos lugares.",
        5,
        7,
        "down",
      ],
    ]),
  ],
}

export function palabraCeldas(palabra: CrucigramaPalabra) {
  return Array.from(normalizarRespuesta(palabra.answer), (letra, indice) => ({
    letter: letra,
    row: palabra.row + (palabra.direction === "down" ? indice : 0),
    column: palabra.column + (palabra.direction === "across" ? indice : 0),
  }))
}

export function validarCrucigrama(crucigrama: CrucigramaCrucigrama) {
  const ocupado = new Map<string, string>()
  const pertenencias = new Map<string, Set<string>>()
  for (const palabra of crucigrama.words)
    for (const celda of palabraCeldas(palabra)) {
      if (
        celda.row < 0 ||
        celda.column < 0 ||
        celda.row >= crucigrama.rows ||
        celda.column >= crucigrama.columns
      )
        throw new Error("Palabra fuera de la cuadrícula.")
      const clave = `${celda.row}-${celda.column}`
      if (ocupado.has(clave) && ocupado.get(clave) !== celda.letter)
        throw new Error("Intersección inválida.")
      ocupado.set(clave, celda.letter)
      const ids = pertenencias.get(clave) ?? new Set<string>()
      ids.add(palabra.id)
      pertenencias.set(clave, ids)
    }
  const conectado = new Set([crucigrama.words[0].id])
  for (let pasar = 0; pasar < crucigrama.words.length; pasar++)
    for (const ids of pertenencias.values())
      if ([...ids].some((id) => conectado.has(id)))
        ids.forEach((id) => conectado.add(id))
  if (conectado.size !== crucigrama.words.length)
    throw new Error("Crucigrama desconectado.")
  return true
}
