import { useRef, type KeyboardEvent } from "react"

const secciones = [
  { id: "datos", titulo: "Mi perfil" },
  { id: "preferencias", titulo: "Preferencias" },
  { id: "recordatorios", titulo: "Recordatorios" },
  { id: "privacidad", titulo: "Privacidad" },
] as const

export type SeccionPerfil = typeof secciones[number]["id"]

export function PestanasPerfil({
  idBase,
  actual,
  alCambiar,
  deshabilitado,
}: {
  idBase: string
  actual: SeccionPerfil
  alCambiar: (seccion: SeccionPerfil) => void
  deshabilitado: boolean
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
    if (destino === null || deshabilitado) return
    evento.preventDefault()
    alCambiar(secciones[destino].id)
    botones.current[destino]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label="Secciones del perfil"
      className="pestanas-perfil"
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
          disabled={deshabilitado}
          onClick={() => alCambiar(seccion.id)}
          onKeyDown={(evento) => navegar(evento, indice)}
        >
          {seccion.titulo}
        </button>
      ))}
    </div>
  )
}
