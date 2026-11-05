import { useMemo } from "react"
import {
  paisesDisponibles,
  zonasDelPais,
  nombreRegion,
  requiereRegion,
} from "../../../compartido/ubicacion"

export function SelectorUbicacion({
  pais,
  zona,
  alCambiar,
}: {
  pais: string
  zona: string
  alCambiar: (pais: string, zona: string) => void
}) {
  const zonas = zonasDelPais(pais)
  const variasRegiones = useMemo(() => requiereRegion(pais), [pais])
  function cambiarPais(codigo: string) {
    const opciones = zonasDelPais(codigo)
    const detectada = Intl.DateTimeFormat().resolvedOptions().timeZone
    const requiereEleccion = requiereRegion(codigo)
    const sugerida = opciones.includes(detectada)
      ? detectada
      : requiereEleccion
        ? ""
        : (opciones[0] ?? "")
    alCambiar(codigo, sugerida)
  }
  return (
    <div className="space-y-4">
      <label htmlFor="profile-country" className="block text-lg font-semibold">
        País de residencia
      </label>
      <select
        id="profile-country"
        value={pais}
        autoComplete="country"
        className="block w-full p-3 mt-2 rounded-xl"
        onChange={(evento) => cambiarPais(evento.target.value)}
      >
        <option value="">Seleccioná tu país</option>
        {paisesDisponibles.map((opcion) => (
          <option key={opcion.codigo} value={opcion.codigo}>
            {opcion.nombre}
          </option>
        ))}
      </select>
      {variasRegiones && (
        <div>
          <label
            htmlFor="profile-region"
            className="block text-lg font-semibold"
          >
            Región o ciudad de referencia
          </label>
          <select
            id="profile-region"
            aria-describedby="region-help"
            required
            value={zona}
            className="block w-full p-3 mt-2 rounded-xl"
            onChange={(evento) => alCambiar(pais, evento.target.value)}
          >
            <option value="">Elegí la región donde vivís</option>
            {zonas.map((valor) => (
              <option key={valor} value={valor}>
                {nombreRegion(valor)}
              </option>
            ))}
          </select>
          <span id="region-help" className="block text-sm font-normal mt-2">
            Este país tiene varios horarios. Elegí la ciudad más cercana que
            comparta tu hora.
          </span>
        </div>
      )}
      <p className="text-sm font-normal text-muted-foreground">
        Usamos la hora local de tu lugar de residencia para programar los
        recordatorios.
      </p>
    </div>
  )
}
