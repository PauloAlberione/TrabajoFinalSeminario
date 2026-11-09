import { useEffect, useRef, useState } from "react"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { autenticacionFirebase } from "../servicios/firebase"
import { leerEnlaceRestablecimiento } from "../servicios/accionesCuenta"
import {
  REQUISITOS_CONTRASENA,
  validarContrasena,
} from "../servicios/politicaContrasena"
import {
  cerrarSesion,
  guardarAvisoAcceso,
} from "../servicios/sesionAutenticacion"
import {
  codigoErrorFirebase,
  mensajeErrorFirebase,
} from "../servicios/erroresAutenticacion"
import { IconoOjo } from "../componentes/Iconos"

export function PantallaRestablecerContrasena() {
  const [{ codigo }] = useState(() =>
    leerEnlaceRestablecimiento(window.location.href),
  )
  const [correo, establecerCorreo] = useState("")
  const [comprobando, establecerComprobando] = useState(true)
  const [errorEnlace, establecerErrorEnlace] = useState("")
  const [error, establecerError] = useState("")
  const [contrasena, establecerContrasena] = useState("")
  const [confirmacion, establecerConfirmacion] = useState("")
  const [mostrar, establecerMostrar] = useState(false)
  const [guardando, establecerGuardando] = useState(false)
  const [actualizada, establecerActualizada] = useState(false)
  const [redirigiendo, establecerRedirigiendo] = useState(false)
  const enviando = useRef(false)

  useEffect(() => {
    let vigente = true
    document.title = "Cambiar contraseña | MenteClear"
    if (!codigo || !autenticacionFirebase) {
      establecerErrorEnlace(
        "El enlace no es válido. Volvé al ingreso y solicitá uno nuevo desde «¿Olvidaste tu contraseña?».",
      )
      establecerComprobando(false)
      return
    }
    void verifyPasswordResetCode(autenticacionFirebase, codigo)
      .then((direccion) => {
        if (vigente) establecerCorreo(direccion)
      })
      .catch((fallo: unknown) => {
        if (!vigente) return
        establecerErrorEnlace(
          codigoErrorFirebase(fallo) === "auth/network-request-failed"
            ? "No pudimos comprobar el enlace. Revisá tu conexión y volvé a abrirlo."
            : "El enlace venció, ya se utilizó o no es válido. Solicitá uno nuevo desde «¿Olvidaste tu contraseña?».",
        )
      })
      .finally(() => {
        if (vigente) establecerComprobando(false)
      })
    return () => {
      vigente = false
    }
  }, [codigo])

  function irAlIngreso() {
    window.location.replace(new URL("/", window.location.origin).href)
  }

  async function finalizar() {
    if (!autenticacionFirebase) return
    await cerrarSesion(autenticacionFirebase)
    guardarAvisoAcceso(
      "Tu contraseña se actualizó. Iniciá sesión con la nueva contraseña.",
    )
    establecerRedirigiendo(true)
  }

  useEffect(() => {
    if (!redirigiendo) return
    const temporizador = setTimeout(irAlIngreso, 2000)
    return () => clearTimeout(temporizador)
  }, [redirigiendo])

  async function guardar() {
    if (enviando.current || !codigo || !autenticacionFirebase) return
    establecerError("")
    const validacion = validarContrasena(contrasena)
    if (validacion) {
      establecerError(validacion)
      return
    }
    if (contrasena !== confirmacion) {
      establecerError("Las contraseñas no coinciden.")
      return
    }
    enviando.current = true
    establecerGuardando(true)
    try {
      await confirmPasswordReset(autenticacionFirebase, codigo, contrasena)
      establecerActualizada(true)
      establecerContrasena("")
      establecerConfirmacion("")
      await finalizar()
    } catch (fallo) {
      const codigoError = codigoErrorFirebase(fallo)
      if (
        ["auth/expired-action-code", "auth/invalid-action-code"].includes(
          codigoError,
        )
      )
        establecerErrorEnlace(
          "El enlace venció o ya se utilizó. Solicitá uno nuevo para cambiar la contraseña.",
        )
      else establecerError(mensajeErrorFirebase(fallo))
    } finally {
      enviando.current = false
      establecerGuardando(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-5 md:p-8 bg-background text-foreground">
      <div className="w-full max-w-lg">
        <header className="text-center mb-8">
          <div aria-hidden="true" className="text-5xl mb-3">
            🧠
          </div>
          <h1 className="text-4xl font-bold">MenteClear</h1>
          <p className="mt-2 text-muted-foreground">Estimulación cognitiva</p>
        </header>
        <section
          className="rounded-3xl border border-border bg-card p-6 md:p-9 space-y-5"
          aria-labelledby="reset-title"
        >
          <h2 id="reset-title" className="text-2xl font-bold">
            Cambiar contraseña
          </h2>
          {comprobando ? (
            <p role="status">Comprobando tu enlace…</p>
          ) : errorEnlace ? (
            <>
              <p role="alert">{errorEnlace}</p>
              <button
                type="button"
                onClick={irAlIngreso}
                className="w-full py-4 px-5 rounded-2xl bg-primary text-primary-foreground font-bold"
              >
                Volver al inicio de sesión
              </button>
            </>
          ) : actualizada ? (
            <>
              <p role="status">
                Tu contraseña se actualizó.{" "}
                {redirigiendo
                  ? "Te llevamos al inicio de sesión…"
                  : "Completá el cierre de la sesión para volver a ingresar."}
              </p>
              {error && <p role="alert">{error}</p>}
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  if (redirigiendo) irAlIngreso()
                  else
                    void finalizar().catch(() =>
                      establecerError(
                        "No pudimos cerrar la sesión. Intentá nuevamente.",
                      ),
                    )
                }}
                className="w-full py-4 px-5 rounded-2xl bg-primary text-primary-foreground font-bold"
              >
                Ir al inicio de sesión
              </button>
            </>
          ) : (
            <form
              noValidate
              onSubmit={(evento) => {
                evento.preventDefault()
                void guardar()
              }}
              className="space-y-5"
              aria-busy={guardando}
            >
              <p className="break-words">
                Elegí una nueva contraseña para <strong>{correo}</strong>.
              </p>
              <p id="reset-help" className="text-base text-muted-foreground">
                {REQUISITOS_CONTRASENA}
              </p>
              <fieldset disabled={guardando} className="space-y-5 min-w-0">
                <div>
                  <label
                    htmlFor="reset-password"
                    className="block font-bold mb-2"
                  >
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={mostrar ? "text" : "password"}
                      value={contrasena}
                      onChange={(evento) =>
                        establecerContrasena(evento.target.value)
                      }
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={4096}
                      required
                      aria-describedby="reset-help"
                      className="w-full px-4 py-4 pr-16 rounded-2xl border-2 border-border bg-muted"
                    />
                    <button
                      type="button"
                      aria-label={
                        mostrar ? "Ocultar contraseñas" : "Mostrar contraseñas"
                      }
                      aria-pressed={mostrar}
                      onClick={() => establecerMostrar(!mostrar)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl"
                    >
                      <IconoOjo visible={mostrar} />
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="reset-confirmation"
                    className="block font-bold mb-2"
                  >
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="reset-confirmation"
                    type={mostrar ? "text" : "password"}
                    value={confirmacion}
                    onChange={(evento) =>
                      establecerConfirmacion(evento.target.value)
                    }
                    autoComplete="new-password"
                    maxLength={4096}
                    required
                    className="w-full px-4 py-4 rounded-2xl border-2 border-border bg-muted"
                  />
                </div>
              </fieldset>
              {error && (
                <p role="alert" className="font-semibold">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={guardando}
                className="w-full py-4 px-5 rounded-2xl bg-primary text-primary-foreground font-bold"
              >
                {guardando
                  ? "Guardando contraseña…"
                  : "Guardar nueva contraseña"}
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={irAlIngreso}
                className="w-full py-4 px-5 rounded-2xl bg-muted font-bold"
              >
                Volver al inicio de sesión
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
