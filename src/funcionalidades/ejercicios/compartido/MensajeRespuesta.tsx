export function MensajeRespuesta({
  mensaje,
  correcto,
}: {
  mensaje: string
  correcto?: boolean
}) {
  return (
    <div
      role="status"
      className="mensaje-respuesta"
      data-resultado={
        correcto === undefined
          ? "informacion"
          : correcto
            ? "correcto"
            : "revisar"
      }
    >
      <span className="mensaje-respuesta-icono" aria-hidden="true">
        {correcto === undefined ? "i" : correcto ? "✓" : "↻"}
      </span>
      <div>
        <p className="font-bold text-lg">
          {correcto === undefined
            ? "Tu respuesta"
            : correcto
              ? "¡Bien hecho!"
              : "Sigamos practicando"}
        </p>
        <p className="text-xl mt-1">{mensaje}</p>
      </div>
    </div>
  )
}
