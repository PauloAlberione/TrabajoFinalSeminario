import {
  nombrePais,
  nombreRegion,
  requiereRegion,
} from "../../../compartido/ubicacion"
import { useEffect, useState, useMemo } from "react"
import { api } from "../../servicios/api"
import { enviarRecordatorioVerificacion } from "../../servicios/datosUsuario"
import {
  PREDETERMINADO_RECORDATORIOS,
  type ConfiguracionRecordatorios as Ajustes,
  type RecordatorioPreferenciasRespuesta,
} from "../../../compartido/recordatorios"

const estadoMensajes: Record<RecordatorioPreferenciasRespuesta["status"], string> =
  {
    disabled: "Recordatorios desactivados. No recibirás avisos.",
    notConfigured:
      "El servicio de correo no está configurado. Tus preferencias se pueden guardar, pero los recordatorios todavía no están activos.",
    awaitingScheduler:
      "Tu solicitud está guardada. Los recordatorios están pendientes de activación: el programador aún no está disponible.",
    unverified:
      "Los recordatorios no están activos. Verificá el correo de tu cuenta; una cuenta deshabilitada tampoco puede recibir avisos.",
    deliveryError:
      "El último envío no pudo confirmarse. Los recordatorios no tienen entrega confirmada; se reintenta cuando corresponde. Podés conservar o desactivar tu solicitud.",
    ready:
      "Recordatorios habilitados y programados. El horario es aproximado; recibirás avisos solo mientras tu correo esté verificado.",
  }
const dayNombres = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
]

export function ConfiguracionRecordatorios({
  uid,
  disabled: deshabilitado,
  pais,
  zonaHoraria,
  alConfigurarPais,
}: {
  uid: string
  disabled: boolean
  pais?: string
  zonaHoraria?: string
  alConfigurarPais?: () => void
}) {
  const [ajustes, establecerAjustes] = useState<Ajustes>(
    PREDETERMINADO_RECORDATORIOS,
  )
  const [estado, establecerEstado] =
    useState<RecordatorioPreferenciasRespuesta["status"]>("notConfigured")
  const [cargando, establecerCargando] = useState(true)
  const [guardando, establecerGuardando] = useState(false)
  const [error, establecerError] = useState("")
  const [mensaje, establecerMensaje] = useState("")
  const [reintentar, establecerReintentar] = useState(0)
  const [cargado, establecerCargado] = useState(false)
  useEffect(() => {
    const controlador = new AbortController()
    establecerCargando(true)
    establecerError("")
    establecerCargado(false)
    api
      .obtenerRecordatorioPreferencias(controlador.signal)
      .then((resultado) => {
        if (controlador.signal.aborted) return
        establecerAjustes(resultado.settings)
        establecerEstado(resultado.status)
        establecerCargado(true)
      })
      .catch(() => {
        if (!controlador.signal.aborted)
          establecerError("No pudimos consultar los recordatorios.")
      })
      .finally(() => {
        if (!controlador.signal.aborted) establecerCargando(false)
      })
    return () => controlador.abort()
  }, [uid, reintentar, pais, zonaHoraria])
  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    establecerGuardando(true)
    establecerError("")
    establecerMensaje("")
    try {
      if (ajustes.enabled && (!pais || !zonaHoraria))
        throw new Error(
          "Completá tu país de residencia antes de activar los recordatorios.",
        )
      const resultado = await api.actualizarRecordatorioPreferencias({
        ...ajustes,
        timeZone: zonaHoraria ?? ajustes.timeZone,
      })
      establecerAjustes(resultado.settings)
      establecerEstado(resultado.status)
      establecerMensaje("Preferencias de recordatorios guardadas.")
    } catch (fallo) {
      establecerError(
        fallo instanceof Error
          ? fallo.message
          : "No pudimos guardar los recordatorios.",
      )
    } finally {
      establecerGuardando(false)
    }
  }
  async function verificar() {
    establecerGuardando(true)
    establecerError("")
    establecerMensaje("")
    try {
      await enviarRecordatorioVerificacion()
      establecerMensaje(
        "Enviamos el enlace de verificación. Después de usarlo, pulsá «Actualizar estado».",
      )
    } catch {
      establecerError(
        "No pudimos enviar la verificación. Esperá unos minutos e intentá nuevamente.",
      )
    } finally {
      establecerGuardando(false)
    }
  }
  const mostrarRegion = useMemo(
    () => (pais ? requiereRegion(pais) : false),
    [pais],
  )
  const noDisponible = deshabilitado || cargando || guardando || !cargado
  return (
    <section
      className="px-7 py-5 space-y-4"
      style={{ borderTop: "1px solid var(--border)" }}
      aria-labelledby="reminder-heading"
    >
      <h3 id="reminder-heading" className="text-lg font-bold">
        Recordatorios por correo
      </h3>
      {cargando && <p role="status">Consultando recordatorios…</p>}
      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      {cargado && !cargando && <p role="status">{estadoMensajes[estado]}</p>}
      <form onSubmit={guardar} className="space-y-4">
        <fieldset disabled={noDisponible} className="space-y-4">
          <legend className="sr-only">
            Preferencias de recordatorios por correo
          </legend>
          <label className="flex items-center gap-3 text-base font-semibold">
            <input
              type="checkbox"
              role="switch"
              className="w-7 h-7"
              checked={ajustes.enabled}
              onChange={(evento) =>
                establecerAjustes({
                  ...ajustes,
                  enabled: evento.target.checked,
                })
              }
            />
            Quiero recibir recordatorios por correo
          </label>
          <label className="block">
            Frecuencia de recordatorios
            <select
              className="block w-full p-3 rounded-xl mt-2"
              value={ajustes.frequency}
              onChange={(evento) => {
                const frecuencia = evento.target.value as Ajustes["frequency"]
                establecerAjustes({
                  ...ajustes,
                  frequency: frecuencia,
                  weekdays:
                    frecuencia === "weekly"
                      ? ajustes.weekdays.slice(0, 1)
                      : ajustes.weekdays,
                })
              }}
            >
              <option value="daily">Todos los días</option>
              <option value="weekdays">Días seleccionados</option>
              <option value="weekly">Una vez por semana</option>
            </select>
          </label>
          {ajustes.frequency === "weekly" && (
            <label className="block">
              Día de la semana
              <select
                className="block w-full p-3 rounded-xl mt-2"
                value={ajustes.weekdays[0]}
                onChange={(evento) =>
                  establecerAjustes({
                    ...ajustes,
                    weekdays: [Number(evento.target.value)],
                  })
                }
              >
                {dayNombres.map((nombre, day) => (
                  <option key={day} value={day}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          {ajustes.frequency === "weekdays" && (
            <fieldset className="flex flex-wrap gap-4">
              <legend>Días del recordatorio</legend>
              {dayNombres.map((nombre, day) => (
                <label key={day} className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    className="w-6 h-6"
                    checked={ajustes.weekdays.includes(day)}
                    onChange={(evento) =>
                      establecerAjustes({
                        ...ajustes,
                        weekdays: evento.target.checked
                          ? [...ajustes.weekdays, day].sort()
                          : ajustes.weekdays.filter((valor) => valor !== day),
                      })
                    }
                  />
                  {nombre}
                </label>
              ))}
            </fieldset>
          )}
          <label className="block">
            Hora preferida
            <input
              type="time"
              required
              className="block w-full p-3 rounded-xl mt-2"
              value={ajustes.time}
              onChange={(evento) =>
                establecerAjustes({ ...ajustes, time: evento.target.value })
              }
            />
          </label>
          <div className="p-4 rounded-2xl bg-muted text-sm">
            {pais && zonaHoraria ? (
              <p>
                El recordatorio se enviará a la hora elegida de{" "}
                {nombrePais(pais)}
                {mostrarRegion ? ` (${nombreRegion(zonaHoraria)})` : ""}. Los
                cambios de hora estacionales se aplican automáticamente.
              </p>
            ) : (
              <p>
                Indicá tu país en «Editar perfil» para usar tu horario local.
                Los horarios anteriores se conservan hasta que guardes tu
                ubicación.
              </p>
            )}
            {alConfigurarPais && (
              <button
                type="button"
                className="mt-2 underline font-semibold"
                onClick={alConfigurarPais}
              >
                {pais ? "Cambiar país o región" : "Configurar mi país"}
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl font-bold"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {guardando ? "Guardando…" : "Guardar recordatorios"}
          </button>
        </fieldset>
      </form>
      <div className="flex flex-wrap gap-3">
        {estado === "unverified" && cargado && (
          <button
            type="button"
            disabled={deshabilitado || guardando}
            onClick={() => void verificar()}
            className="px-5 py-3 rounded-2xl font-semibold"
            style={{ background: "var(--muted)" }}
          >
            Enviar verificación de correo
          </button>
        )}
        <button
          type="button"
          disabled={deshabilitado || guardando || cargando}
          onClick={() => {
            establecerMensaje("")
            establecerReintentar((valor) => valor + 1)
          }}
          className="px-5 py-3 rounded-2xl font-semibold"
          style={{ background: "var(--muted)" }}
        >
          Actualizar estado
        </button>
      </div>
    </section>
  )
}
