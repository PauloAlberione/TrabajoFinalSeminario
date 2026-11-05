export class ActivoTiempo {
  private accumulated = 0
  private startedAt: number | null = null

  resume(ahora: number) {
    if (this.startedAt === null) this.startedAt = ahora
  }
  read(ahora: number) {
    return (
      this.accumulated +
      (this.startedAt === null ? 0 : Math.max(0, ahora - this.startedAt))
    )
  }
  pause(ahora: number) {
    this.accumulated = this.read(ahora)
    this.startedAt = null
    return this.accumulated
  }
  restore(milisegundos: number) {
    if (!Number.isFinite(milisegundos) || milisegundos < 0)
      throw new Error("Tiempo inválido.")
    this.accumulated = milisegundos
    this.startedAt = null
  }
  reset() {
    this.accumulated = 0
    this.startedAt = null
  }
}
