import type { ReactNode } from "react"

export function AvanceEjercicio({
  completados,
  total,
  etiqueta,
  children,
}: {
  completados: number
  total: number
  etiqueta: string
  children?: ReactNode
}) {
  return (
    <div className="avance-ejercicio">
      <div className="avance-ejercicio-cabecera">
        <p className="text-xl font-bold">{etiqueta}</p>
        {children}
      </div>
      <progress
        aria-label="Progreso del ejercicio"
        aria-valuetext={`${completados} de ${total} completados`}
        max={total}
        value={completados}
      />
    </div>
  )
}
