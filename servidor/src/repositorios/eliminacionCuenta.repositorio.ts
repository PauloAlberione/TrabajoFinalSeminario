import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto"
import {
  FieldValue,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"

export class CuentaEliminacionBloqueadoError extends Error {}

export class EliminacionComprobanteError extends Error {}

export const eliminacionBloqueoId = (uid: string) =>
  createHash("sha256").update(uid).digest("hex")

export async function verificarCuentaModificable(
  transaccion: Transaction,
  uid: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  if (
    (
      await transaccion.get(
        baseDatos.doc(`accountDeletionLocks/${eliminacionBloqueoId(uid)}`),
      )
    ).exists
  )
    throw new CuentaEliminacionBloqueadoError(
      "La cuenta está en proceso de eliminación.",
    )
}

export async function esCuentaEliminando(
  uid: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  return (
    await baseDatos
      .doc(`accountDeletionLocks/${eliminacionBloqueoId(uid)}`)
      .get()
  ).exists
}

const resumen = (secreto: string) =>
  createHash("sha256").update(secreto).digest("hex")

export async function prepararCuentaEliminacion(
  uid: string,
  ahora = new Date(),
  baseDatos = obtenerFirestoreAdmin(),
) {
  const id = eliminacionBloqueoId(uid),
    secreto = randomBytes(32).toString("hex")
  await baseDatos.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, uid, baseDatos)
    const referencia = baseDatos.doc(`accountDeletionJobs/${id}`)
    const anterior = await transaccion.get(referencia)
    if (anterior.data()?.status === "pending")
      throw new CuentaEliminacionBloqueadoError(
        "Ya existe una eliminación en curso.",
      )
    transaccion.set(referencia, {
      uid,
      secretHash: resumen(secreto),
      status: "prepared",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(ahora.getTime() + 86400000),
    })
  })
  return `${id}.${secreto}`
}

export async function leerEliminacionComprobante(
  comprobante: unknown,
  ahora = new Date(),
  baseDatos = obtenerFirestoreAdmin(),
) {
  if (
    typeof comprobante !== "string" ||
    !/^[0-9a-f]{64}\.[0-9a-f]{64}$/.test(comprobante)
  )
    throw new EliminacionComprobanteError()
  const [id, secreto] = comprobante.split(".")
  const tarea = (await baseDatos.doc(`accountDeletionJobs/${id}`).get()).data()
  const almacenado =
    typeof tarea?.secretHash === "string"
      ? Buffer.from(tarea.secretHash, "hex")
      : Buffer.alloc(0)
  const efectivo = Buffer.from(resumen(secreto), "hex")
  if (
    !tarea ||
    almacenado.length !== efectivo.length ||
    !timingSafeEqual(almacenado, efectivo) ||
    (tarea.expiresAt instanceof Timestamp &&
      tarea.expiresAt.toMillis() <= ahora.getTime())
  )
    throw new EliminacionComprobanteError()
  return { id, job: tarea }
}

export async function reservaCuentaEliminacion(
  id: string,
  ahora = new Date(),
  baseDatos = obtenerFirestoreAdmin(),
) {
  return baseDatos.runTransaction(async (transaccion) => {
    const referencia = baseDatos.doc(`accountDeletionJobs/${id}`),
      instantanea = await transaccion.get(referencia),
      tarea = instantanea.data()
    if (!tarea) throw new EliminacionComprobanteError()
    if (tarea.status === "completed") return { status: "completed" as const }
    if (
      !["prepared", "pending"].includes(String(tarea.status)) ||
      typeof tarea.uid !== "string"
    )
      throw new EliminacionComprobanteError()
    if (
      tarea.status === "prepared" &&
      (!(tarea.expiresAt instanceof Timestamp) ||
        tarea.expiresAt.toMillis() <= ahora.getTime())
    )
      throw new EliminacionComprobanteError()
    if (
      tarea.leaseUntil instanceof Timestamp &&
      tarea.leaseUntil.toMillis() > ahora.getTime()
    )
      return { status: "busy" as const }
    const uid = tarea.uid,
      bloqueo = baseDatos.doc(
        `accountDeletionLocks/${eliminacionBloqueoId(uid)}`,
      ),
      perfil = baseDatos.doc(`users/${uid}`)
    const [bloqueoInstantanea, perfilInstantanea] = await Promise.all([
      transaccion.get(bloqueo),
      transaccion.get(perfil),
    ])
    if (bloqueoInstantanea.exists && bloqueoInstantanea.data()?.jobId !== id)
      throw new CuentaEliminacionBloqueadoError(
        "Ya existe una eliminación en curso.",
      )
    const propietario = randomUUID()
    transaccion.set(bloqueo, {
      jobId: id,
      status: "pending",
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (perfilInstantanea.exists)
      transaccion.update(perfil, {
        active: false,
        "reminderPreferences.enabled": false,
        "accessibilityPreferences.recordatorios": false,
        reminderNextAt: null,
        reminderOccurrenceAt: null,
        reminderVersion: randomUUID(),
      })
    transaccion.update(referencia, {
      status: "pending",
      owner: propietario,
      nextAttemptAt: Timestamp.fromMillis(ahora.getTime() + 600000),
      attempts: Number(tarea.attempts ?? 0) + 1,
      expiresAt: FieldValue.delete(),
      leaseUntil: Timestamp.fromMillis(ahora.getTime() + 600000),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { status: "claimed" as const, uid, owner: propietario }
  })
}

export async function finalizarCuentaEliminacion(
  id: string,
  uid: string,
  propietario: string,
  completado: boolean,
  baseDatos = obtenerFirestoreAdmin(),
) {
  return baseDatos.runTransaction(async (transaccion) => {
    const referencia = baseDatos.doc(`accountDeletionJobs/${id}`),
      tarea = (await transaccion.get(referencia)).data()
    if (tarea?.status === "completed") return true
    if (!tarea || tarea.owner !== propietario) return false
    const venceEjercicios = Timestamp.fromMillis(Date.now() + 86400000)
    transaccion.update(referencia, {
      status: completado ? "completed" : "pending",
      leaseUntil: Timestamp.fromMillis(0),
      updatedAt: FieldValue.serverTimestamp(),
      ...(completado
        ? {
            uid: FieldValue.delete(),
            owner: FieldValue.delete(),
            expiresAt: venceEjercicios,
          }
        : {
            nextAttemptAt: Timestamp.fromMillis(
              Date.now() +
                Math.min(
                  3600000,
                  60000 * 2 ** Math.min(6, Number(tarea.attempts ?? 1)),
                ),
            ),
          }),
    })
    if (completado)
      transaccion.set(
        baseDatos.doc(`accountDeletionLocks/${eliminacionBloqueoId(uid)}`),
        { jobId: id, status: "completed", expiresAt: venceEjercicios },
      )
    return completado
  })
}

export async function eliminarCuentaDocumentos(
  uid: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  await baseDatos.recursiveDelete(baseDatos.doc(`users/${uid}`))
}

export async function pendienteCuentaEliminaciones(
  baseDatos = obtenerFirestoreAdmin(),
) {
  const instantanea = await baseDatos
    .collection("accountDeletionJobs")
    .where("status", "==", "pending")
    .where("nextAttemptAt", "<=", Timestamp.now())
    .orderBy("nextAttemptAt")
    .limit(20)
    .get()
  return instantanea.docs.map((documento) => documento.id)
}
