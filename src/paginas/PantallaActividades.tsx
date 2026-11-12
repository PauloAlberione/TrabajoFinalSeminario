import { tiposVelocidad } from "../../compartido/velocidad"
import { tiposAtencion } from "../../compartido/atencionReconocimiento"
import { tiposCalculo } from "../../compartido/calculo"
import { tiposLenguaje } from "../../compartido/lenguaje"
import { tiposMemoria } from "../../compartido/memoria"
import { type Pantalla } from "../tipos/navegacion"
import { categoriasEjercicios } from "../funcionalidades/ejercicios/catalogoCategorias"
import { IconoFlecha } from "../componentes/Iconos"

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
    <div className="pantalla-amplia max-w-7xl mx-auto p-5 md:p-10">
      <header className="mb-8">
        <p className="antetitulo">20 ejercicios · 5 categorías</p>
        <h1 className="text-4xl font-bold">Elegí tu próxima actividad</h1>
        <p className="text-lg text-muted-foreground mt-3">
          Explorá las categorías y encontrá una propuesta que disfrutes.
        </p>
      </header>
      <nav aria-label="Categorías de ejercicios" className="mb-8">
        <div className="lista-categorias">
          {categoriasEjercicios.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => alCambiarCategoria(categoria.id)}
              aria-pressed={seleccionado.id === categoria.id}
              className="selector-categoria w-full flex flex-col items-start gap-3 p-3 rounded-2xl text-left"
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
                className="categoria-icono rounded-xl flex items-center justify-center flex-shrink-0"
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
      </nav>

      <div className="min-w-0">
        <div>
          <div
            className="cabecera-categoria flex flex-wrap items-center gap-5 mb-8 p-6 rounded-3xl"
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
          <div className="tarjetas-actividades">
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
                className="tarjeta-actividad flex flex-col p-6 rounded-3xl text-left"
                style={{
                  background: "var(--card)",
                  border: "1.5px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    aria-hidden="true"
                    className="actividad-simbolo rounded-2xl flex items-center justify-center text-3xl"
                    style={{
                      background: seleccionado.bg,
                      color: seleccionado.color,
                    }}
                  >
                    {actividad.simbolo}
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: seleccionado.bg,
                      color: seleccionado.color,
                    }}
                  >
                    {indice + 1} de {seleccionado.activities.length}
                  </div>
                </div>
                <p className="text-xl font-bold mb-2">{actividad.name}</p>
                <p
                  className="text-base flex-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {actividad.descripcion}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "var(--muted)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Nivel automático
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
          <details className="mt-8 p-6 rounded-3xl border border-border bg-muted">
            <summary className="font-bold cursor-pointer">
              ¿Cómo cambia la dificultad?
            </summary>
            <p className="mt-4 text-lg">
              Cada categoría comienza en Fácil y se adapta automáticamente a tus
              resultados. Podés llegar a Normal, Difícil y Muy difícil.
            </p>
            <button
              className="mt-4 px-5 py-3 rounded-2xl font-bold bg-card text-primary"
              onClick={() => alNavegar("help")}
            >
              Ver los criterios en Ayuda →
            </button>
          </details>
        </div>
      </div>
    </div>
  )
}
