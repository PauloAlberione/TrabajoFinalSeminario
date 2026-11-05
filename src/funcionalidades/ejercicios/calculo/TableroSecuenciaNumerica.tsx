import type { SecuenciaPregunta } from "../../../../compartido/calculo"

export function TableroSecuenciaNumerica({
  question: pregunta,
  selected: seleccionado,
  onSelect: alSeleccionar,
  disabled: deshabilitado,
}: {
  question: SecuenciaPregunta
  selected: number | null
  onSelect: (valor: number) => void
  disabled: boolean
}) {
  return (
    <>
      <h2 className="text-2xl font-bold">¿Qué número falta?</h2>
      <ol
        aria-label="Secuencia numérica"
        className="flex flex-wrap gap-3 justify-center py-5"
      >
        {pregunta.values.map((valor, indice) => (
          <li
            key={indice}
            className="p-4 rounded-2xl text-3xl font-bold"
            style={{
              background:
                indice === pregunta.missingIndex ? "#E4E0F5" : "var(--muted)",
            }}
            aria-label={
              indice === pregunta.missingIndex
                ? "Número que falta"
                : String(valor)
            }
          >
            {indice === pregunta.missingIndex ? "?" : valor}
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {pregunta.options.map((opcion) => (
          <button
            key={opcion}
            disabled={deshabilitado}
            aria-pressed={seleccionado === opcion}
            onClick={() => alSeleccionar(opcion)}
            className="p-6 rounded-2xl text-3xl font-bold focus-visible:outline-4 focus-visible:outline-purple-700"
            style={{
              background: seleccionado === opcion ? "#E4E0F5" : "var(--muted)",
              border:
                seleccionado === opcion
                  ? "3px solid #6553A2"
                  : "3px solid transparent",
            }}
          >
            {opcion}
            {seleccionado === opcion ? " ✓" : ""}
          </button>
        ))}
      </div>
    </>
  )
}
