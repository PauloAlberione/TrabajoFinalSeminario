import {
  describirDificultad,
  type EjercicioConDificultad,
} from "../../../../compartido/dificultadEjercicios"
import type { Nivel } from "../../../../compartido/memoria"
import { etiquetaDificultad } from "../../../tipos/ejercicios"

export function DetalleNivelEjercicio({
  tipo,
  nivel,
}: {
  tipo: EjercicioConDificultad
  nivel: Nivel
}) {
  return (
    <aside
      className="p-5 rounded-2xl border border-border bg-muted"
      aria-label={`Qué incluye el nivel ${etiquetaDificultad[nivel]}`}
    >
      <h3 className="font-bold text-xl mb-3">
        En este nivel: {etiquetaDificultad[nivel]}
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-lg">
        {describirDificultad(tipo, nivel).map((detalle) => (
          <li key={detalle}>{detalle}</li>
        ))}
      </ul>
    </aside>
  )
}
