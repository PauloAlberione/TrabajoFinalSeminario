import { useRef, useState } from "react"
import { ingresarConCorreo } from "../servicios/sesionAutenticacion"
import {
  DURACION_SESION_HORAS,
  DURACION_SESION_RECORDADA_DIAS,
} from "../servicios/politicaSesion"
import {
  autenticacionFirebase,
  estaFirebaseConfigurado,
} from "../servicios/firebase"
import { registrarEvento } from "../servicios/registro"
import {
  codigoErrorFirebase,
  mensajeErrorFirebase,
} from "../servicios/erroresAutenticacion"
import { IconoComprobar, IconoOjo } from "../componentes/Iconos"

export function PantallaIngreso({
  onLogin: alIngresar,
  onForgot: alRecuperarContrasena,
  onRegister: alRegistrarse,
}: {
  onLogin: () => void
  onForgot: () => void
  onRegister: () => void
}) {
  const [correo, establecerCorreo] = useState("")
  const [contrasena, establecerContrasena] = useState("")
  const [mostrarContrasena, establecerMostrarContrasena] = useState(false)
  const [error, establecerError] = useState("")
  const [cargando, establecerCargando] = useState(false)
  const [mantenerSesion, establecerMantenerSesion] = useState(false)
  const enviando = useRef(false)

  async function manejarEnviar() {
    if (enviando.current) return
    establecerError("")
    if (!correo || !correo.includes("@")) {
      establecerError("Por favor, introduce un correo electrónico válido.")
      return
    }
    if (!contrasena) {
      establecerError("Introduce tu contraseña.")
      return
    }
    if (!autenticacionFirebase || !estaFirebaseConfigurado) {
      establecerError(
        "Firebase todavía no está configurado para esta aplicación.",
      )
      return
    }
    enviando.current = true
    establecerCargando(true)
    try {
      await ingresarConCorreo(
        autenticacionFirebase,
        correo.trim(),
        contrasena,
        mantenerSesion,
      )
      registrarEvento("info", "auth.login_succeeded")
      alIngresar()
    } catch (error) {
      registrarEvento("error", "auth.login_failed", {
        code: codigoErrorFirebase(error),
      })
      establecerError(mensajeErrorFirebase(error))
    } finally {
      enviando.current = false
      establecerCargando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)" }}
    >
      <div
        className="hidden lg:flex w-96 flex-col items-center justify-center p-12"
        style={{ background: "var(--primary)" }}
      >
        <div className="text-center">
          <div className="text-7xl mb-6">🧠</div>
          <h2
            className="text-3xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "Fraunces, serif", color: "white" }}
          >
            Cuida tu mente cada día
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--primary-foreground)" }}
          >
            Ejercicios sencillos y amigables para mantener tu mente activa y
            saludable.
          </p>
          <div className="mt-10 space-y-4">
            {[
              "Ejercicios de memoria",
              "Ejercicios de lenguaje",
              "Cálculo mental",
              "Atención y reconocimiento",
              "Velocidad",
              "Seguimiento de progreso",
            ].map((etiqueta) => (
              <div key={etiqueta} className="flex items-center gap-3 text-left">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                >
                  <IconoComprobar />
                </div>
                <span
                  className="text-base font-semibold"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  {etiqueta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 lg:hidden"
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
            <h2
              className="text-2xl font-bold mb-8 text-center"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Iniciar sesión
            </h2>

            <div className="mb-6">
              <label
                htmlFor="login-email"
                className="block text-base font-bold mb-2"
              >
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                disabled={cargando}
                value={correo}
                onChange={(evento) => establecerCorreo(evento.target.value)}
                onKeyDown={(evento) =>
                  evento.key === "Enter" && manejarEnviar()
                }
                placeholder="ejemplo@correo.com"
                className="w-full px-5 py-4 rounded-2xl text-lg outline-none transition-all"
                style={{
                  border: `2px solid ${
                    error && !correo.includes("@") ? "#B86A5A" : "var(--border)"
                  }`,
                  background: "var(--muted)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="login-password"
                className="block text-base font-bold mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={mostrarContrasena ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={cargando}
                  value={contrasena}
                  onChange={(evento) =>
                    establecerContrasena(evento.target.value)
                  }
                  onKeyDown={(evento) =>
                    evento.key === "Enter" && manejarEnviar()
                  }
                  placeholder="Su contraseña"
                  className="w-full px-5 py-4 rounded-2xl text-lg pr-14 outline-none"
                  style={{
                    border: "2px solid var(--border)",
                    background: "var(--muted)",
                    color: "var(--foreground)",
                  }}
                />
                <button
                  type="button"
                  disabled={cargando}
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={mostrarContrasena}
                  onClick={() =>
                    establecerMostrarContrasena(!mostrarContrasena)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <IconoOjo visible={mostrarContrasena} />
                </button>
              </div>
            </div>

            <div className="text-right mb-6">
              <button
                disabled={cargando}
                onClick={alRecuperarContrasena}
                className="text-base font-semibold hover:opacity-75 transition-opacity"
                style={{ color: "var(--primary)" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer min-h-11 py-2">
                <input
                  type="checkbox"
                  checked={mantenerSesion}
                  onChange={(evento) =>
                    establecerMantenerSesion(evento.target.checked)
                  }
                  disabled={cargando}
                  aria-describedby="login-session-help"
                  className="w-6 h-6 shrink-0 accent-primary"
                />
                <span className="font-semibold">Mantener sesión iniciada</span>
              </label>
              <p
                id="login-session-help"
                className="text-base text-muted-foreground mt-1"
              >
                {mantenerSesion
                  ? `Se recordará tu acceso hasta ${DURACION_SESION_RECORDADA_DIAS} días. Usá esta opción solo en un dispositivo propio.`
                  : `La sesión dura hasta ${DURACION_SESION_HORAS} horas y termina al cerrar esta pestaña.`}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 px-5 py-4 rounded-2xl flex items-start gap-3"
                style={{ background: "#F5E0DB", border: "1.5px solid #B86A5A" }}
              >
                <span className="text-xl flex-shrink-0">⚠️</span>
                <p
                  className="text-base font-semibold"
                  style={{ color: "#7a3a2a" }}
                >
                  {error}
                </p>
              </div>
            )}

            <button
              onClick={manejarEnviar}
              disabled={cargando}
              className="w-full py-5 rounded-2xl text-xl font-bold transition-all hover:opacity-90 active:scale-98"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                opacity: cargando ? 0.8 : 1,
              }}
            >
              {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

            <div className="text-center mt-6">
              <p
                className="text-base"
                style={{ color: "var(--muted-foreground)" }}
              >
                ¿Aún no tienes cuenta?{" "}
                <button
                  disabled={cargando}
                  onClick={alRegistrarse}
                  className="font-bold hover:opacity-75 transition-opacity"
                  style={{ color: "var(--primary)" }}
                >
                  Crear una cuenta
                </button>
              </p>
            </div>
          </div>

          <p
            className="text-center text-sm mt-6"
            style={{ color: "var(--muted-foreground)" }}
          >
            Usa el correo y la contraseña de tu cuenta de MenteClear.{" "}
            <a href="#/privacidad" className="underline font-bold">
              Política de privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
