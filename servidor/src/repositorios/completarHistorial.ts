import { Timestamp } from "firebase-admin/firestore"

function convertirMarcaTiempo(valor: unknown): Timestamp | null {
  if (valor instanceof Timestamp) return valor
  if (valor instanceof Date && Number.isFinite(valor.getTime()))
    return Timestamp.fromDate(valor)
  if (typeof valor === "string" && Number.isFinite(Date.parse(valor)))
    return Timestamp.fromDate(new Date(valor))
  return null
}

export function completarCamposHistorial(
  uid: string,
  resultado: Record<string, unknown>,
  sesion: Record<string, unknown>,
): Record<string, unknown> | null {
  if (sesion.status !== "completed") return null

  const fechaCompletado = convertirMarcaTiempo(resultado.completedAt)
  const fechaCreacion = convertirMarcaTiempo(resultado.createdAt)
  const completado =
    fechaCompletado ?? fechaCreacion ?? convertirMarcaTiempo(sesion.endedAt)
  if (!completado) return null

  const cambios: Record<string, unknown> = {}
  if (!(resultado.completedAt instanceof Timestamp)) {
    cambios.completedAt = completado
    cambios.completionDateSource = fechaCompletado
      ? "completedAt"
      : fechaCreacion
        ? "createdAt"
        : "sessionEndedAt"
  }

  if (resultado.userId !== uid) cambios.userId = uid
  return cambios
}
