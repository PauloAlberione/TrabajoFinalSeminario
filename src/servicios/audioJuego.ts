export type JuegoSonido = "correct" | "incorrect" | "complete"

const melodias: Record<JuegoSonido, number[]> = {
  correct: [523.25, 659.25],
  incorrect: [293.66],
  complete: [523.25, 659.25, 783.99],
}

export class AudioJuego {
  private contexto: AudioContext | null = null
  private habilitado = false
  private volumen = 30
  private desbloqueando: Promise<boolean> | null = null
  private voces = new Set<{
    oscillator: OscillatorNode
    gain: GainNode
  }>()
  constructor(
    private crearContexto: () => AudioContext | null,
    private visible = () => typeof document !== "undefined" && !document.hidden,
  ) {}
  configurar(habilitado: boolean, volumen: number) {
    this.habilitado = habilitado
    const siguiente = Number.isFinite(volumen)
      ? Math.min(100, Math.max(0, volumen))
      : 0
    if (!habilitado || siguiente !== this.volumen) this.detener()
    this.volumen = siguiente
    if (!habilitado || siguiente === 0) this.restablecer()
  }
  async desbloquear(): Promise<boolean> {
    if (!this.habilitado || !this.volumen || !this.visible()) return false
    try {
      this.contexto ??= this.crearContexto()
      const contexto = this.contexto
      if (!contexto) return false
      if (contexto.state === "running") return true
      if (this.desbloqueando) return this.desbloqueando
      let vencimiento: ReturnType<typeof setTimeout>
      const desbloqueando = new Promise<boolean>((resolver) => {
        vencimiento = setTimeout(() => resolver(false), 1000)
        void contexto.resume().then(
          () =>
            resolver(
              this.contexto === contexto && contexto.state === "running",
            ),
          () => resolver(false),
        )
      }).finally(() => {
        clearTimeout(vencimiento)
        if (this.desbloqueando === desbloqueando) this.desbloqueando = null
      })
      this.desbloqueando = desbloqueando
      return desbloqueando
    } catch {
      return false
    }
  }
  reproducir(sonido: JuegoSonido): boolean {
    const contexto = this.contexto
    if (
      !this.habilitado ||
      !this.volumen ||
      !this.visible() ||
      !contexto ||
      contexto.state !== "running"
    )
      return false
    this.detener()
    try {
      for (const [indice, frecuencia] of melodias[sonido].entries()) {
        const oscilador = contexto.createOscillator(),
          ganancia = contexto.createGain()
        const iniciar = contexto.currentTime + indice * 0.11,
          fin = iniciar + 0.16
        oscilador.type = "sine"
        oscilador.frequency.setValueAtTime(frecuencia, iniciar)
        ganancia.gain.setValueAtTime(0, iniciar)
        ganancia.gain.linearRampToValueAtTime(
          (0.06 * this.volumen) / 100,
          iniciar + 0.025,
        )
        ganancia.gain.linearRampToValueAtTime(0, fin)
        oscilador.connect(ganancia)
        ganancia.connect(contexto.destination)
        const voz = { oscillator: oscilador, gain: ganancia }
        this.voces.add(voz)
        oscilador.onended = () => {
          oscilador.disconnect()
          ganancia.disconnect()
          this.voces.delete(voz)
        }
        oscilador.start(iniciar)
        oscilador.stop(fin)
      }
      return true
    } catch {
      this.detener()
      return false
    }
  }
  detener() {
    for (const voz of this.voces) {
      voz.oscillator.onended = null
      try {
        voz.oscillator.stop()
      } catch {
        /* El tono programado puede haber terminado. */
      }
      voz.oscillator.disconnect()
      voz.gain.disconnect()
    }
    this.voces.clear()
  }
  restablecer() {
    this.detener()
    const anterior = this.contexto
    this.contexto = null
    this.desbloqueando = null
    if (anterior && anterior.state !== "closed")
      void anterior.close().catch(() => {})
  }
}

export const audioJuego = new AudioJuego(() => {
  if (typeof window === "undefined") return null
  const Audio =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  return Audio ? new Audio() : null
})
