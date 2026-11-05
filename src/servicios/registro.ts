type RegistroNivel = "info" | "warn" | "error"

type RegistroContexto = Record<string, unknown>

const registroServidorUrl = import.meta.env.VITE_LOG_SERVER_URL?.trim()

function localRegistroClave() {
  return `menteclear-logs-${new Date().toISOString().slice(0, 10)}`
}

export function registrarEvento(
  nivel: RegistroNivel,
  evento: string,
  contexto: RegistroContexto = {},
) {
  const entrada = {
    timestamp: new Date().toISOString(),
    localTime: new Date().toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "medium",
    }),
    level: nivel,
    event: evento,
    context: contexto,
  }

  const consolaMetodo =
    nivel === "error"
      ? console.error
      : nivel === "warn"
        ? console.warn
        : console.info
  consolaMetodo(`[${evento}]`, contexto)

  try {
    const clave = localRegistroClave()
    const anterior = JSON.parse(
      localStorage.getItem(clave) || "[]",
    ) as unknown[]
    localStorage.setItem(
      clave,
      JSON.stringify([...anterior.slice(-199), entrada]),
    )
  } catch {
    // El registro no debe interrumpir al usuario si el almacenamiento del navegador no está disponible.
  }

  if (!registroServidorUrl) return

  void fetch(`${registroServidorUrl}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entrada),
    keepalive: true,
  }).catch(() => undefined)
}
