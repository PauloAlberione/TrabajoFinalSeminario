import { mezclar, type Nivel } from "../memoria"
import type {
  AtencionConfiguracion,
  VisualElemento,
  BuscarRonda,
  PatronRonda,
  SeguimientoRonda,
  Punto,
  VisualPatronTipo,
} from "./tipos"

export const visualClave = (elemento: VisualElemento) =>
  `${elemento.shape}:${elemento.rotation}:${elemento.fill}:${elemento.size}`

export function visualConjunto(nivel: Nivel): VisualElemento[] {
  const base: VisualElemento[] = [
    "circle",
    "square",
    "triangle",
    "diamond",
    "star",
    "arrow",
  ].map((forma) => ({
    shape: forma as VisualElemento["shape"],
    rotation: 0,
    fill: "solid",
    size: "large",
  }))
  if (nivel === "easy") return base
  const variaciones: VisualElemento[] = ["arrow", "triangle"].flatMap((forma) =>
    [0, 90, 180, 270].flatMap((rotacion) =>
      ["solid", "outline"].map((rellenar) => ({
        shape: forma as VisualElemento["shape"],
        rotation: rotacion,
        fill: rellenar as VisualElemento["fill"],
        size: "large" as const,
      })),
    ),
  )
  return [
    ...base.filter(
      (elemento) => !["arrow", "triangle"].includes(elemento.shape),
    ),
    ...variaciones,
  ]
}

export function generarBuscar(
  nivel: Nivel,
  configuracion: AtencionConfiguracion,
): BuscarRonda[] {
  const conjunto = visualConjunto(nivel)
  return Array.from({ length: configuracion.questionCount }, (_, indice) => {
    const objetivo =
      nivel === "hard" || nivel === "veryHard"
        ? conjunto.filter(
            (elemento) =>
              elemento.shape === "arrow" || elemento.shape === "triangle",
          )[indice % 16]
        : conjunto[indice % conjunto.length]
    const distractores = conjunto.filter(
      (elemento) =>
        visualClave(elemento) !== visualClave(objetivo) &&
        (nivel !== "veryHard" || elemento.shape === objetivo.shape),
    )
    const elementos = mezclar([
      ...Array.from({ length: configuracion.targetCount }, () => objetivo),
      ...Array.from(
        { length: configuracion.elementCount - configuracion.targetCount },
        (_, posicion) => distractores[posicion % distractores.length],
      ),
    ])
    return {
      id: `search-${indice}`,
      target: objetivo,
      items: elementos,
      targetIndices: elementos.flatMap((elemento, posicion) =>
        visualClave(elemento) === visualClave(objetivo) ? [posicion] : [],
      ),
    }
  })
}

export function generarSeguimiento(
  nivel: Nivel,
  configuracion: AtencionConfiguracion,
): SeguimientoRonda[] {
  const casillas: Punto[] =
    configuracion.elementCount === 3
      ? [
          { x: 15, y: 30 },
          { x: 50, y: 30 },
          { x: 85, y: 30 },
        ]
      : [
          { x: 15, y: 25 },
          { x: 85, y: 25 },
          { x: 15, y: 75 },
          { x: 85, y: 75 },
          { x: 50, y: 25 },
          { x: 50, y: 75 },
        ].slice(0, configuracion.elementCount)
  return Array.from(
    { length: configuracion.questionCount },
    (_, rondaIndice) => {
      const objetos = casillas.map((punto, indice) => ({
        id: `object-${indice}`,
        waypoints: [punto],
      }))
      for (let fase = 0; fase < configuracion.movementComplexity; fase++) {
        const pareja = rondaIndice % 2
        const destinos =
          nivel === "easy"
            ? casillas.map((punto, indice) => {
                if (indice !== pareja && indice !== pareja + 1)
                  return { x: punto.x, y: fase ? 50 : 65 }
                if (fase === 0)
                  return {
                    x: (casillas[pareja].x + casillas[pareja + 1].x) / 2,
                    y: indice === pareja ? 65 : 25,
                  }
                return {
                  x: casillas[indice === pareja ? pareja + 1 : pareja].x,
                  y: 50,
                }
              })
            : casillas.map(
                (_, indice) => casillas[(indice + fase + 1) % casillas.length],
              )
        objetos.forEach((objeto, indice) =>
          objeto.waypoints.push(destinos[indice]),
        )
      }
      return {
        id: `tracking-${rondaIndice}`,
        objects: objetos,
        targetId: mezclar(objetos)[0].id,
      }
    },
  )
}

export function seguimientoPosicion(
  objeto: { waypoints: Punto[] },
  progreso: number,
): Punto {
  const acotado =
    Math.max(0, Math.min(1, progreso)) * (objeto.waypoints.length - 1)
  const indice = Math.min(Math.floor(acotado), objeto.waypoints.length - 2)
  const fraccion = acotado - indice
  const suavizado = fraccion * fraccion * (3 - 2 * fraccion)
  const iniciar = objeto.waypoints[indice],
    fin = objeto.waypoints[indice + 1]
  return {
    x: iniciar.x + (fin.x - iniciar.x) * suavizado,
    y: iniciar.y + (fin.y - iniciar.y) * suavizado,
  }
}

function patronCiclo(
  tipo: VisualPatronTipo,
  nivel: Nivel,
  indice: number,
): VisualElemento[] {
  const conjunto = visualConjunto(nivel),
    primero = conjunto[indice % conjunto.length],
    segundo = conjunto[(indice + 1) % conjunto.length]
  switch (tipo) {
    case "alternating":
      return [primero, segundo]
    case "repeatingGroup":
      return nivel === "easy"
        ? [primero, segundo, conjunto[(indice + 2) % conjunto.length]]
        : nivel === "normal"
          ? [primero, primero, segundo]
          : nivel === "veryHard"
            ? [
                primero,
                primero,
                segundo,
                primero,
                primero,
                conjunto[(indice + 2) % conjunto.length],
              ]
            : [primero, primero, segundo, segundo]
    case "orientationCycle":
      return (nivel === "easy" ? [0, 180] : [0, 90, 180, 270]).map(
        (rotacion) => ({
          shape: "arrow",
          rotation: rotacion,
          fill: "solid",
          size: "large",
        }),
      )
    case "sizeAlternation":
      return nivel === "veryHard"
        ? [
            primero,
            { ...primero, size: "small" },
            segundo,
            { ...segundo, size: "small" },
          ]
        : [primero, { ...primero, size: "small" }]
    case "dualAttribute":
      return ["triangle", "arrow"].flatMap((forma) =>
        (nivel === "veryHard" ? [0, 90, 180] : [0, 180]).map((rotacion) => ({
          shape: forma as VisualElemento["shape"],
          rotation: rotacion,
          fill: "solid",
          size: "large",
        })),
      )
  }
}

export function generarPatrones(
  nivel: Nivel,
  configuracion: AtencionConfiguracion,
): PatronRonda[] {
  const patrones = mezclar(configuracion.patterns)
  return Array.from({ length: configuracion.questionCount }, (_, indice) => {
    const patronTipo = patrones[indice % patrones.length]
    const ciclo = patronCiclo(patronTipo, nivel, indice)
    const secuencia = Array.from(
      { length: configuracion.patternLength + (indice % 2) },
      (_, posicion) => ciclo[posicion % ciclo.length],
    )
    const faltanteIndice = secuencia.length - 1,
      correctoRespuesta = secuencia[faltanteIndice]
    const candidatos = [
      ...ciclo,
      ...visualConjunto(nivel),
      ...ciclo.map((elemento) => ({ ...elemento, size: "small" as const })),
    ]
    const distinto = [
      ...new Map(
        candidatos.map((elemento) => [visualClave(elemento), elemento]),
      ).values(),
    ].filter(
      (elemento) => visualClave(elemento) !== visualClave(correctoRespuesta),
    )
    const opciones = mezclar([
      correctoRespuesta,
      ...distinto.slice(0, configuracion.optionCount - 1),
    ])
    return {
      id: `pattern-${indice}`,
      cycle: ciclo,
      sequence: secuencia,
      missingIndex: faltanteIndice,
      correctAnswer: correctoRespuesta,
      options: opciones,
      patternType: patronTipo,
    }
  })
}
