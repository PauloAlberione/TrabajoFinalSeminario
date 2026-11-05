import {
  TONOS_AVATAR,
  etiquetasTonos,
  representarAvatar,
  type TonoAvatar,
} from "../../../compartido/avatar"

export function SelectorTonoAvatar({
  genero,
  tono,
  alCambiar,
}: {
  genero?: "male" | "female"
  tono: TonoAvatar
  alCambiar: (tono: TonoAvatar) => void
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-semibold">Tono de tu avatar</legend>
      <p className="text-sm text-muted-foreground">
        Elegí cómo querés que se vea tu icono.
      </p>
      <div className="flex flex-wrap gap-3">
        {TONOS_AVATAR.map((valor) => (
          <button
            type="button"
            key={valor}
            aria-label={etiquetasTonos[valor]}
            aria-pressed={tono === valor}
            onClick={() => alCambiar(valor)}
            className="opcion-avatar rounded-2xl p-3 text-4xl"
            style={{
              background: tono === valor ? "var(--muted)" : "var(--card)",
              border: `2px solid ${
                tono === valor ? "var(--primary)" : "var(--border)"
              }`,
            }}
          >
            <span aria-hidden="true">{representarAvatar(genero, valor)}</span>
          </button>
        ))}
      </div>
      <p className="text-sm">Tono seleccionado: {etiquetasTonos[tono]}</p>
    </fieldset>
  )
}
