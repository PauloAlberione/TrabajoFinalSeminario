import type { RequestHandler } from "express"
import { OAuth2Client, type TokenPayload } from "google-auth-library"
import { recordatorioConfiguracion } from "../servicios/recordatorioCorreo"

const verificador = new OAuth2Client()

async function verificarProgramadorToken(token: string, audiencia: string) {
  return (
    await verificador.verifyIdToken({ idToken: token, audience: audiencia })
  ).getPayload()
}

export function recordatorioProgramadorProteccion(
  verificar: (
    token: string,
    audiencia: string,
  ) => Promise<TokenPayload | undefined> = verificarProgramadorToken,
  obtenerConfiguracion = recordatorioConfiguracion,
): RequestHandler {
  return async (solicitar, respuesta, siguiente) => {
    const configuracion = obtenerConfiguracion()
    if (!configuracion.configured) {
      respuesta
        .status(503)
        .json({ error: "El programador no está configurado." })
      return
    }
    const encabezado = solicitar.header("authorization")
    if (!encabezado?.startsWith("Bearer ")) {
      respuesta.sendStatus(401)
      return
    }
    try {
      const contenido = await verificar(
        encabezado.slice(7),
        configuracion.audience,
      )
      if (
        !contenido ||
        contenido.email !== configuracion.serviceAccount ||
        contenido.email_verified !== true
      ) {
        respuesta.sendStatus(403)
        return
      }
      siguiente()
    } catch {
      respuesta.sendStatus(401)
    }
  }
}

export const exigirRecordatorioProgramador = recordatorioProgramadorProteccion()
