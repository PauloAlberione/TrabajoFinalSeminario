import {
  useEffect,
  useState,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from "react"
import type { PerfilUsuario } from "../servicios/datosUsuario"
import type { Pantalla } from "../tipos/navegacion"
import {
  IconoInicio,
  IconoCerebro,
  IconoGrafico,
  IconoUsuario,
  IconoAyuda,
} from "./Iconos"
import { avatarUsuario } from "../utilidades/avatarUsuario"

export const OPCIONES_NAVEGACION: {
  id: Pantalla
  label: string
  icon: (activo: boolean) => ReactElement
}[] = [
  {
    id: "home",
    label: "Inicio",
    icon: (activo) => <IconoInicio active={activo} />,
  },
  {
    id: "activities",
    label: "Ejercicios",
    icon: (activo) => <IconoCerebro active={activo} />,
  },
  {
    id: "progress",
    label: "Progreso",
    icon: (activo) => <IconoGrafico active={activo} />,
  },
  {
    id: "profile",
    label: "Perfil",
    icon: (activo) => <IconoUsuario active={activo} />,
  },
  {
    id: "help",
    label: "Ayuda",
    icon: (activo) => <IconoAyuda active={activo} />,
  },
]

const ANCHO_MINIMO = 14
const ANCHO_MAXIMO = 22
const ANCHO_INICIAL = 17

function limitarAncho(valor: number) {
  return Number.isFinite(valor)
    ? Math.round(Math.min(ANCHO_MAXIMO, Math.max(ANCHO_MINIMO, valor)) * 10) /
        10
    : ANCHO_INICIAL
}

function leerAncho(clave: string) {
  try {
    const valor = localStorage.getItem(clave)
    return valor === null ? ANCHO_INICIAL : limitarAncho(Number(valor))
  } catch {
    return ANCHO_INICIAL
  }
}

export function BarraLateral({
  current: actual,
  onNavigate: alNavegar,
  profile: perfil,
}: {
  current: Pantalla
  onNavigate: (pantalla: Pantalla) => void
  profile: PerfilUsuario
}) {
  const clave = `menteclear:menu:${perfil.uid}`
  const claveAncho = `menteclear:ancho-menu:${perfil.uid}`
  const [ancho, establecerAncho] = useState(() => leerAncho(claveAncho))
  const arrastre = useRef<{
    id: number
    inicio: number
    ancho: number
    escala: number
  } | null>(null)
  const anchoActual = useRef(ancho)
  const separador = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const guardado = leerAncho(claveAncho)
    anchoActual.current = guardado
    establecerAncho(guardado)
  }, [claveAncho])
  useEffect(() => {
    function interrumpir() {
      const inicio = arrastre.current
      if (!inicio) return
      arrastre.current = null
      delete document.documentElement.dataset.ajustandoMenu
      try {
        localStorage.setItem(claveAncho, String(anchoActual.current))
      } catch {
        /* Se conserva el tamaño mientras esta pantalla siga abierta. */
      }
      if (separador.current?.hasPointerCapture(inicio.id))
        separador.current.releasePointerCapture(inicio.id)
    }
    window.addEventListener("blur", interrumpir)
    return () => {
      window.removeEventListener("blur", interrumpir)
      interrumpir()
    }
  }, [claveAncho])

  function cambiarAncho(valor: number, guardar = false) {
    const nuevo = limitarAncho(valor)
    anchoActual.current = nuevo
    establecerAncho(nuevo)
    if (guardar) {
      try {
        localStorage.setItem(claveAncho, String(nuevo))
      } catch {
        /* El ajuste funciona aunque no se pueda recordar. */
      }
    }
  }
  function comenzarAjuste(evento: PointerEvent<HTMLDivElement>) {
    if (evento.button !== 0 || arrastre.current) return
    evento.preventDefault()
    evento.currentTarget.focus()
    evento.currentTarget.setPointerCapture(evento.pointerId)
    arrastre.current = {
      id: evento.pointerId,
      inicio: evento.clientX,
      ancho: anchoActual.current,
      escala: parseFloat(getComputedStyle(document.documentElement).fontSize),
    }
    document.documentElement.dataset.ajustandoMenu = "true"
  }
  function moverAjuste(evento: PointerEvent<HTMLDivElement>) {
    const inicio = arrastre.current
    if (inicio?.id !== evento.pointerId) return
    cambiarAncho(
      inicio.ancho + (evento.clientX - inicio.inicio) / inicio.escala,
    )
  }
  function terminarAjuste(evento: PointerEvent<HTMLDivElement>) {
    if (arrastre.current?.id !== evento.pointerId) return
    arrastre.current = null
    delete document.documentElement.dataset.ajustandoMenu
    cambiarAncho(anchoActual.current, true)
    if (evento.currentTarget.hasPointerCapture(evento.pointerId))
      evento.currentTarget.releasePointerCapture(evento.pointerId)
  }
  function ajustarConTeclado(evento: KeyboardEvent<HTMLDivElement>) {
    const paso = evento.shiftKey ? 1 : 0.5
    const nuevo =
      evento.key === "ArrowRight"
        ? anchoActual.current + paso
        : evento.key === "ArrowLeft"
          ? anchoActual.current - paso
          : evento.key === "Home"
            ? ANCHO_MINIMO
            : evento.key === "End"
              ? ANCHO_MAXIMO
              : evento.key === "Enter"
                ? ANCHO_INICIAL
                : null
    if (nuevo === null) return
    evento.preventDefault()
    cambiarAncho(nuevo, true)
  }

  const [plegada, establecerPlegada] = useState(() => {
    try {
      const guardado = localStorage.getItem(clave)
      return guardado
        ? guardado === "plegado"
        : window.matchMedia("(max-width: 1279px)").matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(clave, plegada ? "plegado" : "abierto")
    } catch {
      /* La navegación también funciona sin almacenamiento. */
    }
  }, [clave, plegada])

  function navegar(pantalla: Pantalla) {
    alNavegar(pantalla)
    if (window.matchMedia("(max-width: 1279px)").matches)
      establecerPlegada(true)
  }

  return (
    <aside
      className="app-sidebar"
      data-plegada={plegada}
      style={{ "--ancho-menu": `${ancho}rem` } as CSSProperties}
    >
      <div className="barra-marca">
        <span className="barra-logo" aria-hidden="true">
          🧠
        </span>
        <div className="barra-etiqueta">
          <p className="font-bold font-serif">MenteClear</p>
          <p className="text-xs text-muted-foreground">
            Estimulación cognitiva
          </p>
        </div>
      </div>
      <button
        type="button"
        className="barra-alternar"
        aria-expanded={!plegada}
        aria-controls="navegacion-principal"
        aria-label={plegada ? "Mostrar menú" : "Ocultar menú"}
        title={plegada ? "Mostrar menú" : "Ocultar menú"}
        onClick={() => establecerPlegada((valor) => !valor)}
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="barra-etiqueta">
          {plegada ? "Mostrar menú" : "Ocultar menú"}
        </span>
      </button>
      <nav
        id="navegacion-principal"
        aria-label="Navegación principal"
        className="barra-navegacion"
      >
        {OPCIONES_NAVEGACION.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            aria-label={opcion.label}
            aria-current={actual === opcion.id ? "page" : undefined}
            title={plegada ? opcion.label : undefined}
            onClick={() => navegar(opcion.id)}
          >
            {opcion.icon(actual === opcion.id)}
            <span className="barra-etiqueta">{opcion.label}</span>
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="barra-cuenta"
        aria-label="Abrir mi perfil"
        title="Abrir mi perfil"
        onClick={() => navegar("profile")}
      >
        <span className="text-3xl shrink-0" aria-hidden="true">
          {avatarUsuario(perfil.gender, perfil.tonoAvatar)}
        </span>
        <span className="barra-etiqueta min-w-0 text-left">
          <span className="block font-bold break-words">
            {perfil.nombre} {perfil.apellido}
          </span>
          <span className="block text-xs text-muted-foreground break-all">
            {perfil.email}
          </span>
          <span className="block text-xs mt-1 font-semibold">
            Ver mi perfil →
          </span>
        </span>
      </button>
      <div
        ref={separador}
        role="separator"
        aria-label="Cambiar ancho del menú"
        aria-orientation="vertical"
        aria-valuemin={ANCHO_MINIMO}
        aria-valuemax={ANCHO_MAXIMO}
        aria-valuenow={ancho}
        aria-valuetext={`${Math.round(((ancho - ANCHO_MINIMO) / (ANCHO_MAXIMO - ANCHO_MINIMO)) * 100)}% entre compacto y amplio`}
        aria-controls="navegacion-principal"
        aria-describedby="ayuda-ancho-menu"
        tabIndex={0}
        className="barra-redimensionar"
        title="Arrastrá para ajustar. Doble clic para restablecer."
        onPointerDown={comenzarAjuste}
        onPointerMove={moverAjuste}
        onPointerUp={terminarAjuste}
        onPointerCancel={terminarAjuste}
        onLostPointerCapture={terminarAjuste}
        onKeyDown={ajustarConTeclado}
        onDoubleClick={() => cambiarAncho(ANCHO_INICIAL, true)}
      />
      <p id="ayuda-ancho-menu" className="sr-only">
        Arrastrá el borde para ajustar el ancho. Con el teclado, usá las flechas
        izquierda y derecha. Inicio y Fin eligen los límites. Enter restablece
        el tamaño original.
      </p>
    </aside>
  )
}
