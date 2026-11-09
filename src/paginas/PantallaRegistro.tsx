import { fechaNacimientoValida } from "../../compartido/perfil"
import { useRef, useState } from "react"
import { deleteUser, type User as FirebaseUser } from "firebase/auth"
import { registrarConCorreo } from "../servicios/sesionAutenticacion"
import {
  autenticacionFirebase,
  estaFirebaseConfigurado,
} from "../servicios/firebase"
import { registrarEvento } from "../servicios/registro"
import { crearPerfilUsuario } from "../servicios/datosUsuario"
import {
  codigoErrorFirebase,
  mensajeErrorFirebase,
} from "../servicios/erroresAutenticacion"
import {
  REQUISITOS_CONTRASENA,
  validarContrasena,
} from "../servicios/politicaContrasena"

export function PantallaRegistro({
  onBack: alVolver,
  onRegistered: alRegistrarse,
}: {
  onBack: () => void
  onRegistered: () => void
}) {
  const [formulario, establecerFormulario] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  })
  const [error, establecerError] = useState("")
  const [cargando, establecerCargando] = useState(false)
  const enviando = useRef(false)

  function actualizarCampo(campo: keyof typeof formulario, valor: string) {
    establecerFormulario((actual) => ({ ...actual, [campo]: valor }))
    establecerError("")
  }

  async function manejarEnviar() {
    if (enviando.current) return
    const nombrePatron = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/
    const correoPatron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const fechaNacimiento = formulario.fechaNacimiento
      ? new Date(`${formulario.fechaNacimiento}T00:00:00`)
      : null

    if (
      formulario.nombre.trim().length < 3 ||
      !nombrePatron.test(formulario.nombre.trim())
    ) {
      establecerError("El nombre debe tener al menos 3 letras.")
      return
    }
    if (
      formulario.apellido.trim().length < 3 ||
      !nombrePatron.test(formulario.apellido.trim())
    ) {
      establecerError("El apellido debe tener al menos 3 letras.")
      return
    }
    if (
      !fechaNacimiento ||
      !fechaNacimientoValida(formulario.fechaNacimiento)
    ) {
      establecerError("Selecciona una fecha de nacimiento válida.")
      return
    }
    if (formulario.gender !== "male" && formulario.gender !== "female") {
      establecerError("Selecciona una opción de género.")
      return
    }
    if (!correoPatron.test(formulario.email.trim())) {
      establecerError("Introduce un correo electrónico válido.")
      return
    }
    const errorContrasena = validarContrasena(formulario.password)
    if (errorContrasena) {
      establecerError(errorContrasena)
      return
    }
    if (formulario.password !== formulario.confirmPassword) {
      establecerError("Las contraseñas no coinciden.")
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
    let etapa = "authentication"
    let creadoUsuario: FirebaseUser | null = null
    try {
      const credencial = await registrarConCorreo(
        autenticacionFirebase,
        formulario.email.trim(),
        formulario.password,
      )
      creadoUsuario = credencial.user
      etapa = "profile"
      await crearPerfilUsuario({
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        email: formulario.email.trim(),
        fechaNacimiento: formulario.fechaNacimiento,
        gender: formulario.gender as "male" | "female",
      })
      registrarEvento("info", "auth.registration_succeeded", {
        userId: credencial.user.uid,
      })
      alRegistrarse()
    } catch (error) {
      if (etapa === "profile" && creadoUsuario) {
        try {
          await deleteUser(creadoUsuario)
        } catch (revertirError) {
          registrarEvento("error", "auth.registration_rollback_failed", {
            message:
              revertirError instanceof Error
                ? revertirError.message
                : String(revertirError),
          })
        }
      }
      registrarEvento("error", "auth.registration_failed", {
        stage: etapa,
        code: codigoErrorFirebase(error),
        errorName: error instanceof Error ? error.name : "unknown",
        message: error instanceof Error ? error.message : String(error),
      })
      establecerError(mensajeErrorFirebase(error))
    } finally {
      enviando.current = false
      establecerCargando(false)
    }
  }

  const entradaClase =
    "w-full px-4 py-3 rounded-2xl text-base outline-none transition-all"
  const entradaEstilo = {
    border: "2px solid var(--border)",
    background: "var(--muted)",
    color: "var(--foreground)",
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
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
            Crear una cuenta
          </h1>
          <p
            className="text-lg mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Comienza a cuidar tu mente cada día
          </p>
        </div>

        <form
          noValidate
          aria-busy={cargando}
          onSubmit={(evento) => {
            evento.preventDefault()
            void manejarEnviar()
          }}
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: "var(--card)",
            border: "1.5px solid var(--border)",
          }}
        >
          <fieldset
            disabled={cargando}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0"
          >
            <div>
              <label
                className="block text-base font-bold mb-2"
                htmlFor="register-nombre"
              >
                Nombre
              </label>
              <input
                id="register-nombre"
                className={entradaClase}
                style={entradaEstilo}
                value={formulario.nombre}
                onChange={(evento) =>
                  actualizarCampo("nombre", evento.target.value)
                }
                placeholder="Tu nombre"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label
                className="block text-base font-bold mb-2"
                htmlFor="register-apellido"
              >
                Apellido
              </label>
              <input
                id="register-apellido"
                className={entradaClase}
                style={entradaEstilo}
                value={formulario.apellido}
                onChange={(evento) =>
                  actualizarCampo("apellido", evento.target.value)
                }
                placeholder="Tu apellido"
                autoComplete="family-name"
              />
            </div>
            <div>
              <label
                className="block text-base font-bold mb-2"
                htmlFor="register-fecha"
              >
                Fecha de nacimiento
              </label>
              <input
                id="register-fecha"
                type="date"
                className={entradaClase}
                style={entradaEstilo}
                value={formulario.fechaNacimiento}
                onChange={(evento) =>
                  actualizarCampo("fechaNacimiento", evento.target.value)
                }
                max={new Date().toISOString().split("T")[0]}
                autoComplete="bday"
              />
            </div>
            <div>
              <label
                className="block text-base font-bold mb-2"
                htmlFor="register-email"
              >
                Correo electrónico
              </label>
              <input
                id="register-email"
                type="email"
                className={entradaClase}
                style={entradaEstilo}
                value={formulario.email}
                onChange={(evento) =>
                  actualizarCampo("email", evento.target.value)
                }
                placeholder="ejemplo@correo.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label
                className="block text-base font-bold mb-2"
                htmlFor="register-gender"
              >
                Género
              </label>
              <select
                id="register-gender"
                className={entradaClase}
                style={entradaEstilo}
                value={formulario.gender}
                onChange={(evento) =>
                  actualizarCampo("gender", evento.target.value)
                }
              >
                <option value="">Selecciona una opción</option>
                <option value="female">Mujer</option>
                <option value="male">Hombre</option>
              </select>
            </div>
            <div>
              <label
                className="block text-base font-bold mb-2"
                htmlFor="register-password"
              >
                Contraseña
              </label>
              <input
                id="register-password"
                type="password"
                className={entradaClase}
                style={entradaEstilo}
                value={formulario.password}
                onChange={(evento) =>
                  actualizarCampo("password", evento.target.value)
                }
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                maxLength={4096}
                required
                aria-describedby="register-password-help"
              />
              <p
                id="register-password-help"
                className="mt-2 text-base leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                {REQUISITOS_CONTRASENA}
              </p>
            </div>
            <div>
              <label
                className="block text-base font-bold mb-2"
                htmlFor="register-confirm-password"
              >
                Confirmar contraseña
              </label>
              <input
                id="register-confirm-password"
                type="password"
                className={entradaClase}
                style={entradaEstilo}
                value={formulario.confirmPassword}
                onChange={(evento) =>
                  actualizarCampo("confirmPassword", evento.target.value)
                }
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                maxLength={4096}
                required
              />
            </div>
          </fieldset>

          {error && (
            <div
              role="alert"
              className="mt-6 px-5 py-4 rounded-2xl flex items-start gap-3"
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
            type="submit"
            disabled={cargando}
            className="w-full mt-7 py-5 rounded-2xl text-xl font-bold transition-all hover:opacity-90"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              opacity: cargando ? 0.8 : 1,
            }}
          >
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <button
            type="button"
            onClick={alVolver}
            disabled={cargando}
            className="w-full mt-3 py-4 rounded-2xl text-lg font-bold hover:opacity-80 transition-opacity"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            ← Volver al inicio de sesión
          </button>
          <p
            className="text-sm text-center mt-5 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Antes de crear tu cuenta, consultá qué datos se utilizan y qué
            funciones están disponibles en la{" "}
            <a href="#/privacidad" className="underline font-bold">
              Política de privacidad
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  )
}
