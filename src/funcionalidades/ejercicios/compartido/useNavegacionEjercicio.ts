import { validarPuntoControl } from "../../../../compartido/sesionPuntoControl"
import type { IdFuncionCognitiva } from "../../../../compartido/resultados"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import {
  api,
  ejercicioAlmacenamientoClave,
  propietarioToken,
} from "../../../servicios/api"
import type { PuntoControlEjercicio } from "../../../../compartido/sesionEjercicio"

export const EJERCICIO_NAVEGACION_EVENTO = "exercise:navigate"

export interface EjercicioNavegacionSolicitud {
  proceed: () => void
}

interface RecuperacionSesion {
  id: string
  status: string
  ownerToken?: string
  previousOwnerToken?: string
  checkpoint?: PuntoControlEjercicio
  pendingResult?: { response: unknown }
  exercise: {
    id: string
    type: string
    cognitiveFunctionId: IdFuncionCognitiva
    payload: unknown
  }
}

interface Adaptador {
  capture: () => PuntoControlEjercicio
  restore: (
    sesion: RecuperacionSesion,
    puntoControl: PuntoControlEjercicio,
  ) => void
}

export function useNavegacionEjercicio({
  sessionId: idSesion,
  active: activo,
  onBack: alVolver,
  paused: pausado,
  setPaused: establecerPausa,
  setBusy: establecerOcupado,
  navigationBlocked: navegacionBloqueado = false,
  exerciseType: ejercicioTipo,
}: {
  sessionId: string | undefined
  active: boolean
  onBack: () => void
  paused: boolean
  setPaused: (valor: boolean) => void
  setBusy: (valor: boolean) => void
  navigationBlocked?: boolean
  exerciseType: string
}) {
  const [salirAbrir, establecerSalirAbrir] = useState(false),
    [salirError, establecerSalirError] = useState("")
  const [sesionError, establecerSesionError] = useState(""),
    [recuperable, establecerRecuperable] = useState<string | null>(null)
  const [recuperando, establecerRecuperando] = useState(false),
    [comprobandoRecuperacion, establecerComprobandoRecuperacion] =
      useState(true)
  const dialogoReferencia = useRef<HTMLDialogElement>(null),
    suspendido = useRef(false)
  const operacionPendiente = useRef(false),
    permitirNavegacion = useRef(false),
    guardando = useRef(false)
  const estabaPausado = useRef(false),
    secuencia = useRef(0),
    cola = useRef<Promise<unknown>>(Promise.resolve())
  const destino = useRef<() => void>(alVolver),
    adaptador = useRef<Adaptador | null>(null)
  const actual = useRef({
    sessionId: idSesion,
    active: activo,
    onBack: alVolver,
    paused: pausado,
    setPaused: establecerPausa,
    setBusy: establecerOcupado,
    navigationBlocked: navegacionBloqueado,
    exerciseType: ejercicioTipo,
  })
  actual.current = {
    sessionId: idSesion,
    active: activo,
    onBack: alVolver,
    paused: pausado,
    setPaused: establecerPausa,
    setBusy: establecerOcupado,
    navigationBlocked: navegacionBloqueado,
    exerciseType: ejercicioTipo,
  }
  const bloqueado = () => guardando.current || actual.current.navigationBlocked
  function capturar() {
    const contexto = actual.current
    if (!contexto.sessionId || !adaptador.current) return undefined
    const puntoControl = structuredClone({
      ...adaptador.current.capture(),
      sequence: ++secuencia.current,
      writerToken: propietarioToken(contexto.sessionId!),
    })
    if (guardando.current) puntoControl.phase = "saving"
    try {
      localStorage.setItem(
        ejercicioAlmacenamientoClave(`state:${contexto.sessionId}`),
        JSON.stringify(puntoControl),
      )
      localStorage.setItem(
        ejercicioAlmacenamientoClave("pending"),
        JSON.stringify({ id: contexto.sessionId, type: contexto.exerciseType }),
      )
    } catch {
      establecerSesionError(
        "No pudimos conservar la copia local. Pausá para guardar el avance en el servidor.",
      )
    }
    return puntoControl
  }
  const escribir = useCallback((estado: string, mantenerConexion = false) => {
    const contexto = actual.current,
      puntoControl = capturar()
    if (!contexto.sessionId) return Promise.resolve()
    const enviar = () =>
      api.sesionEstado(
        contexto.sessionId!,
        estado,
        puntoControl,
        mantenerConexion,
      )
    if (mantenerConexion) return enviar()
    const pendiente = cola.current.catch(() => {}).then(enviar)
    cola.current = pendiente
    return pendiente
  }, [])
  const alternarPausar = useCallback(async () => {
    const contexto = actual.current
    if (
      operacionPendiente.current ||
      bloqueado() ||
      !contexto.sessionId ||
      document.hidden
    )
      return
    operacionPendiente.current = true
    contexto.setBusy(true)
    establecerSesionError("")
    const reanudar = contexto.paused
    if (!reanudar) {
      suspendido.current = true
      contexto.setPaused(true)
    }
    try {
      await escribir(reanudar ? "active" : "paused")
      if (reanudar) {
        suspendido.current = false
        contexto.setPaused(false)
      }
    } catch {
      suspendido.current = true
      contexto.setPaused(true)
      establecerSesionError(
        "El ejercicio está pausado. No pudimos sincronizarlo; intentá continuar nuevamente.",
      )
    } finally {
      operacionPendiente.current = false
      contexto.setBusy(false)
    }
  }, [escribir])
  useEffect(() => {
    if (salirAbrir) dialogoReferencia.current?.showModal()
    else dialogoReferencia.current?.close()
  }, [salirAbrir])
  const solicitudSalir = useCallback(
    async (continuar?: () => void) => {
      const contexto = actual.current
      if (bloqueado()) {
        establecerSesionError(
          "Estamos protegiendo tu resultado. Esperá o reintentá el guardado antes de salir.",
        )
        return
      }
      if (!contexto.active || !contexto.sessionId) {
        ;(continuar ?? contexto.onBack)()
        return
      }
      if (operacionPendiente.current || salirAbrir) return
      estabaPausado.current = contexto.paused
      destino.current = continuar ?? contexto.onBack
      suspendido.current = true
      contexto.setPaused(true)
      establecerSalirAbrir(true)
      establecerSalirError("")
      contexto.setBusy(true)
      operacionPendiente.current = true
      try {
        await escribir("paused")
      } catch {
        establecerSalirError(
          "El tiempo está detenido. No pudimos registrar la pausa; podés reintentar salir o continuar.",
        )
      } finally {
        operacionPendiente.current = false
        contexto.setBusy(false)
      }
    },
    [escribir, salirAbrir],
  )
  const limpiarRecuperacion = useCallback(() => {
    try {
      const id = actual.current.sessionId
      if (id)
        localStorage.removeItem(ejercicioAlmacenamientoClave(`state:${id}`))
      const puntero = localStorage.getItem(
        ejercicioAlmacenamientoClave("pending"),
      )
      if (puntero && JSON.parse(puntero).id === id)
        localStorage.removeItem(ejercicioAlmacenamientoClave("pending"))
    } catch {
      establecerSesionError(
        "El resultado de la operación se guardó, pero no pudimos limpiar la copia local.",
      )
    }
  }, [])
  const resolverSalir = useCallback(
    async (salir: boolean) => {
      const contexto = actual.current
      if (!contexto.sessionId || operacionPendiente.current || bloqueado())
        return
      operacionPendiente.current = true
      contexto.setBusy(true)
      establecerSalirError("")
      try {
        await escribir(
          salir ? "cancelled" : estabaPausado.current ? "paused" : "active",
        )
        if (salir) {
          limpiarRecuperacion()
          permitirNavegacion.current = true
          destino.current()
          return
        }
        suspendido.current = estabaPausado.current
        establecerSalirAbrir(false)
        contexto.setPaused(estabaPausado.current)
      } catch {
        establecerSalirError(
          salir
            ? "No pudimos cancelar la sesión. Intentá nuevamente."
            : "No pudimos reanudar la sesión. Intentá nuevamente.",
        )
      } finally {
        operacionPendiente.current = false
        contexto.setBusy(false)
      }
    },
    [escribir, limpiarRecuperacion],
  )
  useEffect(() => {
    let cancelado = false
    establecerComprobandoRecuperacion(true)
    try {
      const puntero = JSON.parse(
        localStorage.getItem(ejercicioAlmacenamientoClave("pending")) ?? "null",
      )
      if (puntero?.type === ejercicioTipo) establecerRecuperable(puntero.id)
    } catch {
      establecerSesionError(
        "No pudimos leer la copia local. Intentaremos recuperar el avance desde el servidor.",
      )
    }
    void api
      .pendienteSesiones()
      .then((sesiones) => {
        if (cancelado || actual.current.sessionId) return
        const coincidencia = sesiones.find(
          (elemento) => elemento.exerciseType === ejercicioTipo,
        )
        if (coincidencia)
          establecerRecuperable((anterior) => anterior ?? coincidencia.id)
      })
      .catch(() => {
        if (!cancelado)
          establecerSesionError(
            "No pudimos consultar las sesiones pendientes. Conservamos la copia local si está disponible.",
          )
      })
      .finally(() => {
        if (!cancelado) establecerComprobandoRecuperacion(false)
      })
    return () => {
      cancelado = true
    }
  }, [ejercicioTipo])
  const recuperar = useCallback(async () => {
    if (!recuperable || !adaptador.current || operacionPendiente.current) return
    operacionPendiente.current = true
    establecerRecuperando(true)
    establecerSesionError("")
    actual.current.setBusy(true)
    try {
      const remoto = await api.obtenerSesion<RecuperacionSesion>(recuperable)
      if (["completed", "cancelled"].includes(remoto.status)) {
        localStorage.removeItem(ejercicioAlmacenamientoClave("pending"))
        establecerRecuperable(null)
        establecerSesionError(
          "Esta sesión ya terminó. Podés comenzar una nueva actividad.",
        )
        return
      }
      if (remoto.exercise.type !== actual.current.exerciseType)
        throw new Error("El ejercicio no coincide.")
      let puntoControl = remoto.checkpoint
      try {
        const local = JSON.parse(
          localStorage.getItem(
            ejercicioAlmacenamientoClave(`state:${recuperable}`),
          ) ?? "null",
        ) as PuntoControlEjercicio | null
        if (
          local &&
          local.writerToken === remoto.ownerToken &&
          local.exerciseId === remoto.exercise.id &&
          (!puntoControl ||
            Number(local.sequence ?? 0) >= Number(puntoControl.sequence ?? 0))
        )
          puntoControl = {
            ...validarPuntoControl(remoto.exercise, local),
            writerToken: local.writerToken,
          }
      } catch {
        /* El punto de recuperación del servidor sigue disponible si la copia del navegador está dañada. */
      }
      const reservado =
        await api.recuperarSesion<RecuperacionSesion>(recuperable)
      const anteriorPropietario =
        reservado.previousOwnerToken ?? remoto.ownerToken
      if (
        puntoControl?.writerToken &&
        puntoControl.writerToken !== anteriorPropietario
      )
        puntoControl = reservado.checkpoint
      if (
        reservado.checkpoint &&
        (!puntoControl ||
          Number(reservado.checkpoint.sequence ?? 0) >
            Number(puntoControl.sequence ?? 0))
      )
        puntoControl = reservado.checkpoint
      if (!puntoControl && reservado.pendingResult)
        puntoControl = {
          ...adaptador.current.capture(),
          exerciseId: reservado.exercise.id,
          phase: "saving",
        }
      if (!puntoControl)
        throw new Error(
          "La sesión se interrumpió antes de guardar un punto de recuperación. Salí y cancelala para empezar nuevamente.",
        )
      if (reservado.status === "saving")
        puntoControl = { ...puntoControl, phase: "saving" }
      secuencia.current = Number(puntoControl.sequence ?? 0)
      suspendido.current = true
      guardando.current =
        reservado.status === "saving" || puntoControl.phase === "saving"
      puntoControl = validarPuntoControl(reservado.exercise, puntoControl)
      adaptador.current.restore(reservado, puntoControl)
      actual.current.setPaused(!guardando.current)
      if (puntoControl.phase === "saving" && reservado.status !== "saving")
        await api.sesionEstado(reservado.id, "active")
      establecerRecuperable(null)
      if (guardando.current)
        establecerSesionError(
          "El resultado quedó pendiente. Seleccioná Reintentar guardado para completar el envío.",
        )
    } catch (error) {
      establecerSesionError(
        error instanceof Error
          ? error.message
          : "No pudimos recuperar la sesión.",
      )
    } finally {
      operacionPendiente.current = false
      establecerRecuperando(false)
      actual.current.setBusy(false)
    }
  }, [recuperable])
  const cancelarRecuperacion = useCallback(async () => {
    if (
      !recuperable ||
      !window.confirm(
        "¿Querés cancelar esta sesión pendiente? No se guardará como completada.",
      )
    )
      return
    establecerRecuperando(true)
    try {
      await api.cancelarSesionPendiente(recuperable)
      establecerRecuperable(null)
    } catch (error) {
      establecerSesionError(
        error instanceof Error
          ? error.message
          : "No pudimos cancelar la sesión.",
      )
    } finally {
      establecerRecuperando(false)
    }
  }, [recuperable])
  useLayoutEffect(() => {
    if (activo && !permitirNavegacion.current) capturar()
  })
  useEffect(() => {
    if (!activo || !idSesion) return
    const sincronizar = () => {
      if (
        bloqueado() ||
        operacionPendiente.current ||
        document.hidden ||
        actual.current.paused
      )
        return
      void escribir("active").catch(() => {
        if (
          bloqueado() ||
          permitirNavegacion.current ||
          actual.current.paused ||
          actual.current.sessionId !== idSesion
        )
          return
        suspendido.current = true
        actual.current.setPaused(true)
        establecerSesionError(
          "La sesión está pausada porque no pudimos sincronizar el avance. Intentá continuar; si abriste otra pestaña, recuperá allí la sesión.",
        )
      })
    }
    sincronizar()
    const latido = window.setInterval(sincronizar, 5000)
    return () => clearInterval(latido)
  }, [activo, idSesion, escribir])
  useEffect(() => {
    if (!activo) return
    permitirNavegacion.current = false
    const ocultar = () => {
      if (!document.hidden || bloqueado()) return
      suspendido.current = true
      actual.current.setPaused(true)
      void escribir("paused", true).catch(() =>
        establecerSesionError(
          "El ejercicio sigue pausado. No pudimos guardar el último avance en el servidor.",
        ),
      )
    }
    const ocultarPagina = () => {
      capturar()
      if (!bloqueado()) {
        suspendido.current = true
        actual.current.setPaused(true)
        void escribir("paused", true).catch(() => {})
      }
    }
    const navegar = (evento: Event) => {
      if (permitirNavegacion.current) return
      evento.preventDefault()
      void solicitudSalir(
        (evento as CustomEvent<EjercicioNavegacionSolicitud>).detail.proceed,
      )
    }
    const originalEstado = window.history.state
    if (!originalEstado?.exerciseGuard)
      window.history.pushState({ ...originalEstado, exerciseGuard: true }, "")
    const navegadorVolver = () => {
      window.history.pushState({ ...originalEstado, exerciseGuard: true }, "")
      void solicitudSalir()
    }
    const descargarPagina = (evento: BeforeUnloadEvent) => {
      if (permitirNavegacion.current) return
      capturar()
      evento.preventDefault()
      evento.returnValue = ""
    }
    window.addEventListener(EJERCICIO_NAVEGACION_EVENTO, navegar)
    window.addEventListener("popstate", navegadorVolver)
    window.addEventListener("beforeunload", descargarPagina)
    window.addEventListener("pagehide", ocultarPagina)
    document.addEventListener("visibilitychange", ocultar)
    ocultar()
    return () => {
      window.removeEventListener(EJERCICIO_NAVEGACION_EVENTO, navegar)
      window.removeEventListener("popstate", navegadorVolver)
      window.removeEventListener("beforeunload", descargarPagina)
      window.removeEventListener("pagehide", ocultarPagina)
      document.removeEventListener("visibilitychange", ocultar)
    }
  }, [activo, solicitudSalir, escribir])
  return {
    checkingRecovery: comprobandoRecuperacion,
    exitOpen: salirAbrir,
    exitError: salirError,
    dialogRef: dialogoReferencia,
    suspended: suspendido,
    requestExit: solicitudSalir,
    resolveExit: resolverSalir,
    togglePause: alternarPausar,
    sessionError: sesionError,
    recoverable: recuperable,
    recovering: recuperando,
    recover: recuperar,
    cancelRecovery: cancelarRecuperacion,
    configure: (
      capturarEstado: Adaptador["capture"],
      restaurarEstado: Adaptador["restore"],
    ) => {
      adaptador.current = { capture: capturarEstado, restore: restaurarEstado }
    },
    checkpoint: capturar,
    isSaving: guardando.current,
    protectSave: () => {
      guardando.current = true
      suspendido.current = true
      capturar()
    },
    saved: () => {
      guardando.current = false
      suspendido.current = false
      permitirNavegacion.current = true
      limpiarRecuperacion()
    },
  }
}

export type EjercicioNavegacion = ReturnType<typeof useNavegacionEjercicio>
