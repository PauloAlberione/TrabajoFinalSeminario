import test from "node:test"
import assert from "node:assert/strict"
import { crearConexionServidor } from "../../../src/servicios/disponibilidadServidor"

test("Las solicitudes concurrentes comparten la espera de arranque", async () => {
  let consultas = 0
  const conexion = crearConexionServidor("https://ejemplo.test", {
    consultar: async () => {
      consultas++
      await new Promise((resolver) => setTimeout(resolver, 15))
      return Response.json({ ok: true })
    },
    avisoMs: 2,
  })
  const estados: string[] = []
  conexion.suscribirse(() => estados.push(conexion.obtenerEstado()))
  await Promise.all([
    conexion.esperar(),
    conexion.esperar(),
    conexion.esperar(),
  ])
  assert.equal(consultas, 1)
  assert.deepEqual(estados, ["conectando", "demorada", "disponible"])
  await conexion.esperar()
  assert.equal(consultas, 1)
})

test("Solo se consulta /health y se recupera un inicio lento o un 503", async () => {
  const rutas: string[] = []
  const conexion = crearConexionServidor("https://ejemplo.test/", {
    consultar: async (url) => {
      rutas.push(String(url))
      return rutas.length < 3
        ? new Response("Iniciando", { status: 503 })
        : Response.json({ ok: true })
    },
    intervaloMs: 1,
    limiteMs: 1000,
  })
  await conexion.esperar()
  assert.deepEqual(rutas, Array(3).fill("https://ejemplo.test/health"))
})

test("Una cancelación no interrumpe la conexión compartida ni ejecuta la solicitud cancelada", async () => {
  const conexion = crearConexionServidor("https://ejemplo.test", {
    consultar: async () => {
      await new Promise((resolver) => setTimeout(resolver, 15))
      return Response.json({ ok: true })
    },
  })
  const controlador = new AbortController()
  const cancelada = conexion.esperar(controlador.signal)
  const restante = conexion.esperar()
  controlador.abort()
  await assert.rejects(cancelada, { name: "AbortError" })
  await restante
  assert.equal(conexion.obtenerEstado(), "disponible")
})

test("El fallo tiene un límite y admite un nuevo intento", async () => {
  let disponible = false
  const conexion = crearConexionServidor("https://ejemplo.test", {
    consultar: async () => {
      if (!disponible) throw new TypeError("Sin red")
      return Response.json({ ok: true })
    },
    limiteMs: 20,
    intervaloMs: 2,
    avisoMs: 1,
  })
  await assert.rejects(() => conexion.esperar(), {
    name: "BackendUnavailableError",
  })
  assert.equal(conexion.obtenerEstado(), "sinConexion")
  disponible = true
  await conexion.esperar()
  assert.equal(conexion.obtenerEstado(), "disponible")
})
