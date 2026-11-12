import { AvanceEjercicio } from "../compartido/AvanceEjercicio"
import { GuardandoResultado } from "../compartido/GuardandoResultado"
import { MensajeRespuesta } from "../compartido/MensajeRespuesta"
import { aciertoCalculo } from "../compartido/respuestaVisual"
import { audioJuego } from "../../../servicios/audioJuego"
import { InstruccionesEjercicio } from "../compartido/InstruccionesEjercicio"
import { EstadoSesionEjercicio } from "../compartido/EstadoSesionEjercicio"
import { useEffect, useRef, useState } from "react"
import { api } from "../../../servicios/api"
import { etiquetaDificultad } from "../../../tipos/ejercicios"
import {
  calculoInstrucciones,
  nombresCalculo,
  interpretarNumericoRespuesta,
  type TipoCalculo,
  type CalculoInstancia,
  type CalculoRespuesta,
  type EntregaCalculo,
} from "../../../../compartido/calculo"
import type { Nivel } from "../../../../compartido/memoria"
import { useNavegacionEjercicio } from "../compartido/useNavegacionEjercicio"
import { useTemporizadorRespuesta } from "../compartido/useTemporizadorRespuesta"
import { DialogoSalidaEjercicio } from "../compartido/DialogoSalidaEjercicio"
import {
  ResumenResultadoEjercicio,
  type ResumenEjercicio,
} from "../compartido/ResumenResultadoEjercicio"
import { EntradaRespuestaNumerica } from "./EntradaRespuestaNumerica"
import { TableroSecuenciaNumerica } from "./TableroSecuenciaNumerica"
import { TableroOrdenNumeros } from "./TableroOrdenNumeros"

interface Sesion {
  id: string
  exercise: {
    id: string
    payload: CalculoInstancia
  }
}

type Fase = "instructions" | "question" | "feedback" | "saving" | "results"

const controlClase =
  "px-8 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-purple-700"
const tarjetaEstilo = {
  background: "var(--card)",
  border: "2px solid var(--border)",
}
const principalEstilo = { background: "#6553A2", color: "white" }

export function EjercicioCalculo({
  type: tipo,
  onBack: alVolver,
  onSaved: alGuardar,
}: {
  type: TipoCalculo
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
  const [numericoValor, establecerNumericoValor] = useState("")
  const [seleccionadoOpcion, establecerSeleccionadoOpcion] =
    useState<number | null>(null)
  const [seleccionadoOrden, establecerSeleccionadoOrden] = useState<number[]>(
    [],
  )
  const [retroalimentacion, establecerRetroalimentacion] = useState("")
  const [resumen, establecerResumen] = useState<ResumenEjercicio | null>(null)
  const respuestaBloqueo = useRef(false)
  const cicloVidaBloqueo = useRef(false)
  const respuestas = useRef<CalculoRespuesta[]>([])
  const preguntaIniciar = useRef(0)
  const pendiente = useRef<EntregaCalculo | null>(null)
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
      }>("calculation")
      establecerNivel(progreso.currentLevel ?? "easy")
    } catch {
      establecerError(
        "No pudimos cargar tu nivel de Cálculo. Intentá nuevamente.",
      )
    } finally {
      establecerOcupado(false)
    }
  }
  useEffect(() => {
    void cargarNivel()
  }, [tipo])
  function restablecerEntrada() {
    establecerNumericoValor("")
    establecerSeleccionadoOpcion(null)
    establecerSeleccionadoOrden([])
    respuestaBloqueo.current = false
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
        !siguiente.exercise.payload.questions.length
      )
        throw new Error("Actividad inválida.")
      await api.sesionEstado(siguiente.id, "active")
      establecerSesion(siguiente)
      establecerNivel(siguiente.exercise.payload.level)
      respuestas.current = []
      preguntaIniciar.current = 0
      pendiente.current = null
      temporizador.reset()
      restablecerEntrada()
      establecerIndice(0)
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
      !instancia ||
      respuestaBloqueo.current ||
      deshabilitado ||
      fase !== "question"
    )
      return
    const pregunta = instancia.questions[indice]
    let respuesta: number | number[] | null
    let esperado: number | number[]
    if (instancia.type === "orderNumbers") {
      const ronda = instancia.questions[indice]
      if (seleccionadoOrden.length !== ronda.values.length) return
      respuesta = seleccionadoOrden.slice()
      esperado = ronda.expected
    } else {
      respuesta =
        instancia.type === "numberSequence"
          ? seleccionadoOpcion
          : interpretarNumericoRespuesta(
              numericoValor,
              instancia.type === "subtractionDifference" &&
                instancia.config.allowNegative,
            )
      esperado = instancia.questions[indice].answer
    }
    if (respuesta === null) return
    respuestaBloqueo.current = true
    const total = temporizador.stop()
    respuestas.current.push({
      questionId: pregunta.id,
      answer: respuesta,
      responseTimeSeconds: total - preguntaIniciar.current,
    })
    const correcto =
      Array.isArray(respuesta) && Array.isArray(esperado)
        ? respuesta.every((valor, posicion) => valor === esperado[posicion])
        : respuesta === esperado
    audioJuego.reproducir(correcto ? "correct" : "incorrect")
    establecerRetroalimentacion(
      correcto
        ? "¡Correcto!"
        : `La respuesta correcta era ${
            Array.isArray(esperado) ? esperado.join(", ") : esperado
          }.`,
    )
    establecerFase("feedback")
  }
  async function guardar(respuesta: EntregaCalculo) {
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
        cognitiveFunctionId: "calculation",
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
    if (indice + 1 === instancia.questions.length) {
      void guardar({
        answers: respuestas.current,
        actualResponseTimeSeconds: respuestas.current.reduce(
          (total, respuesta) => total + respuesta.responseTimeSeconds,
          0,
        ),
      })
      return
    }
    preguntaIniciar.current = temporizador.total.current
    establecerIndice(indice + 1)
    restablecerEntrada()
    establecerFase("question")
  }
  function capturarEstado() {
    return {
      version: 1 as const,
      exerciseId: sesion?.exercise.id ?? tipo,
      phase: fase,
      step: indice,
      activeSeconds: temporizador.sample(),
      state: {
        numericValue: numericoValor,
        selectedOption: seleccionadoOpcion,
        selectedOrder: seleccionadoOrden,
        feedback: retroalimentacion,
        answers: respuestas.current,
        questionStart: preguntaIniciar.current,
        locked: respuestaBloqueo.current,
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
    establecerNumericoValor(datos.numericValue)
    establecerSeleccionadoOpcion(datos.selectedOption)
    establecerSeleccionadoOrden(datos.selectedOrder)
    establecerRetroalimentacion(datos.feedback)
    respuestas.current = datos.answers
    preguntaIniciar.current = datos.questionStart
    respuestaBloqueo.current = datos.locked
    pendiente.current =
      restaurado.pendingResult?.response as typeof pendiente.current ??
      datos.pending
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
          className={controlClase}
          disabled={ocupado}
          onClick={() => navegacion.requestExit()}
        >
          ← Volver a Cálculo
        </button>
        <div>
          <p className="text-base" style={{ color: "#6553A2" }}>
            Cálculo
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {nombresCalculo[tipo]}
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
        instrucciones={calculoInstrucciones[tipo]}
        navigation={navegacion}
        paused={pausado && !!sesion && fase !== "saving"}
        busy={ocupado}
      />
      <main className="max-w-4xl mx-auto p-6 md:p-10">
        {error && (
          <div
            role="alert"
            className="p-5 mb-6 rounded-2xl"
            style={tarjetaEstilo}
          >
            <p className="text-lg">{error}</p>
            {fase === "instructions" && !nivel && (
              <button
                className={controlClase}
                disabled={ocupado}
                onClick={cargarNivel}
              >
                Reintentar
              </button>
            )}
            {fase === "saving" && (
              <button
                className={controlClase}
                style={principalEstilo}
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
            style={tarjetaEstilo}
          >
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Cómo jugar
            </h2>
            <InstruccionesEjercicio text={calculoInstrucciones[tipo]} />
            <p className="text-lg">
              Podés pausar y continuar cuando lo necesites. No hay un límite de
              tiempo para responder.
            </p>
            <button
              className={controlClase}
              style={principalEstilo}
              disabled={ocupado || !nivel || navegacion.checkingRecovery}
              onClick={iniciar}
            >
              {ocupado ? "Cargando…" : "Comenzar ejercicio"}
            </button>
          </section>
        )}
        {instancia && ["question", "feedback"].includes(fase) && (
          <>
            <AvanceEjercicio
              completados={indice + (fase === "feedback" ? 1 : 0)}
              total={instancia.questions.length}
              etiqueta={`${
                tipo === "orderNumbers" ? "Ronda" : "Pregunta"
              } ${indice + 1} de ${instancia.questions.length}`}
            >
              <button
                className={controlClase}
                style={tarjetaEstilo}
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
              <div
                role="status"
                className="p-12 text-center text-2xl rounded-3xl"
                style={tarjetaEstilo}
              >
                Actividad en pausa. Seleccioná Continuar cuando estés listo.
              </div>
            )}
            <section
              hidden={pausado}
              className="p-6 rounded-3xl space-y-6"
              style={tarjetaEstilo}
            >
              {fase === "question" && (
                <>
                  {(instancia.type === "mentalCalculation" ||
                    instancia.type === "subtractionDifference") && (
                    <>
                      <h2 className="text-3xl sm:text-4xl font-bold text-center py-6">
                        {instancia.questions[indice].prompt}
                        {instancia.type === "mentalCalculation" ? " = ?" : ""}
                      </h2>
                      <EntradaRespuestaNumerica
                        value={numericoValor}
                        onChange={establecerNumericoValor}
                        disabled={deshabilitado}
                        allowNegative={
                          instancia.type === "subtractionDifference" &&
                          instancia.config.allowNegative
                        }
                        onConfirm={confirmar}
                      />
                    </>
                  )}
                  {instancia.type === "numberSequence" && (
                    <>
                      <TableroSecuenciaNumerica
                        question={instancia.questions[indice]}
                        selected={seleccionadoOpcion}
                        onSelect={establecerSeleccionadoOpcion}
                        disabled={deshabilitado}
                      />
                      <button
                        className={controlClase}
                        style={principalEstilo}
                        disabled={deshabilitado || seleccionadoOpcion === null}
                        onClick={confirmar}
                      >
                        Confirmar
                      </button>
                    </>
                  )}
                  {instancia.type === "orderNumbers" && (
                    <>
                      <TableroOrdenNumeros
                        round={instancia.questions[indice]}
                        selected={seleccionadoOrden}
                        onChange={establecerSeleccionadoOrden}
                        disabled={deshabilitado}
                      />
                      <button
                        className={controlClase}
                        style={principalEstilo}
                        disabled={
                          deshabilitado ||
                          seleccionadoOrden.length !==
                            instancia.config.numbersPerRound
                        }
                        onClick={confirmar}
                      >
                        Confirmar
                      </button>
                    </>
                  )}
                </>
              )}
              {fase === "feedback" && (
                <>
                  <MensajeRespuesta
                    mensaje={retroalimentacion}
                    correcto={aciertoCalculo(
                      instancia,
                      respuestas.current.at(-1),
                    )}
                  />
                  <button
                    className={controlClase}
                    style={principalEstilo}
                    disabled={deshabilitado}
                    onClick={siguiente}
                  >
                    {indice + 1 === instancia.questions.length
                      ? "Ver resultado"
                      : tipo === "orderNumbers"
                        ? "Siguiente ronda"
                        : "Siguiente pregunta"}
                  </button>
                </>
              )}
            </section>
          </>
        )}
        {fase === "saving" && !error && <GuardandoResultado />}
        {fase === "results" && resumen && (
          <ResumenResultadoEjercicio
            summary={resumen}
            category="Cálculo"
            color="#6553A2"
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
