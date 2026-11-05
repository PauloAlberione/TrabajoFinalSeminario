import { tiposVelocidad } from "../../compartido/velocidad"
import { tiposAtencion } from "../../compartido/atencionReconocimiento"
import { tiposCalculo } from "../../compartido/calculo"
import { tiposLenguaje } from "../../compartido/lenguaje"
import { tiposMemoria } from "../../compartido/memoria"
import { type Pantalla } from "../tipos/navegacion"
import { categoriasEjercicios } from "../funcionalidades/ejercicios/catalogoCategorias"
import { IconoReloj, IconoFlecha } from "../componentes/Iconos"

export function PantallaActividades({
  onNavigate: alNavegar,
  categoryId: categoriaId,
  onCategoryChange: alCambiarCategoria,
}: {
  onNavigate: (texto: Pantalla) => void
  categoryId: string
  onCategoryChange: (id: string) => void
}) {
  const seleccionado =
    categoriasEjercicios.find((categoria) => categoria.id === categoriaId) ??
    categoriasEjercicios[0]

  return (
    <div
      className="flex flex-col 2xl:flex-row h-full"
      style={{ minHeight: "calc(100vh - 0px)" }}
    >
      <div
        className="w-full 2xl:w-80 flex-shrink-0 p-5 overflow-y-auto"
        style={{
          borderRight: "1.5px solid var(--border)",
          background: "var(--card)",
        }}
      >
        <h2
          className="text-2xl font-bold mb-5 px-2"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          Categorías
        </h2>
        <div className="space-y-2">
          {categoriasEjercicios.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => alCambiarCategoria(categoria.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
              style={{
                background:
                  seleccionado.id === categoria.id
                    ? categoria.bg
                    : "transparent",
                border:
                  seleccionado.id === categoria.id
                    ? `2px solid ${categoria.color}`
                    : "2px solid transparent",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    seleccionado.id === categoria.id
                      ? categoria.color
                      : categoria.bg,
                  color:
                    seleccionado.id === categoria.id
                      ? "white"
                      : categoria.color,
                }}
              >
                {categoria.icon}
              </div>
              <div>
                <p
                  className="text-base font-bold"
                  style={{
                    color:
                      seleccionado.id === categoria.id
                        ? categoria.color
                        : "var(--foreground)",
                  }}
                >
                  {categoria.label}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {categoria.activities.length} ejercicios
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 p-5 md:p-10 overflow-y-auto">
        <div className="max-w-3xl">
          <div
            className="flex items-center gap-5 mb-8 p-6 rounded-3xl"
            style={{ background: seleccionado.bg }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: seleccionado.color, color: "white" }}
            >
              {seleccionado.icon}
            </div>
            <div>
              <h2
                className="text-3xl font-bold"
                style={{
                  fontFamily: "Fraunces, serif",
                  color: seleccionado.color,
                }}
              >
                {seleccionado.label}
              </h2>
              <p
                className="text-base mt-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                {seleccionado.description}
              </p>
            </div>
          </div>
          <h3
            className="text-xl font-bold mb-4"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Ejercicios disponibles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {seleccionado.activities.map((actividad, indice) => (
              <button
                key={indice}
                onClick={() =>
                  alNavegar(
                    seleccionado.id === "memoria"
                      ? tiposMemoria[indice]
                      : seleccionado.id === "lenguaje"
                        ? tiposLenguaje[indice]
                        : seleccionado.id === "calculo"
                          ? tiposCalculo[indice]
                          : seleccionado.id === "atencion"
                            ? tiposAtencion[indice]
                            : tiposVelocidad[indice],
                  )
                }
                className="flex flex-col p-6 rounded-3xl text-left transition-all hover:scale-[1.02] active:scale-98"
                style={{
                  background: "var(--card)",
                  border: "1.5px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{
                      background: seleccionado.bg,
                      color: seleccionado.color,
                    }}
                  >
                    {indice === 0
                      ? "★"
                      : indice === 1
                        ? "●"
                        : indice === 2
                          ? "◆"
                          : "▲"}
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: seleccionado.bg,
                      color: seleccionado.color,
                    }}
                  >
                    <IconoReloj />
                    {actividad.time}
                  </div>
                </div>
                <p className="text-lg font-bold mb-1">{actividad.name}</p>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {indice === 0
                    ? "Recomendado para hoy"
                    : `Ejercicio de ${seleccionado.label.toLowerCase()}`}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "var(--muted)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {[
                      "memoria",
                      "lenguaje",
                      "calculo",
                      "atencion",
                      "velocidad",
                    ].includes(seleccionado.id)
                      ? "Nivel adaptativo"
                      : indice % 3 === 0
                        ? "Normal"
                        : indice % 3 === 1
                          ? "Fácil"
                          : "Desafío"}
                  </span>
                  <div
                    className="flex items-center gap-1 font-bold"
                    style={{ color: seleccionado.color }}
                  >
                    <span className="text-sm">Jugar</span>
                    <IconoFlecha />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div
            className="mt-8 p-6 rounded-3xl"
            style={{ background: "var(--muted)" }}
          >
            <p className="text-base font-bold mb-3">Niveles de dificultad</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                "memoria",
                "lenguaje",
                "calculo",
                "atencion",
                "velocidad",
              ].includes(seleccionado.id)
                ? [
                    {
                      level: "Fácil",
                      desc: "El nivel inicial para comenzar",
                      color: "var(--categoria-lenguaje)",
                    },
                    {
                      level: "Normal",
                      desc: "Se adapta a tus actividades anteriores",
                      color: "var(--categoria-memoria)",
                    },
                    {
                      level: "Difícil",
                      desc: "Un nuevo paso para practicar",
                      color: "var(--categoria-calculo)",
                    },
                    {
                      level: "Muy difícil",
                      desc: "El nivel más avanzado",
                      color: "var(--categoria-velocidad)",
                    },
                  ]
                : [
                    {
                      level: "Fácil",
                      desc: "Ideal para empezar o días tranquilos",
                      color: "var(--categoria-lenguaje)",
                    },
                    {
                      level: "Normal",
                      desc: "El nivel recomendado para la mayoría",
                      color: "var(--categoria-memoria)",
                    },
                    {
                      level: "Desafío",
                      desc: "Para quienes buscan un reto mayor",
                      color: "var(--categoria-calculo)",
                    },
                  ]
              ).map((dato) => (
                <div key={dato.level} className="flex items-start gap-2">
                  <span
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ background: dato.color }}
                  />
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: dato.color }}
                    >
                      {dato.level}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {dato.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
