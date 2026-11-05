import type {
  ActividadPendiente,
  ActividadCancelada,
  PaginaCanceladas,
} from "../../compartido/sesionesCanceladas"
import type { ConsultaHistorial } from "../../compartido/historial"
import type { PuntoControlEjercicio } from "../../compartido/sesionEjercicio"
import type { SesionResultadoSolicitud } from "../../compartido/resultados"
import { autenticacionFirebase } from "./firebase"

const direccionApi = import.meta.env.VITE_BACKEND_URL?.trim()

async function autenticadoRespuesta(
  ruta: string,
  opciones: RequestInit = {},
  autenticar = true,
): Promise<Response> {
  if (!direccionApi) {
    const error = new Error(
      "El backend no está configurado. Define VITE_BACKEND_URL en .env.local.",
    )
    error.name = "BackendConfigurationError"
    throw error
  }
  const token = autenticar
    ? await autenticacionFirebase?.currentUser?.getIdToken()
    : undefined
  const respuesta = await fetch(`${direccionApi}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  })
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}))
    const error = new Error(
      typeof cuerpo.error === "string"
        ? cuerpo.error
        : "No se pudo completar la operación.",
    )
    error.name = `BackendHttpError${respuesta.status}`
    throw error
  }
  return respuesta
}

async function solicitar<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  return (await autenticadoRespuesta(ruta, opciones)).json() as Promise<T>
}

export function ejercicioAlmacenamientoClave(sufijo: string) {
  return `menteclear:exercise:${autenticacionFirebase?.currentUser?.uid ?? "anonymous"}:${sufijo}`
}

const propietarios = new Map<string, string>()

export function limpiarEjercicioPropietarios() {
  propietarios.clear()
}

export function propietarioToken(id: string) {
  try {
    return (
      propietarios.get(id) ??
      sessionStorage.getItem(ejercicioAlmacenamientoClave(`owner:${id}`)) ??
      undefined
    )
  } catch {
    return propietarios.get(id)
  }
}

export function recordarSesionPropietario(id: string, token: string) {
  propietarios.set(id, token)
  try {
    sessionStorage.setItem(ejercicioAlmacenamientoClave(`owner:${id}`), token)
  } catch {
    /* La recuperación del servidor también funciona sin almacenamiento del navegador. */
  }
}

async function iniciarEjercicio<T>(ejercicioTipo: string): Promise<T> {
  const sesion = await solicitar<T & {
    id: string
    ownerToken: string
  }>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ exerciseType: ejercicioTipo, resumable: true }),
  })
  recordarSesionPropietario(sesion.id, sesion.ownerToken)
  try {
    localStorage.setItem(
      ejercicioAlmacenamientoClave("pending"),
      JSON.stringify({ id: sesion.id, type: ejercicioTipo }),
    )
  } catch {
    /* El servidor sigue ofreciendo esta sesión para recuperarla. */
  }
  return sesion
}

export const api = {
  prepararCuentaEliminacion: () =>
    solicitar<{
      ticket: string
    }>("/api/users/me/deletion/prepare", {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    }),
  continuarCuentaEliminacion: async (comprobante: string): Promise<{
    status: "completed" | "pending"
  }> =>
    (
      await autenticadoRespuesta(
        "/api/users/me/deletion/continue",
        { method: "POST", body: JSON.stringify({ ticket: comprobante }) },
        false,
      )
    ).json(),
  obtenerRecordatorioPreferencias: (senal?: AbortSignal) =>
    solicitar<import("../../compartido/recordatorios").RecordatorioPreferenciasRespuesta>(
      "/api/reminders/me",
      { signal: senal },
    ),
  actualizarRecordatorioPreferencias: (
    ajustes: import("../../compartido/recordatorios").ConfiguracionRecordatorios,
  ) =>
    solicitar<import("../../compartido/recordatorios").RecordatorioPreferenciasRespuesta>(
      "/api/reminders/me",
      { method: "PATCH", body: JSON.stringify(ajustes) },
    ),
  descargarPersonalDatos: async (senal?: AbortSignal) => {
    const respuesta = await autenticadoRespuesta("/api/users/me/export", {
      signal: senal,
    })
    if (!respuesta.headers.get("content-type")?.includes("application/json"))
      throw new Error("No se recibió una copia JSON válida.")
    const blob = await respuesta.blob()
    if (blob.size < 2) throw new Error("La copia de datos está vacía.")
    return blob
  },
  descargarResultadosPdf: async (
    consulta: import("../../compartido/exportacionPdf").PdfExportarConsulta,
    senal?: AbortSignal,
  ) => {
    const parametros = new URLSearchParams()
    for (const [clave, valor] of Object.entries({
      ...consulta,
      timeZone:
        consulta.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    }))
      if (valor !== undefined && valor !== "")
        parametros.set(clave, String(valor))
    const respuesta = await autenticadoRespuesta(
      `/api/results/export/pdf?${parametros}`,
      { signal: senal },
    )
    if (!respuesta.headers.get("content-type")?.includes("application/pdf"))
      throw new Error("La respuesta no es un PDF válido.")
    const blob = await respuesta.blob()
    if (blob.size < 5 || (await blob.slice(0, 5).text()) !== "%PDF-")
      throw new Error("No se recibió un PDF completo.")
    return blob
  },
  obtenerEstadisticas: (
    rango: import("../../compartido/estadisticas").EstadisticasRango = "30",
    senal?: AbortSignal,
  ) =>
    solicitar<import("../../compartido/estadisticas").InformeEstadisticas>(
      `/api/statistics?range=${rango}&timeZone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
      { signal: senal },
    ),
  startExercise: iniciarEjercicio,
  startMemory: iniciarEjercicio,
  pendienteSesiones: () => solicitar<ActividadPendiente[]>("/api/sessions"),
  cancelarSesionPendiente: async (id: string) => {
    const claveEstado = ejercicioAlmacenamientoClave(`state:${id}`),
      clavePendiente = ejercicioAlmacenamientoClave("pending"),
      clavePropietario = ejercicioAlmacenamientoClave(`owner:${id}`)
    let checkpoint: PuntoControlEjercicio | undefined
    try {
      checkpoint =
        JSON.parse(localStorage.getItem(claveEstado) ?? "null") ?? undefined
    } catch {
      /* El servidor conserva su punto de recuperación si la copia local no se puede leer. */
    }
    const resultado = await solicitar<{
      id: string
      status: "cancelled"
    }>(`/api/sessions/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      body: JSON.stringify({
        checkpoint,
        ownerToken: propietarioToken(id) ?? checkpoint?.writerToken,
      }),
    })
    try {
      localStorage.removeItem(claveEstado)
      if (JSON.parse(localStorage.getItem(clavePendiente) ?? "null")?.id === id)
        localStorage.removeItem(clavePendiente)
      sessionStorage.removeItem(clavePropietario)
    } catch {
      /* El servidor ya confirmó la baja; una copia local antigua no puede reabrirla. */
    }
    propietarios.delete(id)
    return resultado
  },
  obtenerCanceladas: (cursor?: string, senal?: AbortSignal) =>
    solicitar<PaginaCanceladas>(
      `/api/sessions/cancelled${
        cursor ? "?cursor=" + encodeURIComponent(cursor) : ""
      }`,
      { signal: senal },
    ),
  obtenerCancelada: (id: string, senal?: AbortSignal) =>
    solicitar<ActividadCancelada>(
      `/api/sessions/cancelled/${encodeURIComponent(id)}`,
      { signal: senal },
    ),
  obtenerSesion: <T>(id: string) => solicitar<T>(`/api/sessions/${id}`),
  recuperarSesion: async <T>(id: string) => {
    const sesion = await solicitar<T & {
      ownerToken: string
    }>(`/api/sessions/${id}/recover`, { method: "POST" })
    recordarSesionPropietario(id, sesion.ownerToken)
    return sesion
  },
  sesionEstado: (
    id: string,
    estado: string,
    puntoControl?: PuntoControlEjercicio,
    mantenerConexion = false,
  ) =>
    solicitar(`/api/sessions/${id}`, {
      method: "PATCH",
      keepalive: mantenerConexion,
      body: JSON.stringify({
        status: estado,
        checkpoint: puntoControl,
        ownerToken: propietarioToken(id),
      }),
    }),
  obtenerFuncionProgreso: <T>(funcionId: string) =>
    solicitar<T>(`/api/progress/${funcionId}`),
  crearPerfil: (perfil: Record<string, unknown>) =>
    solicitar("/api/users/profile", {
      method: "POST",
      body: JSON.stringify(perfil),
    }),
  obtenerPerfilEfectivo: <T>() => solicitar<T>("/api/users/me"),
  actualizarPerfil: (perfil: import("../../compartido/perfil").CambiosPerfil) =>
    solicitar("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(perfil),
    }),
  obtenerMemoriaProgreso: <T>() => solicitar<T>("/api/progress/memory"),
  obtenerProgreso: <T>() => solicitar<T>("/api/progress"),
  obtenerResultados: <T,>(
    consulta: ConsultaHistorial & {
      paginated?: boolean
    } = {},
    senal?: AbortSignal,
  ) => {
    const parametros = new URLSearchParams()
    for (const [clave, valor] of Object.entries(consulta))
      if (valor !== undefined && valor !== "")
        parametros.set(clave, String(valor))
    return solicitar<T>(
      `/api/results${parametros.size ? "?" + parametros.toString() : ""}`,
      { signal: senal },
    )
  },
  obtenerResultadoDetalle: <T,>(
    idSesion: string,
    resultadoId: string,
    senal?: AbortSignal,
  ) =>
    solicitar<T>(
      `/api/results/${encodeURIComponent(idSesion)}/${encodeURIComponent(resultadoId)}`,
      { signal: senal },
    ),
  enviarResultado: async <T>(resultado: SesionResultadoSolicitud) => {
    const protegidoResultado = {
      ...resultado,
      ownerToken: propietarioToken(resultado.sessionId),
    }
    await solicitar(`/api/sessions/${resultado.sessionId}/save`, {
      method: "POST",
      body: JSON.stringify({
        result: protegidoResultado,
        ownerToken: protegidoResultado.ownerToken,
      }),
    })
    return solicitar<T>("/api/results", {
      method: "POST",
      body: JSON.stringify(protegidoResultado),
    })
  },
}
