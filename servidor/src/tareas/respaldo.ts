import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { parseArgs } from "node:util"
import {
  fuenteRespaldo,
  restaurarDocumentosEnEmulador,
} from "../repositorios/respaldo.repositorio"
import {
  cifrarCopia,
  descifrarCopia,
  prepararCopia,
} from "../servicios/respaldo.servicio"

async function ejecutar() {
  const { positionals: posiciones, values: opciones } = parseArgs({
    allowPositionals: true,
    options: {
      archivo: { type: "string" },
      clave: { type: "string" },
      emulador: { type: "string" },
      proyecto: { type: "string" },
    },
  })
  const accion = posiciones[0]
  if (
    posiciones.length !== 1 ||
    !["crear", "verificar", "restaurar"].includes(accion)
  )
    throw new Error(
      "Usá crear, verificar o restaurar con las opciones correspondientes.",
    )

  if (accion === "crear") {
    const proyecto = process.env.FIREBASE_PROJECT_ID
    const clavePublica = process.env.BACKUP_PUBLIC_KEY
    if (!proyecto || !/^[a-z][a-z0-9-]+$/.test(proyecto) || !clavePublica)
      throw new Error("Faltan FIREBASE_PROJECT_ID o BACKUP_PUBLIC_KEY.")
    const copia = await prepararCopia(
      proyecto,
      await fuenteRespaldo(proyecto),
      {
        reglas: await readFile("firestore.rules", "utf8"),
        indices: JSON.parse(await readFile("firestore.indexes.json", "utf8")),
        revision: process.env.GITHUB_SHA ?? null,
      },
    )
    const archivo = cifrarCopia(copia, clavePublica)
    const directorio = process.env.BACKUP_OUTPUT_DIR ?? "respaldos-locales"
    await mkdir(directorio, { recursive: true, mode: 0o700 })
    const fecha = copia.creadaEn.slice(0, 10)
    await writeFile(join(directorio, `menteclear-${fecha}.mcr`), archivo, {
      mode: 0o600,
    })
    console.log(
      JSON.stringify({
        estado: "copia_cifrada",
        documentos: copia.documentos.length,
        bytes: archivo.length,
        fechaLectura: copia.fechaLectura,
      }),
    )
    return
  }

  if (!opciones.archivo || !opciones.clave)
    throw new Error(
      "Indicá --archivo y --clave (ruta de la clave privada local).",
    )
  const copia = descifrarCopia(
    await readFile(opciones.archivo),
    await readFile(opciones.clave, "utf8"),
  )
  if (accion === "restaurar") {
    if (!opciones.emulador || !opciones.proyecto)
      throw new Error(
        "Indicá --emulador 127.0.0.1:PUERTO y --proyecto demo-NOMBRE.",
      )
    await restaurarDocumentosEnEmulador(
      copia.documentos,
      opciones.emulador,
      opciones.proyecto,
    )
  }
  console.log(
    JSON.stringify({
      estado:
        accion === "restaurar" ? "restaurada_en_emulador" : "copia_verificada",
      documentos: copia.documentos.length,
      fechaLectura: copia.fechaLectura,
      incluyeAutenticacion: copia.incluyeAutenticacion,
    }),
  )
}

ejecutar().catch(() => {
  // Los errores del proveedor pueden contener documentos o credenciales en su contexto.
  console.error(
    "No se completó la operación de respaldo. Revisá las opciones, permisos, clave y límites; no se publicará un archivo parcial.",
  )
  process.exitCode = 1
})
