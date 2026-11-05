import { appendFile, mkdir } from "node:fs/promises"
import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const registroDirectorio = path.join(raiz, "logs")
const anfitrion = process.env.LOG_SERVER_HOST
const puerto = Number(process.env.LOG_SERVER_PORT)
const servidorUrl = process.env.LOG_SERVER_URL

if (!anfitrion || !puerto || !servidorUrl) {
  throw new Error(
    "Faltan LOG_SERVER_HOST, LOG_SERVER_PORT o LOG_SERVER_URL en el entorno.",
  )
}

function registroArchivoNombre(fecha = new Date()) {
  return `${fecha.toISOString().slice(0, 10)}.log`
}

function enviarJson(respuesta, estado, cuerpo) {
  respuesta.writeHead(estado, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  })
  respuesta.end(JSON.stringify(cuerpo))
}

const servidor = createServer(async (solicitar, respuesta) => {
  if (solicitar.method === "OPTIONS") {
    respuesta.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    })
    respuesta.end()
    return
  }

  if (solicitar.method === "GET" && solicitar.url === "/api/logs/health") {
    enviarJson(respuesta, 200, { ok: true })
    return
  }

  if (solicitar.method !== "POST" || solicitar.url !== "/api/logs") {
    enviarJson(respuesta, 404, { error: "Not found" })
    return
  }

  let cuerpo = ""
  for await (const fragmento of solicitar) {
    cuerpo += fragmento
    if (cuerpo.length > 100_000) {
      enviarJson(respuesta, 413, { error: "Payload too large" })
      solicitar.destroy()
      return
    }
  }

  try {
    const interpretado = JSON.parse(cuerpo)
    await mkdir(registroDirectorio, { recursive: true })
    await appendFile(
      path.join(registroDirectorio, registroArchivoNombre()),
      `${JSON.stringify(interpretado)}\n`,
      "utf8",
    )
    enviarJson(respuesta, 201, { ok: true })
  } catch {
    enviarJson(respuesta, 400, { error: "Invalid log entry" })
  }
})

servidor.listen(puerto, anfitrion, () => {
  console.log(`Log server listening on ${servidorUrl}`)
  console.log(`Daily log files: ${registroDirectorio}`)
})
