export function GuardandoResultado() {
  return (
    <div role="status" className="guardando-resultado">
      <span className="guardando-indicador" aria-hidden="true">
        ↥
      </span>
      <div>
        <p className="text-2xl font-bold">Guardando tu resultado…</p>
        <p className="text-lg mt-2 text-muted-foreground">
          Esperá un momento antes de salir. Estamos preparando tu resumen.
        </p>
      </div>
    </div>
  )
}
