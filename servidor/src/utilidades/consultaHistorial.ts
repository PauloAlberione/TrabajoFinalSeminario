import { createHash } from "node:crypto"
import type { ConsultaHistorial } from "../../../compartido/historial"

export class HistorialConsultaError extends Error {}

export const validoHistorialId = (id: string) => /^[\w-]{1,128}$/.test(id)

export function historialHuella(uid: string, consulta: ConsultaHistorial) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        uid,
        consulta.category ?? null,
        consulta.exercise ?? null,
        consulta.difficulty ?? null,
        consulta.from ?? null,
        consulta.to ?? null,
        consulta.limit ?? 20,
        consulta.includeDetails ?? false,
      ]),
    )
    .digest("hex")
}
