import { FieldPath } from "firebase-admin/firestore"
import { obtenerFirestoreAdmin } from "../servidor/src/configuracion/firebaseAdmin.ts"
import { completarCamposHistorial } from "../servidor/src/repositorios/completarHistorial.ts"

const uid = process.argv
  .find((argumento) => argumento.startsWith("--uid="))
  ?.slice(6)

if (!uid || uid.includes("/") || uid.length > 128)
  throw new Error(
    "Indicá --uid=<UID>. Sin --apply, la herramienta solo informa los cambios propuestos.",
  )

const aplicar = process.argv.includes("--apply"),
  baseDatos = obtenerFirestoreAdmin()
const cantidades = { checked: 0, proposed: 0, updated: 0, missingDate: 0 }
let despues
let lote = baseDatos.batch(),
  escrituras = 0

async function vaciar() {
  if (escrituras) {
    await lote.commit()
    lote = baseDatos.batch()
    escrituras = 0
  }
}

while (true) {
  let consulta = baseDatos
    .collection(`users/${uid}/sessions`)
    .where("status", "==", "completed")
    .orderBy(FieldPath.documentId())
    .limit(100)
  if (despues) consulta = consulta.startAfter(despues)
  const sesiones = await consulta.get()
  for (const sesion of sesiones.docs) {
    const resultados = await sesion.ref.collection("results").get()
    for (const resultado of resultados.docs) {
      cantidades.checked++
      const cambios = completarCamposHistorial(
        uid,
        resultado.data(),
        sesion.data(),
      )
      if (cambios === null) {
        cantidades.missingDate++
        continue
      }
      if (!Object.keys(cambios).length) continue
      cantidades.proposed++
      if (aplicar) {
        lote.update(resultado.ref, cambios)
        escrituras++
        cantidades.updated++
        if (escrituras === 400) await vaciar()
      }
    }
  }
  if (sesiones.size < 100) break
  despues = sesiones.docs.at(-1)
}

await vaciar()

console.log(
  JSON.stringify({ mode: aplicar ? "apply" : "dry-run", ...cantidades }),
)
