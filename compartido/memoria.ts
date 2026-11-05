export type TipoMemoria = "imagePairs" | "colorSequence" | "wordList" | "rememberOrder"

export type Nivel = "easy" | "normal" | "hard" | "veryHard"

export const tiposMemoria: TipoMemoria[] = [
  "imagePairs",
  "colorSequence",
  "wordList",
  "rememberOrder",
]
export const nombres: Record<TipoMemoria, string> = {
  imagePairs: "Pareja de imágenes",
  colorSequence: "Secuencia de colores",
  wordList: "Lista de palabras",
  rememberOrder: "Recuerda el orden",
}
export const instrucciones: Record<TipoMemoria, string> = {
  imagePairs:
    "Seleccioná dos tarjetas por vez. Si coinciden, quedarán descubiertas. Encontrá todas las parejas para finalizar.",
  colorSequence:
    "Observá los colores. Cuando termine la secuencia, seleccioná los colores en el mismo orden. Podés deshacer la última selección antes de confirmar.",
  wordList:
    "Memorizá las palabras. Luego seleccioná las que estaban en la lista entre las opciones. Podés cambiar tu selección antes de confirmar.",
  rememberOrder:
    "Observá los elementos de izquierda a derecha. Luego seleccionálos en el mismo orden. Podés deshacer la última selección antes de confirmar.",
}

export interface MemoriaConfiguracion {
  rounds: number
  size: number
  targetTimeSeconds: number
  presentationMs: number
  gapMs: number
  paletteSize: number
  distractors: number
}

const crear = (
  rondas: number,
  tamano: number,
  objetivoTiempoSegundos: number,
  presentacionMs = 0,
  separacionMs = 0,
  paletaTamano = 0,
  distractores = 0,
): MemoriaConfiguracion => ({
  rounds: rondas,
  size: tamano,
  targetTimeSeconds: objetivoTiempoSegundos,
  presentationMs: presentacionMs,
  gapMs: separacionMs,
  paletteSize: paletaTamano,
  distractors: distractores,
})
export const configuraciones: Record<TipoMemoria, Record<Nivel, MemoriaConfiguracion>> =
  {
    imagePairs: {
      easy: crear(1, 4, 45),
      normal: crear(1, 6, 70),
      hard: crear(1, 8, 95),
      veryHard: crear(1, 10, 125),
    },
    colorSequence: {
      easy: crear(4, 3, 35, 900, 250, 4),
      normal: crear(4, 4, 40, 800, 225, 5),
      hard: crear(5, 5, 55, 700, 200, 6),
      veryHard: crear(5, 6, 60, 600, 175, 6),
    },
    wordList: {
      easy: crear(3, 4, 45, 12000, 0, 0, 2),
      normal: crear(3, 5, 50, 10000, 0, 0, 3),
      hard: crear(4, 6, 65, 9000, 0, 0, 4),
      veryHard: crear(4, 8, 80, 8000, 0, 0, 5),
    },
    rememberOrder: {
      easy: crear(4, 3, 40, 8000),
      normal: crear(4, 4, 50, 7000),
      hard: crear(5, 5, 70, 6000),
      veryHard: crear(5, 6, 85, 5000),
    },
  }
export const elementos = [
  "🍎 Manzana",
  "🏠 Casa",
  "🐶 Perro",
  "🌻 Flor",
  "🚲 Bicicleta",
  "☀️ Sol",
  "☕ Taza",
  "🔑 Llave",
  "📚 Libro",
  "🐟 Pez",
  "🌳 Árbol",
  "🚗 Auto",
  "⚽ Pelota",
  "🍞 Pan",
  "🎩 Sombrero",
  "🪑 Silla",
  "⏰ Reloj",
  "🦋 Mariposa",
  "🍐 Pera",
  "🚢 Barco",
]
export const palabras = [
  "casa",
  "mesa",
  "silla",
  "puerta",
  "ventana",
  "jardín",
  "árbol",
  "flor",
  "perro",
  "gato",
  "caballo",
  "pájaro",
  "manzana",
  "pera",
  "naranja",
  "banana",
  "pan",
  "leche",
  "agua",
  "queso",
  "taza",
  "plato",
  "cuchara",
  "vaso",
  "libro",
  "lápiz",
  "papel",
  "carta",
  "camisa",
  "zapato",
  "sombrero",
  "abrigo",
  "auto",
  "barco",
  "tren",
  "bicicleta",
  "sol",
  "luna",
  "estrella",
  "nube",
  "río",
  "mar",
  "montaña",
  "playa",
  "pelota",
  "reloj",
  "llave",
  "bolso",
  "cama",
  "cocina",
  "tomate",
  "zanahoria",
  "papa",
  "cebolla",
  "mano",
  "brazo",
  "pie",
  "cara",
  "radio",
  "guitarra",
]
export const colores = [
  { label: "Rojo", value: "#b52323" },
  { label: "Azul", value: "#195cad" },
  { label: "Amarillo", value: "#f1ce28" },
  { label: "Verde", value: "#287445" },
  { label: "Violeta", value: "#7944a3" },
  { label: "Naranja", value: "#dd7928" },
]

export function mezclar<T>(
  valores: readonly T[],
  aleatorio = Math.random,
): T[] {
  const resultado = [...valores]
  for (let indice = resultado.length - 1; indice > 0; indice--) {
    const otro = Math.floor(aleatorio() * (indice + 1))
    ;[resultado[indice], resultado[otro]] = [resultado[otro], resultado[indice]]
  }
  return resultado
}

export interface MemoriaRonda {
  target: string[]
  options: string[]
}

export interface InstanciaMemoria {
  type: TipoMemoria
  level: Nivel
  config: MemoriaConfiguracion
  rounds: MemoriaRonda[]
}

export interface RespuestaMemoria {
  answers: string[][]
  actualResponseTimeSeconds: number
}

export type MemoriaDetalles = {
  exerciseType: "imagePairs"
  pairCount: number
  pairAttempts: number
  matchedPairs: number
  mismatches: number
} | {
  exerciseType: "colorSequence"
  rounds: number
  sequenceLength: number
  totalPositions: number
  correctPositions: number
  wrongPositions: number
  perfectRounds: number
} | {
  exerciseType: "wordList"
  rounds: number
  targetWordsTotal: number
  correctSelections: number
  incorrectSelections: number
  perfectRounds: number
} | {
  exerciseType: "rememberOrder"
  rounds: number
  itemsPerSequence: number
  totalPositions: number
  correctPositions: number
  wrongPositions: number
  perfectRounds: number
}

export function generarMemoria(
  tipo: TipoMemoria,
  nivel: Nivel,
): InstanciaMemoria {
  const configuracion = configuraciones[tipo][nivel]
  const rondas = Array.from(
    { length: configuracion.rounds },
    (): MemoriaRonda => {
      if (tipo === "imagePairs") {
        const objetivo = mezclar(elementos).slice(0, configuracion.size)
        return {
          target: objetivo,
          options: mezclar(
            objetivo.flatMap((elemento) => [elemento, elemento]),
          ),
        }
      }
      if (tipo === "colorSequence") {
        const opciones = colores
          .slice(0, configuracion.paletteSize)
          .map((color) => color.label)
        return {
          target: Array.from(
            { length: configuracion.size },
            () => opciones[Math.floor(Math.random() * opciones.length)],
          ),
          options: opciones,
        }
      }
      const conjunto = mezclar(tipo === "wordList" ? palabras : elementos)
      const objetivo = conjunto.slice(0, configuracion.size)
      return {
        target: objetivo,
        options: mezclar(
          tipo === "wordList"
            ? conjunto.slice(0, configuracion.size + configuracion.distractors)
            : objetivo,
        ),
      }
    },
  )
  return { type: tipo, level: nivel, config: configuracion, rounds: rondas }
}

export function precision(correcto: number, total: number) {
  return total > 0 ? (correcto / total) * 100 : 0
}

export function evaluarMemoria(
  instancia: InstanciaMemoria,
  respuesta: unknown,
) {
  if (typeof respuesta !== "object" || respuesta === null)
    throw new Error("Respuesta inválida.")
  const entrada = respuesta as Partial<RespuestaMemoria>
  if (
    !Number.isFinite(entrada.actualResponseTimeSeconds) ||
    entrada.actualResponseTimeSeconds! <= 0 ||
    entrada.actualResponseTimeSeconds! > 86400 ||
    !Array.isArray(entrada.answers) ||
    entrada.answers.some(
      (respuesta) =>
        !Array.isArray(respuesta) ||
        respuesta.some((valor) => typeof valor !== "string"),
    )
  )
    throw new Error("Respuesta inválida.")
  const { type: tipo, config: configuracion, rounds: rondas } = instancia
  const respuestas = entrada.answers
  let correcto = 0
  let total = 0
  let perfectoRondas = 0
  let detalles: MemoriaDetalles
  if (tipo === "imagePairs") {
    if (respuestas.length === 0 || respuestas.length > 10000)
      throw new Error("Intentos inválidos.")
    const emparejado = new Set<string>()
    const tarjetas = rondas[0].options
    for (const respuesta of respuestas) {
      if (
        respuesta.length !== 2 ||
        respuesta.some(
          (indice) =>
            !/^(0|[1-9]\d*)$/.test(indice) || Number(indice) >= tarjetas.length,
        ) ||
        respuesta[0] === respuesta[1]
      )
        throw new Error("Tarjetas inválidas.")
      const [primero, segundo] = respuesta.map(Number)
      if (
        emparejado.has(tarjetas[primero]) ||
        emparejado.has(tarjetas[segundo])
      )
        throw new Error("Pareja ya encontrada.")
      if (tarjetas[primero] === tarjetas[segundo])
        emparejado.add(tarjetas[primero])
    }
    correcto = emparejado.size
    total = respuestas.length
    if (correcto !== configuracion.size)
      throw new Error("Faltan parejas por encontrar.")
    detalles = {
      exerciseType: tipo,
      pairCount: configuracion.size,
      pairAttempts: total,
      matchedPairs: correcto,
      mismatches: total - correcto,
    }
  } else {
    if (respuestas.length !== configuracion.rounds)
      throw new Error("Faltan rondas.")
    rondas.forEach((ronda, indice) => {
      const respuesta = respuestas[indice]
      if (
        respuesta.length !== configuracion.size ||
        respuesta.some((valor) => !ronda.options.includes(valor)) ||
        (tipo !== "colorSequence" &&
          new Set(respuesta).size !== respuesta.length)
      )
        throw new Error("Selección inválida.")
      const cantidad = respuesta.filter((valor, posicion) =>
        tipo === "wordList"
          ? ronda.target.includes(valor)
          : ronda.target[posicion] === valor,
      ).length
      correcto += cantidad
      if (cantidad === configuracion.size) perfectoRondas++
    })
    total = configuracion.rounds * configuracion.size
    detalles =
      tipo === "wordList"
        ? {
            exerciseType: tipo,
            rounds: configuracion.rounds,
            targetWordsTotal: total,
            correctSelections: correcto,
            incorrectSelections: total - correcto,
            perfectRounds: perfectoRondas,
          }
        : tipo === "colorSequence"
          ? {
              exerciseType: tipo,
              rounds: configuracion.rounds,
              sequenceLength: configuracion.size,
              totalPositions: total,
              correctPositions: correcto,
              wrongPositions: total - correcto,
              perfectRounds: perfectoRondas,
            }
          : {
              exerciseType: tipo,
              rounds: configuracion.rounds,
              itemsPerSequence: configuracion.size,
              totalPositions: total,
              correctPositions: correcto,
              wrongPositions: total - correcto,
              perfectRounds: perfectoRondas,
            }
  }
  return {
    correctAnswers: correcto,
    errors: total - correcto,
    totalQuestions: total,
    accuracy: precision(correcto, total),
    actualTimeSeconds: entrada.actualResponseTimeSeconds!,
    actualResponseTimeSeconds: entrada.actualResponseTimeSeconds!,
    targetTimeSeconds: configuracion.targetTimeSeconds,
    details: detalles,
  }
}
