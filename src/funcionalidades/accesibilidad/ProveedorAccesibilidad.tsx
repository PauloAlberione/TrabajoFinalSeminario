import { audioJuego } from "../../servicios/audioJuego"
import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  PREDETERMINADO_PREFERENCIAS,
  type PreferenciasAccesibilidad,
} from "../../../compartido/perfil"

interface AccesibilidadEstado {
  preferences: PreferenciasAccesibilidad
  restoreProfile: (
    uid?: string,
    preferencias?: PreferenciasAccesibilidad,
  ) => void
  preview: (cambios: Partial<PreferenciasAccesibilidad>) => void
  confirm: (uid: string, preferencias: PreferenciasAccesibilidad) => void
  rollback: (uid: string) => void
}

const AccesibilidadContexto = createContext<AccesibilidadEstado | null>(null)

export function ProveedorAccesibilidad({
  children: hijos,
}: {
  children: ReactNode
}) {
  const [preferencias, establecerPreferencias] = useState(
    PREDETERMINADO_PREFERENCIAS,
  )
  const confirmado = useRef<{
    uid?: string
    preferences: PreferenciasAccesibilidad
  }>({ preferences: PREDETERMINADO_PREFERENCIAS })
  const restaurarPerfil = useCallback(
    (uid?: string, valor = PREDETERMINADO_PREFERENCIAS) => {
      if (confirmado.current.uid !== uid) audioJuego.restablecer()
      const siguiente = { ...PREDETERMINADO_PREFERENCIAS, ...valor }
      confirmado.current = { uid, preferences: siguiente }
      establecerPreferencias(siguiente)
    },
    [],
  )
  const vistaPrevia = useCallback(
    (cambios: Partial<PreferenciasAccesibilidad>) =>
      establecerPreferencias((actual) => ({ ...actual, ...cambios })),
    [],
  )
  const confirmar = useCallback(
    (uid: string, valor: PreferenciasAccesibilidad) => {
      if (confirmado.current.uid !== uid) return
      confirmado.current.preferences = valor
      establecerPreferencias(valor)
    },
    [],
  )
  const revertir = useCallback((uid: string) => {
    if (confirmado.current.uid === uid)
      establecerPreferencias(confirmado.current.preferences)
  }, [])
  useLayoutEffect(() => {
    audioJuego.configurar(
      !!confirmado.current.uid && preferencias.sonidos,
      preferencias.volumenSonidos,
    )
  }, [preferencias])
  useEffect(() => {
    const gesto = (evento: Event) => {
      if (!evento.isTrusted) return
      audioJuego.detener()
      void audioJuego.desbloquear()
    }
    const oculto = () => {
      if (document.hidden) audioJuego.detener()
    }
    document.addEventListener("pointerdown", gesto, true)
    document.addEventListener("keydown", gesto, true)
    document.addEventListener("visibilitychange", oculto)
    return () => {
      document.removeEventListener("pointerdown", gesto, true)
      document.removeEventListener("keydown", gesto, true)
      document.removeEventListener("visibilitychange", oculto)
      audioJuego.restablecer()
    }
  }, [])
  useLayoutEffect(() => {
    document.documentElement.dataset.textSize = preferencias.tamanoTexto
    document.documentElement.dataset.contrast = preferencias.altoContraste
      ? "high"
      : "normal"
    document.documentElement.dataset.expandedInstructions = String(
      preferencias.instruccionesAmpliadas,
    )
  }, [preferencias])
  useLayoutEffect(
    () => () => {
      delete document.documentElement.dataset.textSize
      delete document.documentElement.dataset.contrast
      delete document.documentElement.dataset.expandedInstructions
    },
    [],
  )
  return (
    <AccesibilidadContexto.Provider
      value={{
        preferences: preferencias,
        restoreProfile: restaurarPerfil,
        preview: vistaPrevia,
        confirm: confirmar,
        rollback: revertir,
      }}
    >
      {hijos}
    </AccesibilidadContexto.Provider>
  )
}

export function useAccesibilidad() {
  return useContext(AccesibilidadContexto)
}

export function usePerfilAccesibilidad(
  perfil: {
    uid: string
    preferenciasAccesibilidad: PreferenciasAccesibilidad
  } | null,
) {
  const contexto = useAccesibilidad()
  const restaurarPerfil = contexto?.restoreProfile
  useLayoutEffect(() => {
    restaurarPerfil?.(perfil?.uid, perfil?.preferenciasAccesibilidad)
  }, [perfil, restaurarPerfil])
}
