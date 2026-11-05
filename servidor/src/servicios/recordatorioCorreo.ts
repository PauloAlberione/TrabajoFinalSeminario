import { createHmac, timingSafeEqual } from "node:crypto"

export function recordatorioConfiguracion() {
  const configuracion = {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.REMINDER_FROM_EMAIL ?? "",
    appUrl: process.env.PUBLIC_APP_URL ?? "",
    apiUrl: process.env.PUBLIC_API_URL ?? "",
    secret: process.env.REMINDER_UNSUBSCRIBE_SECRET ?? "",
    audience: process.env.REMINDER_SCHEDULER_AUDIENCE ?? "",
    serviceAccount: process.env.REMINDER_SCHEDULER_SERVICE_ACCOUNT ?? "",
    enabled: process.env.REMINDERS_ENABLED === "true",
  }
  const https = (valor: string) => {
    try {
      const url = new URL(valor)
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      )
    } catch {
      return false
    }
  }
  return {
    ...configuracion,
    configured:
      configuracion.enabled &&
      !!configuracion.apiKey &&
      validoCorreo(configuracion.from) &&
      configuracion.secret.length >= 32 &&
      https(configuracion.appUrl) &&
      https(configuracion.apiUrl) &&
      https(configuracion.audience) &&
      validoCorreo(configuracion.serviceAccount),
  }
}

export function validoCorreo(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    valor.length <= 254 &&
    /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(valor)
  )
}

export function darBajaToken(
  uid: string,
  consentimiento: string,
  secreto: string,
  ahora: Date,
) {
  const contenido = Buffer.from(
    JSON.stringify({
      uid,
      consent: consentimiento,
      expires: ahora.getTime() + 180 * 86400000,
    }),
  ).toString("base64url")
  return `${contenido}.${createHmac("sha256", secreto).update(contenido).digest("base64url")}`
}

export function leerDarBajaToken(
  token: unknown,
  secreto: string,
  ahora = new Date(),
): {
  uid: string
  consent: string
} | null {
  if (typeof token !== "string" || token.length > 2048 || secreto.length < 32)
    return null
  const [contenido, firma, extra] = token.split(".")
  if (!contenido || !firma || extra) return null
  const esperado = createHmac("sha256", secreto).update(contenido).digest()
  const recibido = Buffer.from(firma, "base64url")
  if (
    recibido.length !== esperado.length ||
    !timingSafeEqual(recibido, esperado)
  )
    return null
  try {
    const datos = JSON.parse(
      Buffer.from(contenido, "base64url").toString(),
    ) as Record<string, unknown>
    if (
      typeof datos.uid !== "string" ||
      !datos.uid ||
      datos.uid.includes("/") ||
      typeof datos.consent !== "string" ||
      typeof datos.expires !== "number" ||
      datos.expires <= ahora.getTime()
    )
      return null
    return { uid: datos.uid, consent: datos.consent }
  } catch {
    return null
  }
}

export interface RecordatorioCorreo {
  from: string
  to: string
  subject: string
  text: string
  headers: Record<string, string>
}

export function crearRecordatorioCorreo(
  uid: string,
  consentimiento: string,
  correo: string,
  ahora: Date,
  configuracion = recordatorioConfiguracion(),
): RecordatorioCorreo {
  const enlace = `${configuracion.apiUrl.replace(/\/$/, "")}/api/reminders/unsubscribe?token=${darBajaToken(uid, consentimiento, configuracion.secret, ahora)}`
  return {
    from: configuracion.from,
    to: correo,
    subject: "MenteClear: un momento para tus ejercicios",
    text: `MenteClear\n\nCuando te venga bien, te invitamos a realizar una actividad de estimulación cognitiva.\n\nIngresá a MenteClear: ${configuracion.appUrl}\n\nPodés desactivar estos correos desde Perfil o desde este enlace:\n${enlace}`,
    headers: {
      "List-Unsubscribe": `<${enlace}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }
}

export class CorreoEntregaError extends Error {
  constructor(
    readonly retryable: boolean,
    readonly code: string,
    readonly retryAfterSeconds = 60,
  ) {
    super("No se pudo enviar el recordatorio.")
  }
}

export async function enviarRecordatorioCorreo(
  correo: RecordatorioCorreo,
  clave: string,
  apiClave: string,
  transporte: typeof fetch = fetch,
): Promise<string> {
  let respuesta: Response
  try {
    respuesta = await transporte("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiClave}`,
        "Content-Type": "application/json",
        "Idempotency-Key": clave,
      },
      body: JSON.stringify({
        from: correo.from,
        to: correo.to,
        subject: correo.subject,
        text: correo.text,
        headers: Object.fromEntries(
          Object.entries(correo.headers).sort(([izquierda], [derecha]) =>
            izquierda.localeCompare(derecha),
          ),
        ),
      }),
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    throw new CorreoEntregaError(true, "network")
  }
  if (!respuesta.ok) {
    const reintentarDespues = Number(respuesta.headers.get("retry-after"))
    throw new CorreoEntregaError(
      respuesta.status === 429 ||
        respuesta.status >= 500 ||
        respuesta.status === 408,
      `http_${respuesta.status}`,
      Number.isFinite(reintentarDespues)
        ? Math.max(60, Math.min(3600, reintentarDespues))
        : 60,
    )
  }
  const cuerpo: unknown = await respuesta.json().catch(() => null)
  if (
    !cuerpo ||
    typeof cuerpo !== "object" ||
    !("id" in cuerpo) ||
    typeof cuerpo.id !== "string"
  )
    throw new CorreoEntregaError(true, "invalid_response")
  return cuerpo.id
}
