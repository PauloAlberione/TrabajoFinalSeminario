export type EstadoConexion = "disponible" | "conectando" | "demorada" | "sinConexion"

interface OpcionesConexion {
  consultar?: typeof fetch
  avisoMs?: number
  limiteMs?: number
  intentoMs?: number
  intervaloMs?: number
  vigenciaMs?: number
}

export function crearConexionServidor(
  direccion: string | undefined,
  opciones: OpcionesConexion = {},
) {
  const consultar = opciones.consultar ?? fetch
  const limiteMs = opciones.limiteMs ?? 90000
  const intentoMs = opciones.intentoMs ?? 10000
  const intervaloMs = opciones.intervaloMs ?? 2500
  let ultimaRespuesta = 0
  let pendiente: Promise<void> | undefined
  let estado: EstadoConexion = "disponible"
  const observadores = new Set<() => void>()

  function cambiarEstado(nuevo: EstadoConexion) {
    if (estado === nuevo) return
    estado = nuevo
    for (const observar of observadores) observar()
  }

  function registrarRespuesta() {
    ultimaRespuesta = Date.now()
    cambiarEstado("disponible")
  }

  async function comprobar() {
    cambiarEstado("conectando")
    const aviso = setTimeout(
      () => cambiarEstado("demorada"),
      opciones.avisoMs ?? 3000,
    )
    const vence = Date.now() + limiteMs
    try {
      while (Date.now() < vence) {
        try {
          const respuesta = await consultar(
            `${direccion!.replace(/\/$/, "")}/health`,
            {
              cache: "no-store",
              signal: AbortSignal.timeout(
                Math.max(1, Math.min(intentoMs, vence - Date.now())),
              ),
            },
          )
          if (respuesta.ok && (await respuesta.json()).ok === true) {
            registrarRespuesta()
            return
          }
        } catch {
          // Solo se reintenta la consulta de salud; nunca una escritura del usuario.
        }
        const espera = Math.min(intervaloMs, vence - Date.now())
        if (espera > 0)
          await new Promise((resolver) => setTimeout(resolver, espera))
      }
      cambiarEstado("sinConexion")
      const error = new Error(
        "El servidor todavía no responde. Revisá tu conexión y volvé a intentar.",
      )
      error.name = "BackendUnavailableError"
      throw error
    } finally {
      clearTimeout(aviso)
    }
  }

  function esperar(senal?: AbortSignal | null): Promise<void> {
    if (senal?.aborted) return Promise.reject(senal.reason)
    if (
      !direccion ||
      Date.now() - ultimaRespuesta < (opciones.vigenciaMs ?? 60000)
    )
      return Promise.resolve()
    pendiente ??= comprobar().finally(() => {
      pendiente = undefined
    })
    if (!senal) return pendiente
    return new Promise((resolver, rechazar) => {
      const cancelar = () => rechazar(senal.reason)
      senal.addEventListener("abort", cancelar, { once: true })
      pendiente!
        .then(resolver, rechazar)
        .finally(() => senal.removeEventListener("abort", cancelar))
    })
  }

  return {
    esperar,
    registrarRespuesta,
    obtenerEstado: () => estado,
    suscribirse: (observar: () => void) => {
      observadores.add(observar)
      return () => {
        observadores.delete(observar)
      }
    },
  }
}
