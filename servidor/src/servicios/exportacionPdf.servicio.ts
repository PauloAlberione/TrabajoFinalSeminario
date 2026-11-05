import { nombres as memoriaNombres } from "../../../compartido/memoria"
import { lenguajeNombres } from "../../../compartido/lenguaje"
import { nombresCalculo } from "../../../compartido/calculo"
import { nombresAtencion } from "../../../compartido/atencionReconocimiento"
import { nombresVelocidad } from "../../../compartido/velocidad"
import PDFDocument from "pdfkit"
import { mkdtemp, open, rm, stat } from "node:fs/promises"
import { createReadStream, createWriteStream } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createInterface } from "node:readline"
import { pipeline } from "node:stream/promises"
import { setImmediate } from "node:timers/promises"
import type { PdfExportarConsulta } from "../../../compartido/exportacionPdf"
import type { ElementoHistorial } from "../../../compartido/historial"
import type { InformeEstadisticas } from "../../../compartido/estadisticas"
import { CATEGORIA_IDS } from "../../../compartido/resultados"
import { calcularEstadisticas } from "./estadisticas.servicio"
import { interpretarHistorialConsulta } from "./consultaHistorial"
import {
  HistorialConsultaError,
  validoHistorialId,
} from "../utilidades/consultaHistorial"
import {
  recorrerResultados,
  obtenerResultado,
} from "../repositorios/resultado.repositorio"
import { obtenerPerfilUsuario } from "../repositorios/usuario.repositorio"

const categorias = {
  memory: "Memoria",
  language: "Lenguaje",
  calculation: "Cálculo",
  attentionRecognition: "Atención y reconocimiento",
  speed: "Velocidad",
}
const ejercicioNombres: Record<string, string> = {
  ...memoriaNombres,
  ...lenguajeNombres,
  ...nombresCalculo,
  ...nombresAtencion,
  ...nombresVelocidad,
  memoryPairs: "Parejas (versión anterior)",
}
const niveles = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  veryHard: "Muy difícil",
}

export class PdfExportarError extends Error {
  constructor(
    mensaje: string,
    public status = 404,
  ) {
    super(mensaje)
  }
}

export function interpretarPdfExportarConsulta(
  entrada: Record<string, unknown>,
): PdfExportarConsulta & { timeZone: string } {
  if (Object.values(entrada).some((valor) => typeof valor !== "string"))
    throw new HistorialConsultaError("Filtros de exportación inválidos.")
  const { scope: alcance, timeZone: tiempoZona = "UTC", ...campos } = entrada
  if (typeof tiempoZona !== "string" || tiempoZona.length > 100)
    throw new HistorialConsultaError("Zona horaria inválida.")
  try {
    new Intl.DateTimeFormat("es", { timeZone: tiempoZona }).format()
  } catch {
    throw new HistorialConsultaError("Zona horaria inválida.")
  }
  if (alcance === "single") {
    if (
      Object.keys(campos).some(
        (clave) => !["sessionId", "resultId"].includes(clave),
      ) ||
      typeof campos.sessionId !== "string" ||
      typeof campos.resultId !== "string" ||
      !validoHistorialId(campos.sessionId) ||
      !validoHistorialId(campos.resultId)
    )
      throw new HistorialConsultaError("Resultado de exportación inválido.")
    return {
      scope: alcance,
      timeZone: tiempoZona,
      sessionId: campos.sessionId,
      resultId: campos.resultId,
    }
  }
  if (
    alcance !== "history" ||
    Object.keys(campos).some(
      (clave) =>
        !["category", "exercise", "difficulty", "from", "to"].includes(clave),
    )
  )
    throw new HistorialConsultaError("Filtros de exportación inválidos.")
  const interpretado = interpretarHistorialConsulta(campos)
  return {
    scope: alcance,
    timeZone: tiempoZona,
    category: interpretado.category,
    exercise: interpretado.exercise,
    difficulty: interpretado.difficulty,
    from: interpretado.from,
    to: interpretado.to,
  }
}

interface ExportarFuentes {
  results: (
    uid: string,
    consulta: PdfExportarConsulta,
  ) => AsyncIterable<ElementoHistorial>
  profile: (uid: string) => Promise<Record<string, unknown> | null>
}

const fuentes: ExportarFuentes = {
  profile: obtenerPerfilUsuario,
  async *results(uid, consulta) {
    if (consulta.scope === "single") {
      const elemento = await obtenerResultado(
        uid,
        consulta.sessionId,
        consulta.resultId,
      )
      if (elemento) yield elemento
      return
    }
    const { scope: alcance, timeZone: zona, ...filtros } = consulta
    yield* recorrerResultados(uid, { ...filtros, includeDetails: false })
  },
}
const numero = (valor: unknown, sufijo = "") =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= 0
    ? `${valor.toLocaleString("es-AR", { maximumFractionDigits: 3 })}${sufijo}`
    : "Sin datos"

function fecha(valor: string, tiempoZona: string) {
  return new Date(valor).toLocaleString("es-AR", {
    timeZone: tiempoZona,
    dateStyle: "medium",
    timeStyle: "short",
  })
}

async function* leerFilas(ruta: string) {
  const entrada = createReadStream(ruta)
  const lineas = createInterface({ input: entrada, crlfDelay: Infinity })
  try {
    for await (const linea of lineas)
      yield JSON.parse(linea) as ElementoHistorial
  } finally {
    lineas.close()
    entrada.destroy()
  }
}

async function renderizarPdf(
  ruta: string,
  filas: string,
  informe: InformeEstadisticas,
  mostrarNombre: string,
  consulta: PdfExportarConsulta,
  senal?: AbortSignal,
) {
  const documento = new PDFDocument({
    size: "A4",
    margins: { top: 70, left: 48, right: 48, bottom: 62 },
    autoFirstPage: false,
    lang: "es-AR",
    info: {
      Title: "Resultados de ejercicios de MenteClear",
      Author: "MenteClear",
      CreationDate: new Date(informe.generatedAt),
    },
  })
  const salida = pipeline(
    documento,
    createWriteStream(ruta, { flags: "wx", mode: 0o600 }),
    { signal: senal },
  )
  // Detecta errores de escritura de inmediato, incluso durante la lectura de filas.
  void salida.catch(() => {})
  let pagina = 0
  documento.on("pageAdded", () => {
    pagina++
    documento
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#783000")
      .text("MenteClear · Resultados de ejercicios", 48, 28, {
        lineBreak: false,
      })
    documento
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#382515")
      .text(`Página ${pagina}`, 48, documento.page.height - 35, {
        lineBreak: false,
      })
    documento.x = 48
    documento.y = 70
    documento.font("Helvetica").fontSize(14).fillColor("#201408")
  })
  const texto = (valor: string, negrita = false, tamano = 14) => {
    documento
      .font(negrita ? "Helvetica-Bold" : "Helvetica")
      .fontSize(tamano)
      .fillColor("#201408")
      .text(valor, { width: documento.page.width - 96, lineGap: 4 })
    documento.moveDown(0.35)
  }
  try {
    documento.addPage()
    texto("Informe de resultados", true, 20)
    texto(`Usuario: ${mostrarNombre}`)
    texto(
      `Generado: ${fecha(informe.generatedAt, informe.timeZone)} · Zona horaria: ${informe.timeZone}`,
    )
    if (consulta.scope === "single") texto("Alcance: un ejercicio completado.")
    else {
      texto(
        `Período: ${
          consulta.from
            ? `desde ${fecha(consulta.from, informe.timeZone)} (incluido)`
            : "desde el primer registro disponible"
        }; ${
          consulta.to
            ? `hasta ${fecha(consulta.to, informe.timeZone)} (límite excluido)`
            : "hasta la generación del informe"
        }.`,
      )
      if (consulta.category)
        texto(`Categoría seleccionada: ${categorias[consulta.category]}`)
      if (consulta.exercise)
        texto(`Ejercicio seleccionado: ${ejercicioNombres[consulta.exercise]}`)
      if (consulta.difficulty)
        texto(`Dificultad utilizada: ${niveles[consulta.difficulty]}`)
    }
    texto(
      "Este informe describe el desempeño en ejercicios de MenteClear. No es una evaluación clínica ni permite establecer diagnósticos.",
      true,
    )
    texto("Resumen de la selección", true, 16)
    texto(
      `Ejercicios completados: ${informe.period.completedExercises} · Sesiones completadas: ${informe.period.completedSessions}`,
    )
    texto(
      `Aciertos registrados: ${numero(informe.period.correctAnswers)} · Errores registrados: ${numero(informe.period.errors)}`,
    )
    texto(
      `Precisión ponderada: ${numero(informe.period.accuracy, " %")} · Tiempo activo total: ${numero(informe.period.activeSeconds, " s")}`,
    )
    texto(
      "La precisión ponderada y los totales se calculan con las mismas reglas del panel. El tiempo activo proviene del dispositivo y excluye pausas. Los intentos y unidades varían entre ejercicios.",
    )
    if (
      informe.period.durationMeasurements < informe.period.completedExercises ||
      informe.period.accuracyMeasurements < informe.period.completedExercises
    )
      texto(
        `Cobertura: ${informe.period.accuracyMeasurements} ejercicios con aciertos y errores registrados; ${informe.period.durationMeasurements} con duración registrada. Los datos ausentes no se inventan.`,
      )
    texto("Resultados por categoría", true, 16)
    for (const categoria of informe.categories.filter(
      (elemento) => elemento.completedExercises,
    ))
      texto(
        `${categorias[categoria.category]}: ${categoria.completedExercises} ejercicios · Precisión ${numero(categoria.accuracy, " %")} · Tiempo activo ${
          categoria.durationMeasurements
            ? numero(categoria.activeSeconds, " s")
            : "Sin datos"
        }`,
      )
    texto("Detalle de actividades", true, 16)
    let indice = 0
    for await (const elemento of leerFilas(filas)) {
      senal?.throwIfAborted()
      if (documento.y > documento.page.height - 230) documento.addPage()
      texto(
        `${++indice}. ${elemento.exerciseName ?? ejercicioNombres[elemento.exerciseType ?? ""] ?? elemento.exerciseId ?? "Nombre no registrado"}`,
        true,
        14,
      )
      texto(
        `${
          elemento.cognitiveFunctionId &&
          CATEGORIA_IDS.includes(elemento.cognitiveFunctionId)
            ? categorias[elemento.cognitiveFunctionId]
            : "Categoría no registrada"
        } · Finalización: ${fecha(elemento.completedAt, informe.timeZone)}`,
      )
      if (elemento.completionDateSource === "createdAt")
        texto(
          "Fecha de registro original; no se registró una fecha de finalización independiente.",
        )
      texto(
        `Dificultad utilizada: ${
          elemento.difficultyBefore
            ? niveles[elemento.difficultyBefore]
            : "Sin datos"
        } · Aciertos: ${numero(elemento.correctAnswers)} · Errores: ${numero(elemento.errors)}`,
      )
      texto(
        `Precisión del ejercicio: ${numero(elemento.accuracy, " %")} · Duración activa: ${numero(elemento.actualTimeSeconds, " s")}`,
      )
      if (elemento.actualResponseTimeSeconds !== undefined)
        texto(
          `Tiempo activo de respuesta: ${numero(elemento.actualResponseTimeSeconds, " s")}`,
        )
      if (elemento.attempts !== undefined)
        texto(`Intentos: ${numero(elemento.attempts)}`)
      if (elemento.averageResponseTimeMs !== undefined)
        texto(
          `Tiempo medio de respuesta: ${numero(elemento.averageResponseTimeMs, " ms")}`,
        )
      if (elemento.timeouts !== undefined)
        texto(`Sin respuesta: ${numero(elemento.timeouts)}`)
      if (elemento.falseStarts !== undefined)
        texto(`Salidas anticipadas: ${numero(elemento.falseStarts)}`)
      documento.moveDown(0.5)
      await setImmediate()
    }
    documento.end()
    await salida
  } catch (error) {
    documento.destroy(
      error instanceof Error ? error : new Error("Error al generar PDF"),
    )
    await salida.catch(() => {})
    throw error
  }
}

export async function crearResultadosPdf(
  uid: string,
  consulta: PdfExportarConsulta,
  senal?: AbortSignal,
  dependencias = fuentes,
  ahora = new Date(),
) {
  const directorio = await mkdtemp(join(tmpdir(), "menteclear-pdf-"))
  const limpiar = () => rm(directorio, { recursive: true, force: true })
  const filasRuta = join(directorio, "results.ndjson"),
    pdfRuta = join(directorio, "results.pdf")
  try {
    senal?.throwIfAborted()
    const perfil = await dependencias.profile(uid)
    const filas = await open(filasRuta, "wx", 0o600)
    async function* etapaFilas() {
      for await (const elemento of dependencias.results(uid, consulta)) {
        senal?.throwIfAborted()
        if (
          !Number.isFinite(Date.parse(elemento.completedAt)) ||
          new Date(elemento.completedAt) > ahora
        )
          continue
        await filas.write(`${JSON.stringify(elemento)}\n`)
        yield elemento
      }
    }
    let informe: InformeEstadisticas
    try {
      informe = await calcularEstadisticas(
        etapaFilas(),
        {},
        "all",
        consulta.timeZone ?? "UTC",
        ahora,
      )
    } finally {
      await filas.close()
    }
    if (!informe.period.completedExercises)
      throw new PdfExportarError(
        consulta.scope === "single"
          ? "El resultado no existe dentro de tu historial completado."
          : "No hay ejercicios completados para la selección indicada.",
      )
    const mostrarNombre =
      [
        perfil?.firstName ?? perfil?.nombre,
        perfil?.lastName ?? perfil?.apellido,
      ]
        .filter((valor) => typeof valor === "string" && valor.trim())
        .join(" ") || "Nombre no registrado"
    await renderizarPdf(
      pdfRuta,
      filasRuta,
      informe,
      mostrarNombre,
      consulta,
      senal,
    )
    return {
      path: pdfRuta,
      size: (await stat(pdfRuta)).size,
      report: informe,
      cleanup: limpiar,
      filename: `MenteClear-resultados-${ahora.toISOString().slice(0, 10)}.pdf`,
    }
  } catch (error) {
    await limpiar()
    throw error
  }
}
