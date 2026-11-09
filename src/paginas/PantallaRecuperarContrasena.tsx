import { useState, useRef } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import {
  autenticacionFirebase,
  estaFirebaseConfigurado,
} from "../servicios/firebase"
import { registrarEvento } from "../servicios/registro"
import {
  codigoErrorFirebase,
  mensajeErrorFirebase,
} from "../servicios/erroresAutenticacion"
import { REQUISITOS_CONTRASENA } from "../servicios/politicaContrasena"

export function PantallaRecuperarContrasena({
  onBack: alVolver,
}: {
  onBack: () => void
}) {
  const [correo, establecerCorreo] = useState("")
  const [enviado, establecerEnviado] = useState(false)
  const [error, establecerError] = useState("")
  const [cargando, establecerCargando] = useState(false)
  const solicitando = useRef(false)

  async function manejarEnviar() {
    if (solicitando.current) return
    establecerError("")
    const direccion = correo.trim()
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(direccion) ||
      direccion.length > 254
    ) {
      establecerError("Por favor, introduce un correo electrónico válido.")
      return
    }
    if (!autenticacionFirebase || !estaFirebaseConfigurado) {
      establecerError(
        "Firebase todavía no está configurado para esta aplicación.",
      )
      return
    }
    solicitando.current = true
    establecerCargando(true)
    try {
      autenticacionFirebase.languageCode = "es"
      await sendPasswordResetEmail(autenticacionFirebase, direccion, {
        url: new URL("/", window.location.origin).href,
        handleCodeInApp: false,
      })
      registrarEvento("info", "auth.password_reset_requested")
      establecerEnviado(true)
    } catch (error) {
      const codigo = codigoErrorFirebase(error)
      if (codigo === "auth/user-not-found" || codigo === "auth/user-disabled")
        establecerEnviado(true)
      else {
        registrarEvento("error", "auth.password_reset_failed", { code: codigo })
        establecerError(mensajeErrorFirebase(error))
      }
    } finally {
      solicitando.current = false
      establecerCargando(false)
    }
  }

  if (enviado) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ background: "var(--background)" }}
      >
        <div role="status" className="w-full max-w-md text-center break-words">
          <div className="text-8xl mb-6">📧</div>
          <h2
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Solicitud recibida
          </h2>
          <p className="text-lg mb-2" style={{ color: "var(--foreground)" }}>
            Si existe una cuenta habilitada con este correo, recibirás
            instrucciones para restablecer la contraseña:
          </p>
          <p
            className="text-xl font-bold mb-6 px-4 py-3 rounded-2xl inline-block"
            style={{ background: "#FDE8D8", color: "var(--primary)" }}
          >
            {correo.trim()}
          </p>
          <p
            className="text-base mb-3 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Revisá tu bandeja de entrada y seguí las instrucciones del correo
            para crear una nueva contraseña. La recepción puede demorar.
          </p>
          <p
            className="text-base mb-3 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            {REQUISITOS_CONTRASENA}
          </p>
          <p
            className="text-base mb-10 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Revisá también la carpeta de spam. Si el enlace venció, ya se usó o
            no es válido, volvé aquí y solicitá uno nuevo.
          </p>
          <button
            onClick={alVolver}
            className="px-12 py-5 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4"
            style={{ background: "var(--primary)" }}
          >
            🧠
          </div>
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            MenteClear
          </h1>
          <p
            className="text-lg mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Estimulación cognitiva
          </p>
        </div>
        <div
          className="rounded-3xl p-10"
          style={{
            background: "var(--card)",
            border: "1.5px solid var(--border)",
          }}
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔑</div>
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Recuperar contraseña
            </h2>
            <p
              className="text-base mt-2 leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              Introducí tu correo electrónico para solicitar instrucciones de
              recuperación. La respuesta no confirma si existe una cuenta.
            </p>
          </div>
          <div className="mb-5">
            <label
              htmlFor="recovery-email"
              className="block text-base font-bold mb-2"
            >
              Correo electrónico
            </label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              disabled={cargando}
              aria-invalid={!!error}
              aria-describedby={error ? "recovery-error" : undefined}
              value={correo}
              onChange={(evento) => establecerCorreo(evento.target.value)}
              onKeyDown={(evento) => evento.key === "Enter" && manejarEnviar()}
              placeholder="ejemplo@correo.com"
              className="w-full px-5 py-4 rounded-2xl text-lg outline-none"
              style={{
                border: "2px solid var(--border)",
                background: "var(--muted)",
                color: "var(--foreground)",
              }}
            />
          </div>
          {error && (
            <div
              id="recovery-error"
              role="alert"
              className="mb-5 px-5 py-4 rounded-2xl flex items-start gap-3"
              style={{ background: "#F5E0DB", border: "1.5px solid #B86A5A" }}
            >
              <span>⚠️</span>
              <p
                className="text-base font-semibold"
                style={{ color: "#7a3a2a" }}
              >
                {error}
              </p>
            </div>
          )}
          <button
            onClick={() => void manejarEnviar()}
            disabled={cargando}
            className="w-full py-5 rounded-2xl text-xl font-bold mb-4 hover:opacity-90 transition-opacity"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {cargando ? "Enviando solicitud…" : "Enviar enlace de recuperación"}
          </button>
          {cargando && (
            <p role="status" className="mb-4 text-base">
              Procesando la solicitud…
            </p>
          )}
          <button
            onClick={alVolver}
            disabled={cargando}
            className="w-full py-4 rounded-2xl text-lg font-bold hover:opacity-80 transition-opacity"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}
