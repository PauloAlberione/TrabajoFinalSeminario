import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { PaginaPoliticaPrivacidad } from "./PaginaPoliticaPrivacidad"

const privacidadHash = "#/privacidad"

export function NavegacionPoliticaPrivacidad({
  children: hijos,
}: {
  children: ReactNode
}) {
  const [abrir, establecerAbrir] = useState(
    () => window.location.hash === privacidadHash,
  )
  const actualAbrir = useRef(abrir)
  const anteriorFoco = useRef<HTMLElement | null>(null)
  const anteriorDesplazamiento = useRef(0)
  const restaurarFoco = useRef(false)
  const ingresadoDesdeAplicacion = useRef(false)
  useEffect(() => {
    const cambiado = () => {
      const siguiente = window.location.hash === privacidadHash
      if (siguiente === actualAbrir.current) return
      if (siguiente) {
        anteriorFoco.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
        anteriorDesplazamiento.current = window.scrollY
        ingresadoDesdeAplicacion.current = true
      } else restaurarFoco.current = true
      actualAbrir.current = siguiente
      establecerAbrir(siguiente)
    }
    window.addEventListener("hashchange", cambiado)
    return () => window.removeEventListener("hashchange", cambiado)
  }, [])
  useLayoutEffect(() => {
    if (abrir || !restaurarFoco.current) return
    restaurarFoco.current = false
    anteriorFoco.current?.focus({ preventScroll: true })
    window.scrollTo(0, anteriorDesplazamiento.current)
  }, [abrir])
  function volver() {
    if (ingresadoDesdeAplicacion.current) {
      window.history.back()
      return
    }
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    )
    actualAbrir.current = false
    establecerAbrir(false)
  }
  return (
    <>
      <div hidden={abrir}>{hijos}</div>
      {abrir && <PaginaPoliticaPrivacidad onBack={volver} />}
    </>
  )
}
