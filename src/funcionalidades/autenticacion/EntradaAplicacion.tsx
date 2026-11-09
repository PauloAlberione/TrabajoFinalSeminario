import { useEffect } from "react"
import Aplicacion from "../../Aplicacion"
import { PantallaRestablecerContrasena } from "../../paginas/PantallaRestablecerContrasena"
import {
  enlaceAccionFirebase,
  leerEnlaceRestablecimiento,
} from "../../servicios/accionesCuenta"

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
  return <Aplicacion />
}
