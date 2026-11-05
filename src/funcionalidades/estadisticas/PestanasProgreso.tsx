import { useRef, type KeyboardEvent } from "react"

const secciones = [
  { id: "resumen", titulo: "Resumen", icono: "🏠" },
  { id: "actividad", titulo: "Actividad", icono: "📊" },
  { id: "categorias", titulo: "Categorías", icono: "🧠" },
  { id: "historial", titulo: "Historial", icono: "🗂️" },
  { id: "informes", titulo: "Informes", icono: "📄" },
] as const

export type SeccionProgreso = typeof secciones[number]["id"]

export function PestanasProgreso({
  idBase,
  actual,
  alCambiar,
}: {
  idBase: string
  actual: SeccionProgreso
  alCambiar: (seccion: SeccionProgreso) => void
}) {
  const botones = useRef<Array<HTMLButtonElement | null>>([])
  function navegar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const destino =
      evento.key === "ArrowRight"
        ? (indice + 1) % secciones.length
        : evento.key === "ArrowLeft"
          ? (indice + secciones.length - 1) % secciones.length
          : evento.key === "Home"
            ? 0
            : evento.key === "End"
              ? secciones.length - 1
              : null
    if (destino === null) return
    evento.preventDefault()
    alCambiar(secciones[destino].id)
    botones.current[destino]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label="Secciones de progreso"
      className="pestanas-progreso"
    >
      {secciones.map((seccion, indice) => (
        <button
          key={seccion.id}
          ref={(elemento) => {
            botones.current[indice] = elemento
          }}
          type="button"
          role="tab"
          id={`${idBase}-pestana-${seccion.id}`}
          aria-controls={`${idBase}-panel-${seccion.id}`}
          aria-selected={actual === seccion.id}
          tabIndex={actual === seccion.id ? 0 : -1}
          onClick={() => alCambiar(seccion.id)}
          onKeyDown={(evento) => navegar(evento, indice)}
        >
          <span aria-hidden="true" className="text-2xl">
            {seccion.icono}
          </span>
          <span>{seccion.titulo}</span>
        </button>
      ))}
    </div>
  )
}
