import type { Request, Response } from "express"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"
import { RecordatorioValidacionError } from "../../../compartido/recordatorios"
import {
  despacharRecordatorios,
  obtenerRecordatorioPreferencias,
  modificarRecordatorioPreferencias,
  darBajaRecordatorio,
} from "../servicios/recordatorio.servicio"
import {
  leerDarBajaToken,
  recordatorioConfiguracion,
} from "../servicios/recordatorioCorreo"

export async function obtenerRecordatorios(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  respuesta.setHeader("Cache-Control", "no-store")
  if (!solicitar.userId) {
    respuesta.sendStatus(401)
    return
  }
  try {
    respuesta.json(await obtenerRecordatorioPreferencias(solicitar.userId))
  } catch {
    respuesta
      .status(503)
      .json({ error: "No pudimos consultar los recordatorios." })
  }
}

export async function modificarRecordatorios(
  solicitar: AutenticadoSolicitud,
  respuesta: Response,
) {
  respuesta.setHeader("Cache-Control", "no-store")
  if (!solicitar.userId) {
    respuesta.sendStatus(401)
    return
  }
  try {
    respuesta.json(
      await modificarRecordatorioPreferencias(solicitar.userId, solicitar.body),
    )
  } catch (error) {
    respuesta
      .status(error instanceof RecordatorioValidacionError ? 400 : 503)
      .json({
        error:
          error instanceof RecordatorioValidacionError
            ? error.message
            : "No pudimos guardar los recordatorios.",
      })
  }
}

export async function ejecutarRecordatorios(
  solicitud: Request,
  respuesta: Response,
) {
  try {
    respuesta.json(await despacharRecordatorios())
  } catch {
    console.error("reminders.job_failed")
    respuesta
      .status(503)
      .json({ error: "No se pudo completar el envío de recordatorios." })
  }
}

function darBajaPagina(titulo: string, contenido: string) {
  return `
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>MenteClear — ${titulo}</title>
        <style>
          body {
            font: 22px/1.6 system-ui, sans-serif;
            background: #fff8f0;
            color: #382a23;
            margin: 0;
            padding: 24px;
          }
          main {
            max-width: 680px;
            margin: 40px auto;
            background: #fff;
            padding: 28px;
            border: 2px solid #dfcbb9;
            border-radius: 24px;
          }
          h1 {
            font-size: 30px;
            line-height: 1.3;
          }
          button {
            font: inherit;
            font-weight: 700;
            min-height: 56px;
            padding: 16px 24px;
            border: 0;
            border-radius: 16px;
            background: #9a4625;
            color: white;
            cursor: pointer;
          }
          button:focus-visible {
            outline: 4px solid #246c66;
            outline-offset: 4px;
          }
        </style>
      </head>
      <body>
        <main>
          <p>MenteClear</p>
          <h1>${titulo}</h1>
          ${contenido}
        </main>
      </body>
    </html>
  `
}

export async function darBajaRecordatorios(
  solicitar: Request,
  respuesta: Response,
) {
  respuesta.setHeader("Cache-Control", "no-store")
  respuesta.setHeader("Referrer-Policy", "no-referrer")
  respuesta.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
  )
  const token = solicitar.query.token
  if (!leerDarBajaToken(token, recordatorioConfiguracion().secret)) {
    respuesta
      .status(400)
      .type("html")
      .send(
        darBajaPagina(
          "Enlace inválido o vencido",
          "<p>Podés desactivar los recordatorios desde tu perfil en MenteClear.</p>",
        ),
      )
    return
  }
  if (solicitar.method === "GET") {
    // Los analizadores de correo pueden visitar enlaces. Una petición GET nunca debe modificar preferencias.
    respuesta
      .type("html")
      .send(
        darBajaPagina(
          "Desactivar recordatorios",
          '<p>Dejarás de recibir estos avisos por correo.</p><form method="post"><button type="submit">Desactivar recordatorios</button></form>',
        ),
      )
    return
  }
  try {
    await darBajaRecordatorio(token)
    respuesta
      .type("html")
      .send(
        darBajaPagina(
          "Recordatorios desactivados",
          "<p>Podés volver a activarlos desde tu perfil.</p>",
        ),
      )
  } catch {
    respuesta
      .status(503)
      .send(
        "No pudimos guardar el cambio. Intentá nuevamente o ingresá a tu perfil.",
      )
  }
}
