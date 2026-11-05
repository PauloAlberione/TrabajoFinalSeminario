import { useEffect, useRef, useState } from "react"
import { useAccesibilidad } from "../accesibilidad/ProveedorAccesibilidad"
import { audioJuego } from "../../servicios/audioJuego"

export function ControlVolumenAudio({
  volume: volumen = 30,
  enabled: habilitado,
  disabled: deshabilitado,
  onSave: alGuardar,
}: {
  volume: number
  enabled: boolean
  disabled: boolean
  onSave: (volumen: number) => Promise<boolean>
}) {
  const [borrador, establecerBorrador] = useState(volumen)
  const [mensaje, establecerMensaje] = useState("")
  const modificado = useRef(false)
  const accesibilidad = useAccesibilidad()

  useEffect(() => {
    if (!modificado.current) establecerBorrador(volumen)
  }, [volumen])

  async function confirmar() {
    if (!modificado.current || deshabilitado) return
    modificado.current = false
    if (!(await alGuardar(borrador))) establecerBorrador(volumen)
  }

  async function vistaPrevia() {
    establecerMensaje("Preparando sonido de prueba…")
    const permitido = await audioJuego.desbloquear()
    establecerMensaje(
      permitido && audioJuego.reproducir("correct")
        ? "Vista previa de sonido iniciada."
        : "El navegador no permite reproducir audio ahora. Podés continuar con la información visual.",
    )
  }

  return (
    <div
      className="px-7 py-5 space-y-4"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <label htmlFor="game-volume" className="block text-lg font-semibold">
        Volumen del juego: <output htmlFor="game-volume">{borrador}%</output>
      </label>
      <input
        id="game-volume"
        type="range"
        min={0}
        max={100}
        step={1}
        value={borrador}
        disabled={deshabilitado}
        aria-valuetext={`${borrador} por ciento`}
        className="w-full h-12"
        style={{ accentColor: "var(--primary)" }}
        onChange={(evento) => {
          const valor = Number(evento.target.value)
          modificado.current = true
          establecerBorrador(valor)
          establecerMensaje("")
          accesibilidad?.preview({ volumenSonidos: valor })
        }}
        onPointerUp={() => void confirmar()}
        onKeyUp={() => void confirmar()}
        onBlur={() => void confirmar()}
      />
      <p className="text-sm">
        0% silencia los efectos. El volumen se guarda al terminar el ajuste. Los
        avisos visuales permanecen disponibles.
      </p>
      <button
        type="button"
        disabled={deshabilitado || !habilitado || borrador === 0}
        onClick={vistaPrevia}
        className="px-6 py-3 rounded-2xl text-lg font-bold disabled:opacity-50"
        style={{ background: "var(--muted)" }}
      >
        Probar sonido
      </button>
      {mensaje && <p role="status">{mensaje}</p>}
    </div>
  )
}
