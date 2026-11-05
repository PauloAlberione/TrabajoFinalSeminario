import { MensajeRespuesta } from "../compartido/MensajeRespuesta"
import { aciertoLenguaje } from "../compartido/respuestaVisual"
import { audioJuego } from "../../../servicios/audioJuego"
import { InstruccionesEjercicio } from "../compartido/InstruccionesEjercicio"
import { EstadoSesionEjercicio } from "../compartido/EstadoSesionEjercicio"
import { useEffect, useRef, useState } from "react"
import { api } from "../../../servicios/api"
import { etiquetaDificultad } from "../../../tipos/ejercicios"
import {
  lenguajeInstrucciones,
  lenguajeNombres,
  type TipoLenguaje,
  type LenguajeInstancia,
  type LenguajeRespuesta,
  type PreguntaRespuesta,
  type CrucigramaRespuesta,
} from "../../../../compartido/lenguaje"
import type { Nivel } from "../../../../compartido/memoria"
import { useNavegacionEjercicio } from "../compartido/useNavegacionEjercicio"
import { useTemporizadorRespuesta } from "../compartido/useTemporizadorRespuesta"
import { DialogoSalidaEjercicio } from "../compartido/DialogoSalidaEjercicio"
import {
  ResumenResultadoEjercicio,
  type ResumenEjercicio,
} from "../compartido/ResumenResultadoEjercicio"
import {
  TableroCrucigrama,
  type CrucigramaInstantanea,
} from "./TableroCrucigrama"

interface Sesion {
  id: string
  exercise: {
    id: string
    payload: LenguajeInstancia
  }
}

type Fase = "instructions" | "question" | "feedback" | "saving" | "results"

export function EjercicioLenguaje({
  type: tipo,
  onBack: alVolver,
  onSaved: alGuardar,
}: {
  type: TipoLenguaje
  onBack: () => void
  onSaved: () => void
}) {
  const pausarReloj = useRef<() => void>(() => {})
  function establecerPausa(valor: boolean) {
    if (valor) pausarReloj.current()
    establecerPausadoEstado(valor)
  }
  function establecerOcupado(valor: boolean) {
    if (valor) pausarReloj.current()
    establecerOcupadoEstado(valor)
  }
  const [nivel, establecerNivel] = useState<Nivel | null>(null)
  const [sesion, establecerSesion] = useState<Sesion | null>(null)
  const [fase, establecerFase] = useState<Fase>("instructions")
  const [ocupado, establecerOcupadoEstado] = useState(false)
  const [pausado, establecerPausadoEstado] = useState(false)
  const [error, establecerError] = useState("")
  const [indice, establecerIndice] = useState(0)
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null)
  const [retroalimentacion, establecerRetroalimentacion] = useState("")
  const [resumen, establecerResumen] = useState<ResumenEjercicio | null>(null)
  const bloqueo = useRef(false)
  const cicloVidaBloqueo = useRef(false)
  const respuestas = useRef<PreguntaRespuesta[]>([])
  const preguntaIniciar = useRef(0)
  const pendiente = useRef<LenguajeRespuesta | null>(null)
  const crucigramaEstado = useRef<CrucigramaInstantanea | null>(null)
  const instancia = sesion?.exercise.payload
  const pregunta = instancia?.questions[indice]
  const navegacion = useNavegacionEjercicio({
    sessionId: sesion?.id,
    active: !!sesion && !["instructions", "results"].includes(fase),
    onBack: alVolver,
    paused: pausado,
    setPaused: establecerPausa,
    setBusy: establecerOcupado,
    exerciseType: tipo,
    navigationBlocked: fase === "saving",
  })
  const temporizador = useTemporizadorRespuesta(
    fase === "question" && !pausado && !ocupado,
    navegacion.suspended,
  )
  pausarReloj.current = temporizador.stop
  async function cargarNivel() {
    establecerNivel(null)
    establecerOcupado(true)
    establecerError("")
    try {
      const progreso = await api.obtenerFuncionProgreso<{
        currentLevel: Nivel
      }>("language")
      establecerNivel(progreso.currentLevel ?? "easy")
    } catch {
      establecerError(
        "No pudimos cargar tu nivel de Lenguaje. Intentá nuevamente.",
      )
    } finally {
      establecerOcupado(false)
    }
  }
  useEffect(() => {
    void cargarNivel()
  }, [tipo])
  async function iniciar() {
    if (navegacion.checkingRecovery) return
    if (navegacion.recoverable) {
      await navegacion.recover()
      return
    }
    if (cicloVidaBloqueo.current || !nivel) return
    cicloVidaBloqueo.current = true
    establecerOcupado(true)
    establecerError("")
    try {
      const siguiente = await api.startExercise<Sesion>(tipo)
      await api.sesionEstado(siguiente.id, "active")
      establecerSesion(siguiente)
      establecerNivel(siguiente.exercise.payload.level)
      respuestas.current = []
      preguntaIniciar.current = 0
      pendiente.current = null
      temporizador.reset()
      bloqueo.current = false
      establecerIndice(0)
      establecerSeleccionado(null)
      establecerPausa(false)
      establecerFase("question")
    } catch {
      establecerError("No pudimos iniciar el ejercicio. Intentá nuevamente.")
    } finally {
      cicloVidaBloqueo.current = false
      establecerOcupado(false)
    }
  }
  const alternarPausar = navegacion.togglePause
  function confirmar() {
    if (
      !pregunta ||
      !seleccionado ||
      bloqueo.current ||
      ocupado ||
      pausado ||
      navegacion.suspended.current
    )
      return
    bloqueo.current = true
    const tiempo = temporizador.stop()
    respuestas.current = [
      ...respuestas.current,
      {
        questionId: pregunta.id,
        answer: seleccionado,
        responseTimeSeconds: tiempo - preguntaIniciar.current,
      },
    ]
    audioJuego.reproducir(
      seleccionado === pregunta.answer ? "correct" : "incorrect",
    )
    establecerRetroalimentacion(
      seleccionado === pregunta.answer
        ? "¡Respuesta correcta!"
        : `La respuesta es: ${pregunta.answer}. Seguimos practicando.`,
    )
    establecerFase("feedback")
  }
  async function guardar(respuesta: LenguajeRespuesta) {
    if (!sesion || cicloVidaBloqueo.current) return
    cicloVidaBloqueo.current = true
    pendiente.current = respuesta
    navegacion.protectSave()
    establecerFase("saving")
    establecerError("")
    try {
      const resultado = await api.enviarResultado<ResumenEjercicio>({
        sessionId: sesion.id,
        exerciseId: sesion.exercise.id,
        exerciseType: tipo,
        cognitiveFunctionId: "language",
        response: respuesta,
      })
      navegacion.saved()
      establecerResumen(resultado)
      establecerFase("results")
      alGuardar()
    } catch {
      establecerError(
        "No pudimos guardar el resultado. Conservamos tus respuestas para reintentar.",
      )
    } finally {
      cicloVidaBloqueo.current = false
    }
  }
  function siguiente() {
    if (!instancia || ocupado || pausado) return
    if (indice + 1 === instancia.questions.length) {
      void guardar({
        answers: respuestas.current,
        words: [],
        actualResponseTimeSeconds: respuestas.current.reduce(
          (total, respuesta) => total + respuesta.responseTimeSeconds,
          0,
        ),
      })
      return
    }
    preguntaIniciar.current = temporizador.total.current
    establecerIndice(indice + 1)
    establecerSeleccionado(null)
    bloqueo.current = false
    establecerFase("question")
  }
  function crucigramaCompletar(palabras: CrucigramaRespuesta[]) {
    if (bloqueo.current) return
    bloqueo.current = true
    void guardar({
      answers: [],
      words: palabras,
      actualResponseTimeSeconds: temporizador.stop(),
    })
  }
  const control =
    "px-8 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-green-700"
  const tarjeta = {
    background: "var(--card)",
    border: "2px solid var(--border)",
  }
  const principal = { background: "#407453", color: "white" }
  function capturarEstado() {
    return {
      version: 1 as const,
      exerciseId: sesion?.exercise.id ?? tipo,
      phase: fase,
      step: indice,
      activeSeconds: temporizador.sample(),
      state: {
        selected: seleccionado,
        feedback: retroalimentacion,
        answers: respuestas.current,
        questionStart: preguntaIniciar.current,
        locked: bloqueo.current,
        pending: pendiente.current,
        crossword: crucigramaEstado.current,
      },
    }
  }
  navegacion.configure(capturarEstado, (restaurado, puntoControl) => {
    const datos =
      puntoControl.state as ReturnType<typeof capturarEstado>["state"]
    establecerSesion(restaurado as unknown as Sesion)
    establecerNivel(
      (restaurado.exercise.payload as Sesion["exercise"]["payload"]).level,
    )
    establecerFase(puntoControl.phase as Fase)
    establecerError(
      puntoControl.phase === "saving"
        ? "Tu resultado está pendiente de guardado. Seleccioná Reintentar guardado."
        : "",
    )
    establecerIndice(puntoControl.step)
    temporizador.restore(puntoControl.activeSeconds)
    establecerSeleccionado(datos.selected)
    establecerRetroalimentacion(datos.feedback)
    respuestas.current = datos.answers
    preguntaIniciar.current = datos.questionStart
    bloqueo.current = datos.locked
    pendiente.current =
      restaurado.pendingResult?.response as typeof pendiente.current ??
      datos.pending
    crucigramaEstado.current = datos.crossword
  })
  return (
    <div
      className="exercise-screen min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          className={control}
          disabled={ocupado || fase === "saving"}
          onClick={() => navegacion.requestExit()}
        >
          ← Volver a Lenguaje
        </button>
        <div>
          <p className="text-base" style={{ color: "#407453" }}>
            Lenguaje
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {lenguajeNombres[tipo]}
          </h1>
        </div>
        <span className="text-lg font-semibold">
          {nivel ? `Nivel: ${etiquetaDificultad[nivel]}` : "Cargando nivel…"}
        </span>
      </header>
      <DialogoSalidaEjercicio
        dialogRef={navegacion.dialogRef}
        error={navegacion.exitError}
        busy={ocupado}
        onContinue={() => navegacion.resolveExit(false)}
        onExit={() => navegacion.resolveExit(true)}
      />
      <EstadoSesionEjercicio
        instrucciones={lenguajeInstrucciones[tipo]}
        navigation={navegacion}
        paused={pausado && !!sesion && fase !== "saving"}
        busy={ocupado}
      />
      <main className="max-w-4xl mx-auto p-6 md:p-10">
        {error && (
          <div role="alert" className="p-5 mb-6 rounded-2xl" style={tarjeta}>
            <p className="text-lg">{error}</p>
            {fase === "instructions" && !nivel && (
              <button
                className={control}
                disabled={ocupado}
                onClick={cargarNivel}
              >
                Reintentar
              </button>
            )}
            {fase === "saving" && (
              <button
                className={control}
                style={principal}
                onClick={() => pendiente.current && guardar(pendiente.current)}
              >
                Reintentar guardado
              </button>
            )}
          </div>
        )}
        {fase === "instructions" && (
          <section className="p-8 rounded-3xl space-y-6" style={tarjeta}>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Cómo jugar
            </h2>
            <InstruccionesEjercicio text={lenguajeInstrucciones[tipo]} />
            <p className="text-lg">
              Podés pausar y continuar cuando lo necesites. El nivel se adapta a
              tus actividades de Lenguaje.
            </p>
            <button
              className={control}
              style={principal}
              disabled={ocupado || !nivel || navegacion.checkingRecovery}
              onClick={iniciar}
            >
              {ocupado ? "Cargando…" : "Comenzar ejercicio"}
            </button>
          </section>
        )}
        {instancia && ["question", "feedback"].includes(fase) && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <p className="text-xl font-semibold">
                {tipo === "simpleCrossword"
                  ? `${instancia.config.questionCount} palabras`
                  : `Pregunta ${indice + 1} de ${instancia.questions.length}`}
              </p>
              <button
                className={control}
                style={tarjeta}
                disabled={ocupado}
                onClick={alternarPausar}
              >
                {pausado ? "Continuar" : "Pausar"}
              </button>
            </div>
            <p className="text-lg mb-5">
              Tiempo de respuesta: {Math.floor(temporizador.seconds)} s
            </p>
            {pausado && (
              <div
                role="status"
                className="p-12 text-center text-2xl rounded-3xl"
                style={tarjeta}
              >
                Actividad en pausa. Seleccioná Continuar cuando estés listo.
              </div>
            )}
            <section
              hidden={pausado}
              className="p-6 rounded-3xl space-y-6"
              style={tarjeta}
            >
              {tipo === "simpleCrossword" && instancia.puzzle && (
                <TableroCrucigrama
                  initialState={crucigramaEstado.current}
                  onStateChange={(valor) => {
                    crucigramaEstado.current = valor
                  }}
                  puzzle={instancia.puzzle}
                  disabled={ocupado || pausado || navegacion.suspended.current}
                  onComplete={crucigramaCompletar}
                />
              )}
              {tipo !== "simpleCrossword" &&
                pregunta &&
                fase === "question" && (
                  <>
                    <h2 className="text-2xl font-bold">{pregunta.prompt}</h2>
                    {pregunta.target && (
                      <p
                        className="text-3xl font-bold"
                        style={{ fontFamily: "Fraunces, serif" }}
                      >
                        {pregunta.target}
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {pregunta.options.map((opcion) => (
                        <button
                          key={opcion}
                          className="p-6 rounded-2xl text-xl font-bold text-left focus-visible:outline-4 focus-visible:outline-green-700"
                          aria-pressed={seleccionado === opcion}
                          disabled={ocupado}
                          style={{
                            background:
                              seleccionado === opcion
                                ? "#D8EDE3"
                                : "var(--muted)",
                            border:
                              seleccionado === opcion
                                ? "3px solid #407453"
                                : "3px solid transparent",
                          }}
                          onClick={() => establecerSeleccionado(opcion)}
                        >
                          {opcion}
                          {seleccionado === opcion ? " ✓" : ""}
                        </button>
                      ))}
                    </div>
                    <button
                      className={control}
                      style={principal}
                      disabled={!seleccionado || ocupado}
                      onClick={confirmar}
                    >
                      Confirmar
                    </button>
                  </>
                )}
              {fase === "feedback" && (
                <>
                  <MensajeRespuesta
                    mensaje={retroalimentacion}
                    correcto={aciertoLenguaje(
                      instancia,
                      respuestas.current.at(-1),
                    )}
                  />
                  <button
                    className={control}
                    style={principal}
                    disabled={ocupado}
                    onClick={siguiente}
                  >
                    {indice + 1 === instancia.questions.length
                      ? "Ver resultado"
                      : "Siguiente pregunta"}
                  </button>
                </>
              )}
            </section>
          </>
        )}
        {fase === "saving" && !error && (
          <p role="status" className="text-2xl text-center p-12">
            Guardando tu resultado…
          </p>
        )}
        {fase === "results" && resumen && (
          <ResumenResultadoEjercicio
            summary={resumen}
            category="Lenguaje"
            onBack={alVolver}
            onRepeat={() => {
              establecerSesion(null)
              establecerFase("instructions")
              void cargarNivel()
            }}
          />
        )}
      </main>
    </div>
  )
}
