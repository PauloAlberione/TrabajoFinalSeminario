import { useEffect, useState } from "react"
import { api } from "../../servicios/api"
import type {
  EstadisticasRango,
  InformeEstadisticas,
} from "../../../compartido/estadisticas"

export function useEstadisticas(uid: string | undefined, revision: number) {
  const [rango, establecerRango] = useState<EstadisticasRango>("30")
  const [informe, establecerInforme] = useState<InformeEstadisticas | null>(
    null,
  )
  const [error, establecerError] = useState("")
  const [intento, establecerIntento] = useState(0)
  const [cargadoClave, establecerCargadoClave] = useState("")
  const consultaClave = `${uid ?? ""}:${revision}:${rango}:${intento}`
  useEffect(() => {
    if (!uid) return
    let fecha = new Date().toDateString()
    const refrescarDay = () => {
      const actual = new Date().toDateString()
      if (actual !== fecha) {
        fecha = actual
        establecerIntento((valor) => valor + 1)
      }
    }
    const temporizador = window.setInterval(refrescarDay, 60000)
    document.addEventListener("visibilitychange", refrescarDay)
    return () => {
      window.clearInterval(temporizador)
      document.removeEventListener("visibilitychange", refrescarDay)
    }
  }, [uid])
  useEffect(() => {
    establecerInforme(null)
    establecerError("")
    if (!uid) return
    const abortar = new AbortController()
    api
      .obtenerEstadisticas(rango, abortar.signal)
      .then((valor) => {
        if (!abortar.signal.aborted) {
          establecerInforme(valor)
          establecerCargadoClave(consultaClave)
        }
      })
      .catch(() => {
        if (!abortar.signal.aborted) {
          establecerError("No pudimos cargar tus estadísticas.")
          establecerCargadoClave(consultaClave)
        }
      })
    return () => abortar.abort()
  }, [uid, revision, rango, intento])
  return {
    report: cargadoClave === consultaClave ? informe : null,
    error: cargadoClave === consultaClave ? error : "",
    range: rango,
    setRange: establecerRango,
    retry: () => establecerIntento((valor) => valor + 1),
  }
}

export function formatearTiempoActivo(segundos: number) {
  if (segundos < 60)
    return `${segundos.toLocaleString("es-AR", { maximumFractionDigits: 1 })} s`
  const minutos = Math.floor(segundos / 60)
  return minutos < 60
    ? `${minutos} min ${Math.floor(segundos % 60)} s`
    : `${Math.floor(minutos / 60)} h ${minutos % 60} min`
}

export const formatearPrecision = (valor: number | null) =>
  valor === null
    ? "Sin datos"
    : `${valor.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`
