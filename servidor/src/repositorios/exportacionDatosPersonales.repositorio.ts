import { FieldPath } from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import { obtenerPerfilUsuario } from "./usuario.repositorio"
import type { ExportarDocumento } from "../../../compartido/exportacionDatosPersonales"

type UsuarioColeccion = "progress" | "sessions"

async function* documentos(
  ruta: string,
  baseDatos: ReturnType<typeof obtenerFirestoreAdmin>,
  senal?: AbortSignal,
): AsyncGenerator<ExportarDocumento> {
  let despues: string | undefined
  let tieneMas = true
  while (tieneMas) {
    senal?.throwIfAborted()
    let consulta = baseDatos
      .collection(ruta)
      .orderBy(FieldPath.documentId())
      .limit(100)
    if (despues) consulta = consulta.startAfter(despues)
    const instantanea = await consulta.get()
    for (const documento of instantanea.docs) {
      senal?.throwIfAborted()
      yield { id: documento.id, data: documento.data() }
    }
    tieneMas = instantanea.size === 100
    const siguiente = instantanea.docs.at(-1)?.id
    if (tieneMas && (!siguiente || siguiente === despues))
      throw new Error("La paginación de datos personales no avanzó.")
    despues = siguiente
  }
}

export function personalDatosFuente(
  uid: string,
  baseDatos = obtenerFirestoreAdmin(),
) {
  return {
    profile: () => obtenerPerfilUsuario(uid, baseDatos),
    documents: (coleccion: UsuarioColeccion, senal?: AbortSignal) =>
      documentos(`users/${uid}/${coleccion}`, baseDatos, senal),
    results: (idSesion: string, senal?: AbortSignal) =>
      documentos(`users/${uid}/sessions/${idSesion}/results`, baseDatos, senal),
  }
}
