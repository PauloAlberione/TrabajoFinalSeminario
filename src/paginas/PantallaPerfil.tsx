import {
  PestanasPerfil,
  type SeccionPerfil,
} from "../funcionalidades/perfil/PestanasPerfil"
import { nombrePais } from "../../compartido/ubicacion"
import { BotonEliminarCuenta } from "../funcionalidades/perfil/BotonEliminarCuenta"
import { ConfiguracionRecordatorios } from "../funcionalidades/recordatorios/ConfiguracionRecordatorios"
import { ControlVolumenAudio } from "../funcionalidades/audio/ControlVolumenAudio"
import { BotonExportarDatosPersonales } from "../funcionalidades/perfil/BotonExportarDatosPersonales"
import { useAccesibilidad } from "../funcionalidades/accesibilidad/ProveedorAccesibilidad"
import { EditorPerfil } from "../funcionalidades/perfil/EditorPerfil"
import { calcularEdad, type CambiosPerfil } from "../../compartido/perfil"
import { EstadoEstadisticas } from "../funcionalidades/estadisticas/PanelEstadisticas"
import {
  useEstadisticas,
  formatearTiempoActivo,
} from "../funcionalidades/estadisticas/useEstadisticas"
import { useState, useRef, useId } from "react"
import {
  actualizarPerfilUsuario,
  type PerfilUsuario,
} from "../servicios/datosUsuario"
import { etiquetaDificultad } from "../tipos/ejercicios"
import { type Pantalla } from "../tipos/navegacion"
import { avatarUsuario } from "../utilidades/avatarUsuario"
import { IconoFlecha } from "../componentes/Iconos"

export function PantallaPerfil({
  onNavigate: alNavegar,
  profile: perfil,
  uid,
  statistics: estadisticas,
  onProfileChange: alCambiarPerfil,
  onLogout: alCerrarSesion,
}: {
  onNavigate: (texto: Pantalla) => void
  profile: PerfilUsuario
  uid: string
  statistics: ReturnType<typeof useEstadisticas>
  onProfileChange?: (perfil: PerfilUsuario) => void
  onLogout: () => void
}) {
  const [seccion, establecerSeccion] = useState<SeccionPerfil>("datos")
  const idPerfil = useId()
  const [editando, establecerEditando] = useState(false)
  const [guardandoPreferencia, establecerGuardandoPreferencia] = useState(false)
  const [retroalimentacion, establecerRetroalimentacion] = useState("")
  const [errorPreferencias, establecerErrorPreferencias] = useState("")
  const guardandoPreferencias = useRef(false)
  const botonEditar = useRef<HTMLButtonElement>(null)
  const accesibilidad = useAccesibilidad()
  const preferencias =
    accesibilidad?.preferences ?? perfil.preferenciasAccesibilidad
  const { tamanoTexto: tamanoLetra, sonidos: sonido } = preferencias
  const edad = calcularEdad(perfil.fechaNacimiento)
  const fechaCreacionCuenta =
    typeof perfil.fechaRegistro === "string" &&
    Number.isFinite(Date.parse(perfil.fechaRegistro))
      ? new Date(perfil.fechaRegistro).toLocaleDateString("es-AR")
      : null
  const informe = estadisticas.report
  const dificultadPorFuncion = Object.fromEntries(
    informe?.categories.map((elemento) => [
      elemento.category,
      elemento.currentLevel,
    ]) ?? [],
  )
  const cerrarEdicion = () => {
    establecerEditando(false)
    requestAnimationFrame(() => botonEditar.current?.focus())
  }
  async function guardarPerfil(cambios: CambiosPerfil) {
    const actualizado = await actualizarPerfilUsuario(uid, cambios)
    alCambiarPerfil?.(actualizado)
    establecerRetroalimentacion("Perfil actualizado correctamente.")
    cerrarEdicion()
  }
  async function guardarPreferencias(
    cambios: Partial<PerfilUsuario["preferenciasAccesibilidad"]>,
  ) {
    if (guardandoPreferencias.current) return false
    guardandoPreferencias.current = true
    establecerGuardandoPreferencia(true)
    establecerErrorPreferencias("")
    establecerRetroalimentacion("")
    accesibilidad?.preview(cambios)
    try {
      const actualizado = await actualizarPerfilUsuario(uid, {
        accessibilityPreferences: cambios,
      })
      accesibilidad?.confirm(uid, actualizado.preferenciasAccesibilidad)
      alCambiarPerfil?.(actualizado)
      establecerRetroalimentacion("Preferencias guardadas.")
      return true
    } catch {
      accesibilidad?.rollback(uid)
      establecerErrorPreferencias(
        "No pudimos confirmar el guardado. Se restauró el valor anterior en pantalla. Intentá nuevamente.",
      )
      return false
    } finally {
      guardandoPreferencias.current = false
      establecerGuardandoPreferencia(false)
    }
  }

  function editarPerfil() {
    establecerSeccion("datos")
    establecerRetroalimentacion("")
    establecerErrorPreferencias("")
    establecerEditando(true)
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <header
        className="perfil-resumen rounded-3xl p-5 md:p-6 mb-5"
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="w-16 h-16 text-4xl rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,251,245,0.18)" }}
            aria-hidden="true"
          >
            {avatarUsuario(perfil.gender, perfil.tonoAvatar)}
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold">
              {perfil.nombre} {perfil.apellido}
            </h1>
            <p className="text-base mt-1 break-words">{perfil.email}</p>
          </div>
        </div>
        <dl
          className="grid grid-cols-3 gap-2 mt-5 pt-4"
          style={{ borderTop: "1px solid rgba(255,251,245,0.3)" }}
        >
          {[
            ["Días seguidos", informe ? informe.currentStreak : "—"],
            ["Ejercicios", informe ? informe.lifetime.completedExercises : "—"],
            [
              "Tiempo activo total",
              informe
                ? formatearTiempoActivo(informe.lifetime.activeSeconds)
                : "—",
            ],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0">
              <dt className="text-sm">{etiqueta}</dt>
              <dd className="text-xl md:text-2xl font-bold mt-1">{valor}</dd>
            </div>
          ))}
        </dl>
      </header>
      <PestanasPerfil
        idBase={idPerfil}
        actual={seccion}
        alCambiar={establecerSeccion}
        deshabilitado={guardandoPreferencia}
      />
      {retroalimentacion && (
        <p role="status" className="my-4 text-lg">
          {retroalimentacion}
        </p>
      )}
      {errorPreferencias && (
        <p role="alert" className="my-4 text-lg">
          {errorPreferencias}
        </p>
      )}
      {guardandoPreferencia && (
        <p role="status" className="my-4">
          Guardando preferencias…
        </p>
      )}
      {!informe && (
        <EstadoEstadisticas
          error={estadisticas.error}
          retry={estadisticas.retry}
        />
      )}
      {editando && seccion !== "datos" && (
        <p className="my-4 p-4 rounded-2xl bg-muted">
          Estás editando tus datos.{" "}
          <button
            className="underline font-semibold"
            onClick={() => establecerSeccion("datos")}
          >
            Volver a Mi perfil para guardar o cancelar
          </button>
        </p>
      )}
      <div className="mt-6">
        <section
          id={idPerfil + "-panel-datos"}
          role="tabpanel"
          aria-labelledby={idPerfil + "-pestana-datos"}
          hidden={seccion !== "datos"}
          tabIndex={0}
          className="panel-perfil space-y-5"
        >
          <div className="rounded-3xl p-5 md:p-7 border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <h2 className="text-2xl font-bold">Mis datos</h2>{" "}
              <button
                ref={botonEditar}
                disabled={guardandoPreferencia || editando}
                onClick={editarPerfil}
                className="px-5 py-3 rounded-2xl text-lg font-bold disabled:opacity-50"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Editar perfil
              </button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <dt className="text-sm text-muted-foreground">Edad</dt>
                <dd className="font-semibold">
                  {edad === null ? "Sin registrar" : edad + " años"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Fecha de nacimiento
                </dt>
                <dd className="font-semibold">
                  {edad === null
                    ? "Sin registrar"
                    : perfil.fechaNacimiento.split("-").reverse().join("/")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Cuenta creada</dt>
                <dd className="font-semibold">
                  {fechaCreacionCuenta ?? "Sin datos"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  País de residencia
                </dt>
                <dd className="font-semibold">
                  {perfil.pais ? nombrePais(perfil.pais) : "Sin registrar"}
                </dd>
              </div>{" "}
            </dl>
            {editando && (
              <EditorPerfil
                profile={perfil}
                onSave={guardarPerfil}
                onCancel={cerrarEdicion}
              />
            )}
          </div>
          <details className="p-5 rounded-3xl border border-border bg-card">
            <summary className="font-bold text-lg cursor-pointer">
              Ver mis niveles de dificultad
            </summary>
            <div className="mt-4">
              <div
                className="rounded-3xl p-7"
                style={{
                  background: "var(--card)",
                  border: "1.5px solid var(--border)",
                }}
              >
                <h2
                  className="text-xl font-bold mb-5"
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  Nivel de dificultad
                </h2>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  MenteClear ajusta automáticamente el nivel de cada función
                  según tus resultados recientes. No necesitas elegirlo
                  manualmente.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {[
                    ["Memoria", "memory"],
                    ["Lenguaje", "language"],
                    ["Cálculo", "calculation"],
                    ["Atención y reconocimiento", "attentionRecognition"],
                    ["Velocidad", "speed"],
                  ].map(([funcionNombre, funcionId]) => (
                    <div
                      key={funcionNombre}
                      className="px-4 py-3 rounded-2xl"
                      style={{ background: "var(--muted)" }}
                    >
                      <p className="text-sm font-semibold">{funcionNombre}</p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--secondary)" }}
                      >
                        {dificultadPorFuncion[funcionId]
                          ? etiquetaDificultad[dificultadPorFuncion[funcionId]]
                          : "Sin datos"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </section>
        <section
          id={idPerfil + "-panel-preferencias"}
          role="tabpanel"
          aria-labelledby={idPerfil + "-pestana-preferencias"}
          hidden={seccion !== "preferencias"}
          tabIndex={0}
          className="panel-perfil space-y-5"
        >
          <h2 className="text-2xl font-bold">Preferencias de uso</h2>
          <p className="text-muted-foreground">
            Los cambios se aplican al momento y se guardan en tu cuenta.
          </p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <div className="space-y-5">
              <div
                className="rounded-3xl p-7"
                style={{
                  background: "var(--card)",
                  border: "1.5px solid var(--border)",
                }}
              >
                <h2
                  id="font-size-title"
                  className="text-xl font-bold mb-5"
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  Tamaño de letra
                </h2>
                <div
                  role="group"
                  aria-labelledby="font-size-title"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {([
                    ["normal", "Normal"],
                    ["grande", "Grande"],
                    ["extra", "Extra grande"],
                  ] as const).map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      disabled={guardandoPreferencia || editando}
                      aria-pressed={tamanoLetra === valor}
                      onClick={() =>
                        void guardarPreferencias({ tamanoTexto: valor })
                      }
                      className="py-4 px-2 rounded-2xl text-sm font-bold hover:opacity-80 transition-opacity"
                      style={{
                        background:
                          tamanoLetra === valor
                            ? "var(--primary)"
                            : "var(--muted)",
                        color:
                          tamanoLetra === valor
                            ? "var(--primary-foreground)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
                <p className="text-sm mt-4 text-muted-foreground">
                  También podés ampliar la página hasta el 200% con el zoom del
                  navegador.
                </p>
              </div>
              <div className="rounded-3xl overflow-hidden border border-border bg-card">
                {" "}
                {[
                  {
                    label: "Alto contraste",
                    sub: "Texto y controles con mayor contraste; conserva los colores de los ejercicios",
                    val: preferencias.altoContraste,
                    set: (valor: boolean) => {
                      void guardarPreferencias({ altoContraste: valor })
                    },
                  },
                  {
                    label: "Instrucciones ampliadas",
                    sub: "Instrucciones más espaciadas y presentadas paso a paso",
                    val: preferencias.instruccionesAmpliadas,
                    set: (valor: boolean) => {
                      void guardarPreferencias({
                        instruccionesAmpliadas: valor,
                      })
                    },
                  },
                ].map((elemento, indice) => (
                  <div
                    key={indice}
                    className="flex items-center justify-between px-7 py-5"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <div>
                      <p className="text-base font-semibold">
                        {elemento.label}
                      </p>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {elemento.sub}
                      </p>
                    </div>
                    <button
                      disabled={guardandoPreferencia || editando}
                      role="switch"
                      aria-label={elemento.label}
                      aria-checked={elemento.val}
                      onClick={() => elemento.set(!elemento.val)}
                      className="w-16 h-12 rounded-full transition-all duration-300 relative flex-shrink-0 ml-3"
                      style={{
                        background: elemento.val
                          ? "var(--secondary)"
                          : "var(--muted)",
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-full absolute top-3 transition-all duration-300"
                        style={{
                          background: "white",
                          left: elemento.val ? "30px" : "4px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1.5px solid var(--border)",
              }}
            >
              <h2 className="text-xl font-bold p-7 pb-4">Sonidos del juego</h2>
              <label className="flex items-center justify-between gap-4 px-7 py-4 font-semibold">
                Activar sonidos
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={sonido}
                  aria-label="Sonidos del juego"
                  className="w-7 h-7 shrink-0"
                  disabled={guardandoPreferencia || editando}
                  checked={sonido}
                  onChange={(evento) =>
                    void guardarPreferencias({ sonidos: evento.target.checked })
                  }
                />
              </label>
              <ControlVolumenAudio
                volume={perfil.preferenciasAccesibilidad.volumenSonidos}
                enabled={sonido}
                disabled={guardandoPreferencia || editando}
                onSave={(valor) =>
                  guardarPreferencias({ volumenSonidos: valor })
                }
              />
            </div>
          </div>
        </section>
        <section
          id={idPerfil + "-panel-recordatorios"}
          role="tabpanel"
          aria-labelledby={idPerfil + "-pestana-recordatorios"}
          hidden={seccion !== "recordatorios"}
          tabIndex={0}
          className="panel-perfil space-y-5"
        >
          <div className="rounded-3xl overflow-hidden border border-border bg-card">
            {" "}
            <ConfiguracionRecordatorios
              pais={perfil.pais}
              zonaHoraria={perfil.zonaHoraria}
              alConfigurarPais={editarPerfil}
              uid={uid}
              disabled={guardandoPreferencia || editando}
            />
          </div>
        </section>
        <section
          id={idPerfil + "-panel-privacidad"}
          role="tabpanel"
          aria-labelledby={idPerfil + "-pestana-privacidad"}
          hidden={seccion !== "privacidad"}
          tabIndex={0}
          className="panel-perfil space-y-5"
        >
          <div
            className="rounded-3xl p-7"
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--border)",
            }}
          >
            <h2
              className="text-xl font-bold mb-5"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Datos y privacidad
            </h2>
            <div className="space-y-3">
              <BotonExportarDatosPersonales />
              <a
                href="#/privacidad"
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left hover:opacity-80 transition-opacity"
                style={{ background: "var(--muted)" }}
              >
                <span className="text-xl" aria-hidden="true">
                  🔒
                </span>
                <span className="text-base font-semibold flex-1">
                  Política de privacidad
                </span>
                <IconoFlecha />
              </a>
              <BotonEliminarCuenta
                uid={uid}
                disabled={guardandoPreferencia || editando}
              />
            </div>
          </div>
        </section>
      </div>
      <footer className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-border">
        <button
          type="button"
          onClick={() => alNavegar("help")}
          className="px-5 py-3 rounded-2xl bg-muted font-semibold"
        >
          Ayuda y preguntas frecuentes
        </button>
        <button
          type="button"
          onClick={alCerrarSesion}
          className="px-5 py-3 rounded-2xl bg-muted font-semibold text-primary"
        >
          Cerrar sesión
        </button>
      </footer>
    </div>
  )
}
