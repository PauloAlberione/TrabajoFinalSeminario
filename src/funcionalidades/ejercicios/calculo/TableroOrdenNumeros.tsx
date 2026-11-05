import type { OrdenRonda } from "../../../../compartido/calculo"

export function TableroOrdenNumeros({
  round: ronda,
  selected: seleccionado,
  onChange: alCambiar,
  disabled: deshabilitado,
}: {
  round: OrdenRonda
  selected: number[]
  onChange: (valores: number[]) => void
  disabled: boolean
}) {
  return (
    <>
      <h2 className="text-2xl font-bold">
        {ronda.direction === "ascending"
          ? "Ordená de menor a mayor"
          : "Ordená de mayor a menor"}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ronda.values.map((valor) => (
          <button
            key={valor}
            disabled={deshabilitado || seleccionado.includes(valor)}
            aria-pressed={seleccionado.includes(valor)}
            onClick={() => alCambiar([...seleccionado, valor])}
            className="p-6 rounded-2xl text-3xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-purple-700"
            style={{
              background: "var(--muted)",
              border: "2px solid var(--border)",
            }}
          >
            {valor}
            {seleccionado.includes(valor) ? " ✓" : ""}
          </button>
        ))}
      </div>
      <h3 className="text-xl font-semibold">Tu orden</h3>
      <ol
        aria-label="Tu orden"
        className="flex flex-wrap gap-3 min-h-20 p-4 rounded-2xl"
        style={{ background: "#E4E0F5", color: "#3A2E68" }}
      >
        {seleccionado.map((valor, indice) => (
          <li key={valor} className="text-3xl font-bold p-2">
            <span className="sr-only">Posición {indice + 1}: </span>
            {valor}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-4">
        {[
          {
            label: "Deshacer último",
            action: () => alCambiar(seleccionado.slice(0, -1)),
          },
          { label: "Empezar de nuevo", action: () => alCambiar([]) },
        ].map((control) => (
          <button
            key={control.label}
            disabled={deshabilitado || !seleccionado.length}
            onClick={control.action}
            className="px-6 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-purple-700"
            style={{ background: "var(--muted)" }}
          >
            {control.label}
          </button>
        ))}
      </div>
    </>
  )
}
