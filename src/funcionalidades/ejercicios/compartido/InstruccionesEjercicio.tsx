import { useAccesibilidad } from "../../accesibilidad/ProveedorAccesibilidad"

export function InstruccionesEjercicio({ text: texto }: { text: string }) {
  const accesibilidad = useAccesibilidad()
  if (!accesibilidad?.preferences.instruccionesAmpliadas)
    return <p className="text-xl leading-relaxed">{texto}</p>
  const pasos = texto.split(/(?<=[.!?])\s+/u).filter(Boolean)
  return (
    <div className="expanded-instructions space-y-5">
      <h3 className="text-2xl font-bold">Instrucciones paso a paso</h3>
      <ol className="list-decimal pl-8 space-y-5 text-2xl leading-relaxed">
        {pasos.map((paso, indice) => (
          <li key={indice} className="pl-2">
            {paso}
          </li>
        ))}
      </ol>
    </div>
  )
}
