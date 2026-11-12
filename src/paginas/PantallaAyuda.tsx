import { useId, useState, type ReactNode } from "react"
import { DIFICULTAD_NIVELES, etiquetaDificultad } from "../tipos/ejercicios"
import { type Pantalla } from "../tipos/navegacion"
import { IconoVolver, IconoIndicador } from "../componentes/Iconos"

interface PreguntaFrecuente {
  id: string
  pregunta: string
  respuesta: ReactNode
}

export const preguntasFrecuentes: PreguntaFrecuente[] = [
  {
    id: "plataforma",
    pregunta: "¿Qué es MenteClear?",
    respuesta:
      "MenteClear es una plataforma web diseñada para ayudarte a realizar actividades de estimulación cognitiva y hacer un seguimiento de tu rendimiento a lo largo del tiempo. Puedes practicar diferentes tipos de ejercicios mentales —memoria, lenguaje, cálculo, atención y velocidad— de forma sencilla, segura y agradable desde tu ordenador.",
  },
  {
    id: "comenzar",
    pregunta: "¿Cómo comienzo un ejercicio?",
    respuesta:
      'Haz clic en "Ejercicios" en el menú de la izquierda. Verás cinco categorías cognitivas. Haz clic en la que quieras trabajar y, a continuación, elige uno de los ejercicios disponibles. Antes de empezar, aparecerán instrucciones claras que te explicarán qué debes hacer.',
  },
  {
    id: "categorias",
    pregunta: "¿Qué capacidades puedo trabajar?",
    respuesta:
      "Puedes trabajar cinco áreas cognitivas: Memoria (recordar imágenes, palabras y secuencias), Lenguaje (vocabulario, sinónimos, antónimos), Cálculo (operaciones matemáticas sencillas), Atención y reconocimiento (concentración y observación visual), y Velocidad (rapidez de respuesta y procesamiento).",
  },
  {
    id: "dificultad",
    pregunta: "¿Cómo funciona la dificultad?",
    respuesta: (
      <>
        <p>
          Hay cuatro niveles, en este orden:{" "}
          <strong>Fácil, Normal, Difícil y Muy difícil</strong>. Cada categoría
          comienza en Fácil y guarda su propio nivel.
        </p>
        <p>
          Memoria, Lenguaje, Cálculo, Atención y reconocimiento, y Velocidad
          avanzan por separado. Por ejemplo, podés estar en Normal en Memoria y
          en Fácil en Lenguaje.
        </p>
        <p>
          Los cuatro juegos de una categoría comparten su nivel. El ajuste es
          automático y se aplica al próximo ejercicio que comiences; no cambia
          una actividad que ya está en curso ni se elige manualmente.
        </p>
      </>
    ),
  },
  {
    id: "ascenso",
    pregunta: "¿Cuándo subo de nivel?",
    respuesta: (
      <>
        <p>
          Necesitás{" "}
          <strong>dos resultados consecutivos de la misma categoría</strong> que
          cumplan estas dos condiciones:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Precisión de <strong>80% o más</strong>.
          </li>
          <li>
            Puntuación de rendimiento de <strong>80 puntos o más</strong>, sobre
            100.
          </li>
        </ul>
        <p>
          Con el primero se inicia una racha. Si el siguiente también cumple,
          subís <strong>un solo nivel</strong> y la racha vuelve a empezar.
        </p>
        <p>
          Podés combinar juegos: un resultado en Pareja de imágenes y otro en
          Lista de palabras pueden hacerte avanzar en Memoria. Hacer una
          actividad de otra categoría entre ambos no cambia esa racha.
        </p>
      </>
    ),
  },
  {
    id: "descenso",
    pregunta: "¿Cuándo bajo o mantengo el nivel?",
    respuesta: (
      <>
        <p>
          Bajás un nivel después de{" "}
          <strong>dos resultados consecutivos de la misma categoría</strong> en
          los que se cumpla al menos una de estas condiciones:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Precisión <strong>menor al 50%</strong>.
          </li>
          <li>
            Puntuación de rendimiento <strong>menor a 55 puntos</strong>.
          </li>
        </ul>
        <p>
          Un solo resultado bajo no alcanza para bajar. Si un resultado no
          cumple ni las condiciones de subida ni las de bajada, mantenés el
          nivel y se reinician ambas rachas.
        </p>
        <p>
          Un resultado de subida interrumpe la racha de bajada y viceversa. No
          hay niveles por debajo de Fácil ni por encima de Muy difícil.
        </p>
      </>
    ),
  },
  {
    id: "rendimiento",
    pregunta: "¿Cómo se calcula la puntuación de rendimiento?",
    respuesta: (
      <>
        <p>
          Combina dos partes:{" "}
          <strong>80% de precisión y 20% de eficiencia temporal</strong>. Los
          aciertos tienen el mayor peso.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Precisión:</strong> aciertos divididos por el total de
            aciertos y errores, expresados como porcentaje. La forma de contar
            las respuestas depende del ejercicio.
          </li>
          <li>
            <strong>Eficiencia temporal:</strong> compara tu tiempo de respuesta
            con una referencia del ejercicio y su dificultad, con un máximo de
            100 puntos. No se compara con el tiempo de otras personas.
          </li>
        </ul>
        <p>
          La fórmula es:{" "}
          <strong>
            rendimiento = precisión × 0,80 + eficiencia temporal × 0,20
          </strong>
          .
        </p>
        <p>
          Ejemplo: 8 aciertos y 2 errores dan 80% de precisión. Si la eficiencia
          temporal es 100, el rendimiento es 84 puntos (64 + 20). Ese resultado
          cumple el criterio de subida; hace falta otro consecutivo que también
          lo cumpla.
        </p>
        <p>
          Las pausas no cuentan. En Velocidad se consideran los tiempos de cada
          ronda; las rondas sin respuesta y las salidas anticipadas no aportan
          eficiencia temporal.
        </p>
      </>
    ),
  },
  {
    id: "cambios",
    pregunta: "¿Qué cambia cuando aumenta la dificultad?",
    respuesta:
      "Cada juego aumenta la complejidad de la tarea, además de su cantidad de rondas. En Memoria hay más elementos y menos tiempo de presentación; en Lenguaje, preguntas de contexto y más opciones; en Cálculo, números y operaciones más complejos; en Atención, más figuras, recorridos y patrones. En Velocidad se comparan grupos de figuras, hay más colores y categorías, y aparecen señales distractoras. En Muy difícil, el juego de colores pide dos selecciones en orden. Antes de comenzar se explica qué incluye tu nivel. Los tiempos de cada ronda se ajustan a la tarea. Los niveles describen actividades de MenteClear, no una evaluación clínica de tu capacidad cognitiva.",
  },
  {
    id: "resultados-validos",
    pregunta: "¿Qué actividades cuentan para cambiar de nivel?",
    respuesta: (
      <>
        <p>
          Solo cuentan los resultados de ejercicios{" "}
          <strong>completados y guardados</strong> que correspondan al nivel y
          al progreso vigentes de esa categoría.
        </p>
        <p>
          Pausar o cancelar no baja el nivel ni borra una racha. Tampoco se
          cuenta dos veces un resultado si se reintenta su guardado.
        </p>
        <p>
          Si terminás una actividad antigua o había varias abiertas en la misma
          categoría, el resultado puede guardarse en el historial sin cambiar el
          nivel ni las rachas actuales.
        </p>
        <p>
          Podés consultar tus niveles en{" "}
          <strong>Perfil → Mi perfil → Ver mis niveles de dificultad</strong>, o
          en <strong>Progreso → Categorías</strong>. Al terminar una actividad
          se informa el nivel para la próxima.
        </p>
      </>
    ),
  },
  {
    id: "resultados",
    pregunta: "¿Dónde puedo consultar mis resultados?",
    respuesta:
      'En la sección "Progreso", accesible desde el menú lateral, encontrarás el historial de tus sesiones con precisión, respuestas correctas e incorrectas, tiempos de respuesta y nivel de dificultad.',
  },
  {
    id: "graficos",
    pregunta: "¿Qué significan los gráficos de progreso?",
    respuesta:
      'En "Progreso → Actividad" podés elegir un gráfico de ejercicios completados, precisión o tiempo activo por fecha. En "Categorías" podés consultar tus resultados y comparar categorías. Cada gráfico ofrece una tabla con los valores exactos. La precisión se calcula con todos los aciertos y errores del período. Para comparar resultados, tené en cuenta el tipo de ejercicio y su dificultad: una variación del porcentaje no demuestra por sí sola una mejora cognitiva.',
  },
  {
    id: "preferencias",
    pregunta: "¿Puedo cambiar mis datos o preferencias?",
    respuesta:
      'Sí. En la sección "Perfil" puedes cambiar el tamaño de la letra y activar o desactivar los recordatorios y sonidos. El nivel de dificultad se ajusta automáticamente.',
  },
  {
    id: "contrasena",
    pregunta: "¿Qué hago si olvidé mi contraseña?",
    respuesta:
      'En el ingreso, elegí "¿Olvidaste tu contraseña?" y escribí tu correo. Si hay una cuenta habilitada, recibirás un enlace para elegir una nueva contraseña. Debe tener al menos ocho caracteres, una mayúscula A–Z y una minúscula a–z. Al terminar, elegí "Continuar" si el formulario lo indica para volver a MenteClear e ingresar nuevamente. Si el enlace venció o ya se usó, solicitá otro. Revisá también la carpeta de spam.',
  },
  {
    id: "duracion-sesion",
    pregunta: "¿Cuánto tiempo permanece abierta mi sesión?",
    respuesta:
      'Sin marcar "Mantener sesión iniciada", el acceso dura hasta cuatro horas desde el ingreso y se conserva solo en esta pestaña. Si marcás la casilla, se recuerda hasta siete días en el dispositivo. El plazo no vuelve a empezar al recargar. Cuando vence, debés ingresar nuevamente; el avance guardado de tus actividades sigue disponible. En un dispositivo compartido, dejá la casilla desmarcada y cerrá sesión al terminar.',
  },
  {
    id: "alcance",
    pregunta: "¿La plataforma realiza diagnósticos médicos?",
    respuesta:
      "No. MenteClear es una herramienta de apoyo para la estimulación cognitiva y el seguimiento del rendimiento en ejercicios. No realiza diagnósticos médicos ni sustituye la evaluación de profesionales de la salud. Si tienes dudas sobre tu salud cognitiva, consulta siempre a tu médico o especialista.",
  },
]

export function PantallaAyuda({
  onNavigate: alNavegar,
}: {
  onNavigate: (texto: Pantalla) => void
}) {
  const [preguntaAbierta, establecerPreguntaAbierta] = useState<string | null>(
    "dificultad",
  )
  const idAyuda = useId()
  function mostrarCriterios() {
    establecerPreguntaAbierta("ascenso")
    requestAnimationFrame(() =>
      document.getElementById(`${idAyuda}-pregunta-ascenso`)?.focus(),
    )
  }

  return (
    <div className="pantalla-amplia pantalla-ayuda p-5 md:p-10 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5 mb-8">
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Ayuda y preguntas frecuentes
          </h1>
          <p
            className="text-base mt-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Encuentra respuestas a las dudas más comunes sobre MenteClear
          </p>
        </div>
        <button
          onClick={() => alNavegar("home")}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-base font-bold transition-all hover:opacity-80"
          style={{
            background: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          <IconoVolver /> Volver al inicio
        </button>
      </div>

      <div className="ayuda-distribucion">
        <section
          className="ayuda-niveles rounded-3xl border border-border bg-card p-5 md:p-6 mb-6"
          aria-labelledby="niveles-dificultad-titulo"
        >
          <h2 id="niveles-dificultad-titulo" className="text-2xl font-bold">
            {DIFICULTAD_NIVELES.length} niveles de dificultad
          </h2>
          <ol className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
            {DIFICULTAD_NIVELES.map((nivel, indice) => (
              <li
                key={nivel}
                className="rounded-2xl bg-muted p-3 text-lg font-bold"
              >
                <span aria-hidden="true" className="text-primary">
                  {indice + 1}.{" "}
                </span>
                {etiquetaDificultad[nivel]}
              </li>
            ))}
          </ol>
          <p className="text-base leading-relaxed">
            Empezás en Fácil en cada categoría. Los cambios son automáticos y
            dependen de tus resultados, no de cuántos días uses la aplicación.
          </p>
          <button
            type="button"
            onClick={mostrarCriterios}
            className="mt-4 px-5 py-3 rounded-2xl bg-muted font-bold text-primary"
          >
            Ver los criterios para avanzar
          </button>
        </section>

        <div className="space-y-3">
          {preguntasFrecuentes.map((elemento) => (
            <div
              key={elemento.id}
              className="rounded-3xl overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1.5px solid var(--border)",
              }}
            >
              <button
                id={`${idAyuda}-pregunta-${elemento.id}`}
                aria-expanded={preguntaAbierta === elemento.id}
                aria-controls={`${idAyuda}-respuesta-${elemento.id}`}
                onClick={() =>
                  establecerPreguntaAbierta(
                    preguntaAbierta === elemento.id ? null : elemento.id,
                  )
                }
                className="w-full flex items-center justify-between px-7 py-5 text-left transition-colors hover:opacity-80"
                style={{
                  background:
                    preguntaAbierta === elemento.id
                      ? "var(--primary)"
                      : "transparent",
                }}
              >
                <span
                  className="text-lg font-bold pr-4"
                  style={{
                    color:
                      preguntaAbierta === elemento.id
                        ? "white"
                        : "var(--foreground)",
                  }}
                >
                  {elemento.pregunta}
                </span>
                <span
                  style={{
                    color:
                      preguntaAbierta === elemento.id
                        ? "white"
                        : "var(--muted-foreground)",
                    flexShrink: 0,
                  }}
                >
                  <IconoIndicador open={preguntaAbierta === elemento.id} />
                </span>
              </button>
              <div
                id={`${idAyuda}-respuesta-${elemento.id}`}
                role="region"
                aria-labelledby={`${idAyuda}-pregunta-${elemento.id}`}
                hidden={preguntaAbierta !== elemento.id}
                className="px-7 py-5"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div
                  className="ayuda-respuesta text-base leading-relaxed space-y-3"
                  style={{ color: "var(--foreground)" }}
                >
                  {typeof elemento.respuesta === "string" ? (
                    <p>{elemento.respuesta}</p>
                  ) : (
                    elemento.respuesta
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-3xl p-6 mt-8 mb-8 flex items-center gap-5"
        style={{ background: "#FDE8D8" }}
      >
        <span className="text-4xl flex-shrink-0">💬</span>
        <div>
          <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>
            ¿Necesitas ayuda adicional?
          </p>
          <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
            Si no encuentras la respuesta que buscas, consulta con tu centro de
            salud o con la persona que te ayudó a configurar la aplicación.
          </p>
        </div>
      </div>

      <div
        className="mt-10 rounded-3xl p-6"
        style={{ background: "var(--muted)" }}
      >
        <p
          className="text-base text-center leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          <strong style={{ color: "var(--foreground)" }}>Recuerda:</strong>{" "}
          MenteClear es un apoyo para tu bienestar cognitivo, no un diagnóstico
          médico. Siempre consulta a un profesional de la salud ante cualquier
          duda sobre tu salud.
        </p>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => alNavegar("home")}
          className="px-10 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  )
}
