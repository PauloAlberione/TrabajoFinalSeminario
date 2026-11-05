import { interpretarNumericoRespuesta } from "../../../../compartido/calculo"

export function EntradaRespuestaNumerica({
  value: valor,
  onChange: alCambiar,
  allowNegative: permitirNegativo,
  disabled: deshabilitado,
  onConfirm: alConfirmar,
}: {
  value: string
  onChange: (valor: string) => void
  allowNegative: boolean
  disabled: boolean
  onConfirm: () => void
}) {
  const valido = interpretarNumericoRespuesta(valor, permitirNegativo) !== null
  return (
    <form
      className="space-y-5"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (valido && !deshabilitado) alConfirmar()
      }}
    >
      <label htmlFor="numeric-answer" className="block text-xl font-semibold">
        Tu respuesta
      </label>
      <input
        id="numeric-answer"
        type="text"
        inputMode={permitirNegativo ? "text" : "numeric"}
        autoComplete="off"
        maxLength={7}
        className="w-full rounded-2xl border-2 p-5 text-4xl text-center font-bold focus-visible:outline-4 focus-visible:outline-purple-700"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        value={valor}
        disabled={deshabilitado}
        onChange={(evento) => alCambiar(evento.target.value)}
        aria-describedby="numeric-help"
        aria-invalid={valor.trim() !== "" && valor.trim() !== "-" && !valido}
      />
      <p id="numeric-help" className="text-lg">
        {permitirNegativo
          ? "Ingresá un número entero. Para un resultado negativo, usá el signo −."
          : "Ingresá un número entero, sin decimales."}
      </p>
      <button
        type="submit"
        disabled={!valido || deshabilitado}
        className="px-8 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-purple-700"
        style={{ background: "#6553A2", color: "white" }}
      >
        Confirmar
      </button>
    </form>
  )
}
