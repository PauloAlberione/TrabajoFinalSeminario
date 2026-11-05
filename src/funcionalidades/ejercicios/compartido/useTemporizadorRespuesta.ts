import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react"
import { ActivoTiempo } from "../../../../compartido/tiempoActivo"

export function useTemporizadorRespuesta(
  ejecutando: boolean,
  suspendido: RefObject<boolean>,
) {
  const total = useRef(0)
  const reloj = useRef(new ActivoTiempo())
  const [segundos, establecerSegundos] = useState(0)
  const muestra = useCallback(() => {
    total.current = reloj.current.read(performance.now()) / 1000
    return total.current
  }, [])
  const detener = useCallback(() => {
    total.current = reloj.current.pause(performance.now()) / 1000
    establecerSegundos(total.current)
    return total.current
  }, [])
  useLayoutEffect(() => {
    if (!ejecutando || document.hidden || suspendido.current) {
      reloj.current.pause(performance.now())
      muestra()
      return
    }
    reloj.current.resume(performance.now())
    const intervalo = window.setInterval(() => {
      if (suspendido.current) reloj.current.pause(performance.now())
      establecerSegundos(muestra())
    }, 50)
    return () => {
      window.clearInterval(intervalo)
      reloj.current.pause(performance.now())
      muestra()
    }
  }, [ejecutando, suspendido, muestra])
  return {
    seconds: segundos,
    total,
    sample: muestra,
    stop: detener,
    restore: (valor: number) => {
      reloj.current.restore(valor * 1000)
      total.current = valor
      establecerSegundos(valor)
    },
    reset: () => {
      reloj.current.reset()
      total.current = 0
      establecerSegundos(0)
    },
  }
}
