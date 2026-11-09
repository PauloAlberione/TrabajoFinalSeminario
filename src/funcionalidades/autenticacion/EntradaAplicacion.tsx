import { useEffect, useState } from "react"
import Aplicacion from "../../Aplicacion"
import { PantallaRestablecerContrasena } from "../../paginas/PantallaRestablecerContrasena"
import {
  enlaceAccionFirebase,
  leerEnlaceRestablecimiento,
} from "../../servicios/accionesCuenta"
import { autenticacionFirebase } from "../../servicios/firebase"
import {
  cerrarSesion,
  guardarAvisoAcceso,
} from "../../servicios/sesionAutenticacion"

function RetornoDesdeRecuperacion() {
  const [error, establecerError] = useState(false)
  const [intento, establecerIntento] = useState(0)
  useEffect(() => {
    let vigente = true
    establecerError(false)
    const volver = async () => {
      try {
        if (autenticacionFirebase) await cerrarSesion(autenticacionFirebase)
        if (!vigente) return
        guardarAvisoAcceso(
          "Iniciá sesión con tu nueva contraseña para continuar.",
        )
        window.location.replace(new URL("/", window.location.origin).href)
      } catch {
        if (vigente) establecerError(true)
      }
    }
    void volver()
    return () => {
      vigente = false
    }
  }, [intento])
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground">
      <div className="max-w-lg space-y-5">
        <h1 className="text-3xl font-bold">MenteClear</h1>
        <p role={error ? "alert" : "status"}>
          {error
            ? "No pudimos cerrar el acceso anterior. Intentá nuevamente para volver al ingreso."
            : "Cerrando el acceso anterior para que puedas ingresar con tu nueva contraseña…"}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => establecerIntento((valor) => valor + 1)}
            className="py-4 px-5 rounded-2xl bg-primary text-primary-foreground font-bold"
          >
            Reintentar
          </button>
        )}
      </div>
    </main>
  )
}

function OtraAccionCuenta() {
  const enlace = enlaceAccionFirebase(
    window.location.href,
    import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
    import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  )
  useEffect(() => {
    if (enlace) window.location.replace(enlace)
  }, [enlace])
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground">
      <div className="max-w-lg space-y-5">
        <h1 className="text-3xl font-bold">MenteClear</h1>
        <p role={enlace ? "status" : "alert"}>
          {enlace
            ? "Abriendo la confirmación segura de tu cuenta…"
            : "Este enlace no es válido. Volvé al inicio de sesión y solicitá uno nuevo."}
        </p>
        {!enlace && (
          <a
            href="/"
            className="inline-block py-4 px-5 rounded-2xl bg-primary text-primary-foreground font-bold"
          >
            Volver al inicio de sesión
          </a>
        )}
      </div>
    </main>
  )
}

export function EntradaAplicacion() {
  const { modo } = leerEnlaceRestablecimiento(window.location.href)
  if (modo === "resetPassword") return <PantallaRestablecerContrasena />
  if (window.location.pathname === "/cuenta/accion") return <OtraAccionCuenta />
  if (
    new URLSearchParams(window.location.search).get("acceso") === "restablecido"
  )
    return <RetornoDesdeRecuperacion />
  return <Aplicacion />
}
