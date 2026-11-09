import type { ActividadPendiente } from "../compartido/sesionesCanceladas"
import { ActividadesPendientes } from "./funcionalidades/sesiones/ActividadesPendientes"
import { RecuperacionEliminacionCuenta } from "./funcionalidades/perfil/RecuperacionEliminacionCuenta"
import {
  leerPendienteEliminacion,
  ELIMINACION_PENDIENTE_EVENTO,
} from "./servicios/eliminacionCuenta"
import { usePerfilAccesibilidad } from "./funcionalidades/accesibilidad/ProveedorAccesibilidad"
import { EstadoEstadisticas } from "./funcionalidades/estadisticas/PanelEstadisticas"
import { useEstadisticas } from "./funcionalidades/estadisticas/useEstadisticas"
import { tiposVelocidad, type TipoVelocidad } from "../compartido/velocidad"
import { EjercicioVelocidad } from "./funcionalidades/ejercicios/velocidad/EjercicioVelocidad"
import {
  tiposAtencion,
  type TipoAtencion,
} from "../compartido/atencionReconocimiento"
import { EjercicioAtencion } from "./funcionalidades/ejercicios/atencionReconocimiento/EjercicioAtencion"
import { tiposCalculo, type TipoCalculo } from "../compartido/calculo"
import { EjercicioCalculo } from "./funcionalidades/ejercicios/calculo/EjercicioCalculo"
import { EjercicioLenguaje } from "./funcionalidades/ejercicios/lenguaje/EjercicioLenguaje"
import { tiposLenguaje, type TipoLenguaje } from "../compartido/lenguaje"
import { EJERCICIO_NAVEGACION_EVENTO } from "./funcionalidades/ejercicios/compartido/useNavegacionEjercicio"
import { EjercicioMemoria } from "./funcionalidades/ejercicios/memoria/EjercicioMemoria"
import { tiposMemoria, type TipoMemoria } from "../compartido/memoria"
import { useEffect, useState, useRef } from "react"
import { type User as FirebaseUser } from "firebase/auth"
import {
  cerrarSesion,
  guardarAvisoAcceso,
  leerAvisoAcceso,
  observarSesionAutenticada,
  retirarAvisoAcceso,
} from "./servicios/sesionAutenticacion"
import { autenticacionFirebase } from "./servicios/firebase"
import { registrarEvento } from "./servicios/registro"
import {
  obtenerPerfilUsuario,
  registroUsuarioAcceso,
  type PerfilUsuario,
} from "./servicios/datosUsuario"
import { api, ejercicioAlmacenamientoClave } from "./servicios/api"
import { type Pantalla, type EstadoAplicacion } from "./tipos/navegacion"
import { codigoErrorFirebase } from "./servicios/erroresAutenticacion"
import { PantallaIngreso } from "./paginas/PantallaIngreso"
import { PantallaRegistro } from "./paginas/PantallaRegistro"
import { PantallaRecuperarContrasena } from "./paginas/PantallaRecuperarContrasena"
import { BarraLateral } from "./componentes/BarraLateral"
import { PantallaInicio } from "./paginas/PantallaInicio"
import { PantallaActividades } from "./paginas/PantallaActividades"
import { PantallaProgreso } from "./paginas/PantallaProgreso"
import { PantallaPerfil } from "./paginas/PantallaPerfil"
import { PantallaAyuda } from "./paginas/PantallaAyuda"

const PANTALLAS_SIN_MENU: Pantalla[] = [
  ...tiposVelocidad,
  ...tiposAtencion,
  ...tiposCalculo,
  ...tiposLenguaje,
  ...tiposMemoria,
  "game",
  "lenguaje-game",
  "calculo-game",
  "atencion-game",
  "velocidad-game",
]

export default function Aplicacion() {
  const [eliminacionPendiente, establecerEliminacionPendiente] = useState(
    leerPendienteEliminacion,
  )
  const [avisoEliminacion, establecerAvisoEliminacion] = useState("")
  const [avisoAcceso, establecerAvisoAcceso] = useState(leerAvisoAcceso)
  useEffect(retirarAvisoAcceso, [])
  useEffect(() => {
    const pendiente = () =>
      establecerEliminacionPendiente(leerPendienteEliminacion())
    window.addEventListener(ELIMINACION_PENDIENTE_EVENTO, pendiente)
    return () =>
      window.removeEventListener(ELIMINACION_PENDIENTE_EVENTO, pendiente)
  }, [])
  const [estadoAplicacion, establecerEstadoAplicacion] =
    useState<EstadoAplicacion>("login")
  const [pantalla, establecerPantalla] = useState<Pantalla>("home")
  const [categoriaSeleccionada, establecerCategoriaSeleccionada] =
    useState("memoria")
  const [usuarioAutenticado, establecerUsuarioAutenticado] =
    useState<FirebaseUser | null>(null)
  const [perfil, establecerPerfil] = useState<PerfilUsuario | null>(null)
  usePerfilAccesibilidad(perfil)
  const [revisionEstadisticas, establecerRevisionEstadisticas] = useState(0)
  const [revisionCancelaciones, establecerRevisionCancelaciones] = useState(0)
  const estadisticas = useEstadisticas(
    usuarioAutenticado?.uid,
    revisionEstadisticas,
  )
  const [cargandoAutenticacion, establecerCargandoAutenticacion] =
    useState(true)
  const [errorAutenticacion, establecerErrorAutenticacion] = useState("")
  const [intentoAutenticacion, establecerIntentoAutenticacion] = useState(0)
  const versionSolicitudAutenticacion = useRef(0)
  const canceladasConfirmadas = useRef(new Set<string>())
  const [ejerciciosPendientes, establecerEjerciciosPendientes] =
    useState<ActividadPendiente[]>([])
  useEffect(() => {
    if (!autenticacionFirebase) {
      establecerCargandoAutenticacion(false)
      return
    }
    const darBaja = observarSesionAutenticada(
      autenticacionFirebase,
      async (usuario) => {
        const version = ++versionSolicitudAutenticacion.current
        canceladasConfirmadas.current.clear()
        establecerUsuarioAutenticado(usuario)
        establecerEjerciciosPendientes([])
        establecerPerfil(null)
        establecerErrorAutenticacion("")
        if (usuario) establecerCargandoAutenticacion(true)
        if (!usuario) {
          establecerPerfil(null)
          establecerPantalla("home")
          establecerEstadoAplicacion("login")
          establecerCargandoAutenticacion(false)
          return
        }
        try {
          await registroUsuarioAcceso(usuario.uid)
          let perfilActual = await obtenerPerfilUsuario(usuario.uid)
          if (!perfilActual) {
            await new Promise((resolver) => setTimeout(resolver, 250))
            perfilActual = await obtenerPerfilUsuario(usuario.uid)
          }
          if (version !== versionSolicitudAutenticacion.current) return
          establecerPerfil(
            perfilActual ?? {
              uid: usuario.uid,
              nombre: usuario.displayName?.split(" ")[0] ?? "Usuario",
              apellido:
                usuario.displayName?.split(" ").slice(1).join(" ") ?? "",
              email: usuario.email ?? "",
              fechaNacimiento: "",
              gender: undefined,
              preferenciasAccesibilidad: {
                tamanoTexto: "normal",
                altoContraste: false,
                instruccionesAmpliadas: false,
                sonidos: true,
                volumenSonidos: 30,
                recordatorios: false,
                frecuenciaRecordatorio: "daily",
              },
              rachaActual: 0,
              mejorRacha: 0,
              diasActivos: 0,
            },
          )
          establecerEstadoAplicacion("app")
        } catch (error) {
          if (version !== versionSolicitudAutenticacion.current) return
          establecerErrorAutenticacion(
            error instanceof Error && error.name === "BackendUnavailableError"
              ? error.message
              : "No pudimos cargar tu perfil. Revisá tu conexión e intentá nuevamente.",
          )
          registrarEvento("error", "auth.session_load_failed", {
            code: codigoErrorFirebase(error),
          })
        }
        if (version === versionSolicitudAutenticacion.current)
          establecerCargandoAutenticacion(false)
      },
      () => {
        const aviso =
          "Tu sesión venció. Volvé a iniciar sesión para continuar. El avance guardado de tus actividades sigue disponible."
        guardarAvisoAcceso(aviso)
        establecerAvisoAcceso(aviso)
      },
    )
    return () => {
      ++versionSolicitudAutenticacion.current
      darBaja()
    }
  }, [intentoAutenticacion])
  useEffect(() => {
    if (
      estadoAplicacion !== "app" ||
      !usuarioAutenticado ||
      PANTALLAS_SIN_MENU.includes(pantalla)
    )
      return
    let cancelado = false
    void api
      .pendienteSesiones()
      .then((elementos) => {
        if (!cancelado)
          establecerEjerciciosPendientes(
            elementos.filter(
              (actividad) => !canceladasConfirmadas.current.has(actividad.id),
            ),
          )
      })
      .catch(() => registrarEvento("warn", "sessions.pending_load_failed"))
    return () => {
      cancelado = true
    }
  }, [estadoAplicacion, usuarioAutenticado, pantalla])
  function navegar(texto: Pantalla) {
    const continuar = () => {
      if (
        tiposLenguaje.includes(texto as TipoLenguaje) ||
        texto === "lenguaje-game"
      )
        establecerCategoriaSeleccionada("lenguaje")
      else if (tiposMemoria.includes(texto as TipoMemoria) || texto === "game")
        establecerCategoriaSeleccionada("memoria")
      else if (
        tiposCalculo.includes(texto as TipoCalculo) ||
        texto === "calculo-game"
      )
        establecerCategoriaSeleccionada("calculo")
      else if (
        tiposAtencion.includes(texto as TipoAtencion) ||
        texto === "atencion-game"
      )
        establecerCategoriaSeleccionada("atencion")
      else if (
        tiposVelocidad.includes(texto as TipoVelocidad) ||
        texto === "velocidad-game"
      )
        establecerCategoriaSeleccionada("velocidad")
      establecerPantalla(texto)
      requestAnimationFrame(() =>
        document
          .getElementById("contenido-principal")
          ?.focus({ preventScroll: true }),
      )
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      })
    }
    const evento = new CustomEvent(EJERCICIO_NAVEGACION_EVENTO, {
      cancelable: true,
      detail: { proceed: continuar },
    })
    if (window.dispatchEvent(evento)) continuar()
  }
  async function actualizarDatosEjercicios() {
    if (!usuarioAutenticado) return
    establecerRevisionEstadisticas((valor) => valor + 1)
    try {
      establecerEjerciciosPendientes(
        (await api.pendienteSesiones()).filter(
          (actividad) => !canceladasConfirmadas.current.has(actividad.id),
        ),
      )
    } catch {
      registrarEvento("warn", "exercise.data_refresh_failed")
    }
  }
  if (eliminacionPendiente)
    return (
      <RecuperacionEliminacionCuenta
        pending={eliminacionPendiente}
        onCompleted={(advertencia) => {
          ++versionSolicitudAutenticacion.current
          establecerUsuarioAutenticado(null)
          establecerPerfil(null)
          establecerEjerciciosPendientes([])
          establecerErrorAutenticacion("")
          establecerCargandoAutenticacion(false)
          establecerEstadoAplicacion("login")
          establecerPantalla("home")
          establecerEliminacionPendiente(null)
          establecerAvisoEliminacion(
            `Tu cuenta y sus datos activos fueron eliminados. ${advertencia}`,
          )
        }}
      />
    )
  if (cargandoAutenticacion)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        Cargando tu sesión…
      </div>
    )
  if (errorAutenticacion && usuarioAutenticado)
    return (
      <div role="alert" className="p-10 text-xl">
        <p>{errorAutenticacion}</p>
        <button
          className="m-4 px-8 py-4 rounded-2xl"
          style={{ background: "var(--primary)", color: "white" }}
          onClick={() => establecerIntentoAutenticacion((valor) => valor + 1)}
        >
          Reintentar carga del perfil
        </button>
        <button
          className="m-4 px-8 py-4"
          onClick={() => void cerrarSesion(autenticacionFirebase!)}
        >
          Cerrar sesión
        </button>
      </div>
    )
  if (estadoAplicacion === "login")
    return (
      <>
        {avisoEliminacion && (
          <p role="status" className="p-5 text-lg">
            {avisoEliminacion}
          </p>
        )}
        {avisoAcceso && (
          <p role="status" className="p-5 text-lg bg-muted">
            {avisoAcceso}
          </p>
        )}
        <PantallaIngreso
          onLogin={() => {
            establecerAvisoAcceso("")
            retirarAvisoAcceso()
            establecerEstadoAplicacion("app")
          }}
          onForgot={() => establecerEstadoAplicacion("forgot")}
          onRegister={() => establecerEstadoAplicacion("register")}
        />
      </>
    )
  if (estadoAplicacion === "register")
    return (
      <PantallaRegistro
        onBack={() => establecerEstadoAplicacion("login")}
        onRegistered={() => {
          establecerIntentoAutenticacion((valor) => valor + 1)
          establecerEstadoAplicacion("app")
        }}
      />
    )
  if (estadoAplicacion === "forgot")
    return (
      <PantallaRecuperarContrasena
        onBack={() => establecerEstadoAplicacion("login")}
      />
    )
  if (PANTALLAS_SIN_MENU.includes(pantalla)) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        {(pantalla === "game" ||
          tiposMemoria.includes(pantalla as TipoMemoria)) && (
          <EjercicioMemoria
            key={pantalla}
            type={pantalla === "game" ? "imagePairs" : pantalla as TipoMemoria}
            onBack={() => navegar("activities")}
            onSaved={actualizarDatosEjercicios}
          />
        )}
        {(pantalla === "lenguaje-game" ||
          tiposLenguaje.includes(pantalla as TipoLenguaje)) && (
          <EjercicioLenguaje
            key={pantalla}
            type={
              pantalla === "lenguaje-game"
                ? "wordAssociation"
                : pantalla as TipoLenguaje
            }
            onBack={() => navegar("activities")}
            onSaved={actualizarDatosEjercicios}
          />
        )}
        {(pantalla === "calculo-game" ||
          tiposCalculo.includes(pantalla as TipoCalculo)) && (
          <EjercicioCalculo
            key={pantalla}
            type={
              pantalla === "calculo-game"
                ? "mentalCalculation"
                : pantalla as TipoCalculo
            }
            onBack={() => navegar("activities")}
            onSaved={actualizarDatosEjercicios}
          />
        )}
        {(pantalla === "atencion-game" ||
          tiposAtencion.includes(pantalla as TipoAtencion)) && (
          <EjercicioAtencion
            key={pantalla}
            type={
              pantalla === "atencion-game"
                ? "identifyElements"
                : pantalla as TipoAtencion
            }
            onBack={() => navegar("activities")}
            onSaved={actualizarDatosEjercicios}
          />
        )}
        {(pantalla === "velocidad-game" ||
          tiposVelocidad.includes(pantalla as TipoVelocidad)) && (
          <EjercicioVelocidad
            key={pantalla}
            type={
              pantalla === "velocidad-game"
                ? "quickResponse"
                : pantalla as TipoVelocidad
            }
            onBack={() => navegar("activities")}
            onSaved={actualizarDatosEjercicios}
          />
        )}
      </div>
    )
  }
  return (
    <div
      className="app-shell flex flex-col xl:flex-row"
      style={{ minHeight: "100vh", background: "var(--background)" }}
    >
      <a className="saltar-contenido" href="#contenido-principal">
        Ir al contenido
      </a>
      {perfil && usuarioAutenticado && (
        <BarraLateral
          current={pantalla}
          onNavigate={navegar}
          profile={perfil}
        />
      )}
      <main
        id="contenido-principal"
        tabIndex={-1}
        key={pantalla}
        className="transicion-pantalla"
        style={{ flex: 1, minWidth: 0, overflowY: "auto", minHeight: "100vh" }}
      >
        {usuarioAutenticado && (
          <ActividadesPendientes
            key={usuarioAutenticado.uid}
            actividades={ejerciciosPendientes}
            abierta={pantalla === "home"}
            alCancelar={(id) => {
              if (
                autenticacionFirebase?.currentUser?.uid !==
                usuarioAutenticado.uid
              )
                return
              canceladasConfirmadas.current.add(id)
              establecerRevisionCancelaciones((actual) => actual + 1)
              establecerEjerciciosPendientes((actuales) =>
                actuales.filter((actividad) => actividad.id !== id),
              )
            }}
            alRecuperar={(actividad) => {
              localStorage.setItem(
                ejercicioAlmacenamientoClave("pending"),
                JSON.stringify({
                  id: actividad.id,
                  type: actividad.exerciseType,
                }),
              )
              navegar(actividad.exerciseType as Pantalla)
            }}
          />
        )}
        {pantalla === "home" &&
          perfil &&
          (estadisticas.report ? (
            <PantallaInicio
              onNavigate={navegar}
              profile={perfil}
              report={estadisticas.report}
            />
          ) : (
            <EstadoEstadisticas
              error={estadisticas.error}
              retry={estadisticas.retry}
            />
          ))}
        {pantalla === "activities" && (
          <PantallaActividades
            onNavigate={navegar}
            categoryId={categoriaSeleccionada}
            onCategoryChange={establecerCategoriaSeleccionada}
          />
        )}
        {pantalla === "progress" && usuarioAutenticado && (
          <PantallaProgreso
            statistics={estadisticas}
            revisionCancelaciones={revisionCancelaciones}
          />
        )}
        {pantalla === "profile" && perfil && usuarioAutenticado && (
          <PantallaPerfil
            onNavigate={navegar}
            profile={perfil}
            uid={usuarioAutenticado.uid}
            statistics={estadisticas}
            onProfileChange={(actualizado) => {
              if (autenticacionFirebase?.currentUser?.uid === actualizado.uid)
                establecerPerfil(actualizado)
            }}
            onLogout={() => cerrarSesion(autenticacionFirebase!)}
          />
        )}
        {pantalla === "help" && <PantallaAyuda onNavigate={navegar} />}
      </main>
    </div>
  )
}
