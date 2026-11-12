import { AvanceEjercicio } from "../compartido/AvanceEjercicio"
import { GuardandoResultado } from "../compartido/GuardandoResultado"
import { MensajeRespuesta } from "../compartido/MensajeRespuesta"
import { aciertoAtencion } from "../compartido/respuestaVisual"
import { audioJuego } from "../../../servicios/audioJuego"
import { InstruccionesEjercicio } from "../compartido/InstruccionesEjercicio"
import { EstadoSesionEjercicio } from "../compartido/EstadoSesionEjercicio"
import { useEffect, useRef, useState } from "react"
import { api } from "../../../servicios/api"
import { etiquetaDificultad } from "../../../tipos/ejercicios"
import {
  atencionInstrucciones,
  nombresAtencion,
  visualClave,
  type TipoAtencion,
  type AtencionInstancia,
  type AtencionRespuesta,
  type EntregaAtencion,
} from "../../../../compartido/atencionReconocimiento"
import type { Nivel } from "../../../../compartido/memoria"
import { useNavegacionEjercicio } from "../compartido/useNavegacionEjercicio"
import { useTemporizadorRespuesta } from "../compartido/useTemporizadorRespuesta"
import { DialogoSalidaEjercicio } from "../compartido/DialogoSalidaEjercicio"
import {
  ResumenResultadoEjercicio,
  type ResumenEjercicio,
} from "../compartido/ResumenResultadoEjercicio"
import { TableroBusqueda } from "./TableroBusqueda"
import { TableroPatrones } from "./TableroPatrones"
import { TableroSeguimiento } from "./TableroSeguimiento"

interface Sesion {
  id: string
  exercise: {
    id: string
    payload: AtencionInstancia
  }
}

type Fase = "instructions" | "preview" | "movement" | "question" | "feedback" | "saving" | "results"

const categoria = "Atención y reconocimiento"
const control =
  "px-6 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-red-800"
const tarjeta = { background: "var(--card)", border: "2px solid var(--border)" }
const principal = { background: "#8C493A", color: "white" }

export function EjercicioAtencion({
  type: tipo,
  onBack: alVolver,
  onSaved: alGuardar,
}: {
  type: TipoAtencion
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
  const [ocupado, establecerOcupadoEstado] = useState(false),
    [pausado, establecerPausadoEstado] = useState(false)
  const [error, establecerError] = useState(""),
    [indice, establecerIndice] = useState(0)
  const [seleccionado, establecerSeleccionado] = useState<number[]>([])
  const [eleccion, establecerEleccion] = useState<string | null>(null)
  const [retroalimentacion, establecerRetroalimentacion] = useState(""),
    [transcurrido, establecerTranscurrido] = useState(0)
  const [resumen, establecerResumen] = useState<ResumenEjercicio | null>(null)
  const respuestas = useRef<AtencionRespuesta[]>([]),
    pendiente = useRef<EntregaAtencion | null>(null)
  const bloqueo = useRef(false),
    cicloVidaBloqueo = useRef(false),
    faseTranscurrido = useRef(0),
    preguntaIniciar = useRef(0)
  const intentos = useRef<number[]>([])
  const instancia = sesion?.exercise.payload
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
  const deshabilitado = ocupado || pausado || navegacion.suspended.current
  async function cargarNivel() {
    establecerNivel(null)
    establecerOcupado(true)
    establecerError("")
    try {
      const progreso = await api.obtenerFuncionProgreso<{
        currentLevel: Nivel
      }>("attentionRecognition")
      establecerNivel(progreso.currentLevel ?? "easy")
    } catch {
      establecerError(
        "No pudimos cargar tu nivel de Atención y reconocimiento. Intentá nuevamente.",
      )
    } finally {
      establecerOcupado(false)
    }
  }
  useEffect(() => {
    void cargarNivel()
  }, [tipo])
  function restablecerRonda() {
    establecerSeleccionado([])
    establecerEleccion(null)
    establecerRetroalimentacion("")
    intentos.current = []
    bloqueo.current = false
    faseTranscurrido.current = 0
    establecerTranscurrido(0)
  }
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
      if (
        siguiente.exercise.payload.type !== tipo ||
        !siguiente.exercise.payload.rounds.length
      )
        throw new Error("Actividad inválida.")
      await api.sesionEstado(siguiente.id, "active")
      establecerSesion(siguiente)
      establecerNivel(siguiente.exercise.payload.level)
      respuestas.current = []
      pendiente.current = null
      preguntaIniciar.current = 0
      temporizador.reset()
      restablecerRonda()
      establecerIndice(0)
      establecerPausa(false)
      establecerFase(tipo === "followObject" ? "preview" : "question")
    } catch {
      establecerError("No pudimos iniciar el ejercicio. Intentá nuevamente.")
    } finally {
      cicloVidaBloqueo.current = false
      establecerOcupado(false)
    }
  }
  const alternarPausar = navegacion.togglePause
  useEffect(() => {
    if (
      !instancia ||
      !["preview", "movement"].includes(fase) ||
      pausado ||
      ocupado
    )
      return
    const duracion =
      fase === "preview"
        ? instancia.config.previewSeconds
        : instancia.config.movementSeconds
    let anterior = performance.now(),
      cuadro = 0
    const pulso = (ahora: number) => {
      if (!navegacion.suspended.current && !document.hidden)
        faseTranscurrido.current += (ahora - anterior) / 1000
      anterior = ahora
      establecerTranscurrido(Math.min(faseTranscurrido.current, duracion))
      if (faseTranscurrido.current >= duracion) {
        faseTranscurrido.current = 0
        establecerTranscurrido(0)
        establecerFase(fase === "preview" ? "movement" : "question")
        return
      }
      cuadro = requestAnimationFrame(pulso)
    }
    cuadro = requestAnimationFrame(pulso)
    return () => cancelAnimationFrame(cuadro)
  }, [instancia, fase, pausado, ocupado, navegacion.suspended])
  function registro(
    seleccion: number[] | string,
    mensaje: string,
    correcto: boolean,
  ) {
    if (!instancia || bloqueo.current) return
    bloqueo.current = true
    const tiempo = temporizador.stop()
    respuestas.current.push({
      roundId: instancia.rounds[indice].id,
      selection: seleccion,
      responseTimeSeconds: tiempo - preguntaIniciar.current,
    })
    audioJuego.reproducir(correcto ? "correct" : "incorrect")
    establecerRetroalimentacion(mensaje)
    establecerFase("feedback")
  }
  function confirmar() {
    if (!instancia || deshabilitado || bloqueo.current || fase !== "question")
      return
    const ronda = instancia.rounds[indice]
    if (instancia.type === "identifyElements" && "targetIndices" in ronda) {
      const correcto =
        seleccionado.length === ronda.targetIndices.length &&
        seleccionado.every((valor) => ronda.targetIndices.includes(valor))
      registro(
        seleccionado,
        correcto
          ? "¡Correcto!"
          : `Encontraste ${seleccionado.filter((valor) => ronda.targetIndices.includes(valor)).length} de ${ronda.targetIndices.length} elementos. La muestra permanece disponible para practicar.`,
        correcto,
      )
    } else if (eleccion !== null) {
      const correcto =
        "targetId" in ronda
          ? eleccion === ronda.targetId
          : "correctAnswer" in ronda &&
            eleccion === visualClave(ronda.correctAnswer)
      registro(
        eleccion,
        correcto
          ? "¡Correcto!"
          : "Esta vez la selección no coincidió. Continuamos con la próxima ronda.",
        correcto,
      )
    }
  }
  function seleccionarBuscar(posicion: number) {
    if (!instancia || deshabilitado || bloqueo.current || fase !== "question")
      return
    if (instancia.type === "identifyElements") {
      establecerSeleccionado((valores) =>
        valores.includes(posicion)
          ? valores.filter((valor) => valor !== posicion)
          : [...valores, posicion],
      )
      return
    }
    const ronda = instancia.rounds[indice]
    if (!("targetIndices" in ronda) || intentos.current.includes(posicion))
      return
    intentos.current.push(posicion)
    establecerSeleccionado(intentos.current.slice())
    if (ronda.targetIndices.includes(posicion))
      registro(intentos.current.slice(), "¡Correcto!", true)
    else if (intentos.current.length === 3)
      registro(
        intentos.current.slice(),
        "Esta era la figura. Se muestra marcada en la grilla.",
        false,
      )
    else {
      audioJuego.reproducir("incorrect")
      establecerRetroalimentacion("Probá nuevamente.")
    }
  }
  async function guardar(respuesta: EntregaAtencion) {
    if (!sesion || cicloVidaBloqueo.current) return
    cicloVidaBloqueo.current = true
    pendiente.current = respuesta
    navegacion.protectSave()
    establecerOcupado(true)
    establecerFase("saving")
    establecerError("")
    try {
      const resultado = await api.enviarResultado<ResumenEjercicio>({
        sessionId: sesion.id,
        exerciseId: sesion.exercise.id,
        exerciseType: tipo,
        cognitiveFunctionId: "attentionRecognition",
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
      establecerOcupado(false)
    }
  }
  function siguiente() {
    if (!instancia || deshabilitado || fase !== "feedback") return
    if (indice + 1 === instancia.rounds.length) {
      void guardar({
        answers: respuestas.current,
        actualResponseTimeSeconds: respuestas.current.reduce(
          (suma, respuesta) => suma + respuesta.responseTimeSeconds,
          0,
        ),
      })
      return
    }
    preguntaIniciar.current = temporizador.total.current
    establecerIndice(indice + 1)
    restablecerRonda()
    establecerFase(tipo === "followObject" ? "preview" : "question")
  }
  const ronda = instancia?.rounds[indice]
  const visualFase = fase === "preview" || fase === "movement"
  function capturarEstado() {
    return {
      version: 1 as const,
      exerciseId: sesion?.exercise.id ?? tipo,
      phase: fase,
      step: indice,
      activeSeconds: temporizador.sample(),
      state: {
        selected: seleccionado,
        choice: eleccion,
        feedback: retroalimentacion,
        elapsed: faseTranscurrido.current,
        answers: respuestas.current,
        attempts: intentos.current,
        questionStart: preguntaIniciar.current,
        locked: bloqueo.current,
        pending: pendiente.current,
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
    establecerEleccion(datos.choice)
    establecerRetroalimentacion(datos.feedback)
    faseTranscurrido.current = datos.elapsed
    respuestas.current = datos.answers
    intentos.current = datos.attempts
    preguntaIniciar.current = datos.questionStart
    bloqueo.current = datos.locked
    pendiente.current =
      restaurado.pendingResult?.response as typeof pendiente.current ??
      datos.pending
    establecerTranscurrido(datos.elapsed)
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
          disabled={ocupado}
          onClick={() => navegacion.requestExit()}
        >
          ← Volver a Atención y reconocimiento
        </button>
        <div>
          <p style={{ color: "#8C493A" }}>{categoria}</p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {nombresAtencion[tipo]}
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
        instrucciones={atencionInstrucciones[tipo]}
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
                disabled={ocupado || pausado}
                onClick={() => pendiente.current && guardar(pendiente.current)}
              >
                Reintentar guardado
              </button>
            )}
          </div>
        )}
        {fase === "instructions" && (
          <section
            className="preparacion-ejercicio p-8 rounded-3xl space-y-6"
            style={tarjeta}
          >
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Cómo jugar
            </h2>
            <InstruccionesEjercicio text={atencionInstrucciones[tipo]} />
            <p className="text-lg">
              Podés pausar y continuar cuando lo necesites. No hay un límite de
              tiempo para responder.
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
        {instancia &&
          ronda &&
          ["preview", "movement", "question", "feedback"].includes(fase) && (
            <>
              <AvanceEjercicio
                completados={indice + (fase === "feedback" ? 1 : 0)}
                total={instancia.rounds.length}
                etiqueta={`${
                  tipo === "recognizePattern" ? "Pregunta" : "Ronda"
                } ${indice + 1} de ${instancia.rounds.length}`}
              >
                <button
                  className={control}
                  style={tarjeta}
                  disabled={ocupado}
                  onClick={alternarPausar}
                >
                  {pausado ? "Continuar" : "Pausar"}
                </button>
              </AvanceEjercicio>
              <p className="text-lg mb-5">
                Tiempo de respuesta: {Math.floor(temporizador.seconds)} s
              </p>
              {pausado && (
                <p
                  role="status"
                  className="p-10 text-xl rounded-3xl"
                  style={tarjeta}
                >
                  Actividad en pausa. Seleccioná Continuar cuando estés listo.
                </p>
              )}
              <section
                hidden={pausado}
                className="p-6 rounded-3xl space-y-6"
                style={tarjeta}
              >
                {tipo === "followObject" &&
                  "objects" in ronda &&
                  (visualFase || fase === "question") && (
                    <>
                      <h2 className="text-2xl font-bold">
                        {fase === "preview"
                          ? `Objeto a seguir. Comienza en ${Math.ceil(instancia.config.previewSeconds - transcurrido)} s`
                          : fase === "movement"
                            ? `Seguí el objeto… ${Math.ceil(instancia.config.movementSeconds - transcurrido)} s`
                            : "¿Cuál era el objeto?"}
                      </h2>
                      <TableroSeguimiento
                        round={ronda}
                        stage={fase as "preview" | "movement" | "question"}
                        progress={
                          transcurrido / instancia.config.movementSeconds
                        }
                        selected={eleccion}
                        onSelect={establecerEleccion}
                        disabled={deshabilitado}
                      />
                    </>
                  )}
                {(fase === "question" ||
                  (fase === "feedback" && tipo === "hiddenFigure")) &&
                  "items" in ronda && (
                    <TableroBusqueda
                      round={ronda}
                      selected={seleccionado}
                      onSelect={seleccionarBuscar}
                      disabled={deshabilitado || fase === "feedback"}
                      single={tipo === "hiddenFigure"}
                      reveal={fase === "feedback"}
                    />
                  )}
                {fase === "question" && "options" in ronda && (
                  <TableroPatrones
                    round={ronda}
                    selected={eleccion}
                    onSelect={establecerEleccion}
                    disabled={deshabilitado}
                  />
                )}
                {fase === "question" && tipo !== "hiddenFigure" && (
                  <button
                    className={control}
                    style={principal}
                    disabled={
                      deshabilitado ||
                      (tipo !== "identifyElements" && eleccion === null)
                    }
                    onClick={confirmar}
                  >
                    Confirmar
                  </button>
                )}
                {retroalimentacion && (
                  <MensajeRespuesta
                    mensaje={retroalimentacion}
                    correcto={
                      fase === "feedback"
                        ? aciertoAtencion(instancia, respuestas.current.at(-1))
                        : false
                    }
                  />
                )}
                {fase === "feedback" && (
                  <button
                    className={control}
                    style={principal}
                    disabled={deshabilitado}
                    onClick={siguiente}
                  >
                    {indice + 1 === instancia.rounds.length
                      ? "Ver resultado"
                      : "Siguiente ronda"}
                  </button>
                )}
              </section>
            </>
          )}
        {fase === "saving" && !error && <GuardandoResultado />}
        {fase === "results" && resumen && (
          <ResumenResultadoEjercicio
            summary={resumen}
            category={categoria}
            color="#8C493A"
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
