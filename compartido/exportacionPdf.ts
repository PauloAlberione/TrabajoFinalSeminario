import type { FiltrosHistorial } from "./historial"

interface PdfExportarOpciones {
  timeZone?: string
}

type HistorialPdfConsulta = FiltrosHistorial & PdfExportarOpciones & {
  scope: "history"
}

type IndividualPdfConsulta = PdfExportarOpciones & {
  scope: "single"
  sessionId: string
  resultId: string
}

export type PdfExportarConsulta = HistorialPdfConsulta | IndividualPdfConsulta
