import { MensajeRespuesta } from "../compartido/MensajeRespuesta"
import { aciertoVelocidad } from "../compartido/respuestaVisual"
import { audioJuego } from "../../../servicios/audioJuego"
import { InstruccionesEjercicio } from "../compartido/InstruccionesEjercicio"
import { EstadoSesionEjercicio } from "../compartido/EstadoSesionEjercicio"
import { useEffect, useRef, useState } from "react"
import { api } from "../../../servicios/api"
import { etiquetaDificultad } from "../../../tipos/ejercicios"
import {
  velocidadInstrucciones,
  nombresVelocidad,
  velocidadColores,
  type TipoVelocidad,
  type VelocidadInstancia,
  type VelocidadRespuesta,
  type EntregaVelocidad,
} from "../../../../compartido/velocidad"
import type { Nivel } from "../../../../compartido/memoria"
import { useNavegacionEjercicio } from "../compartido/useNavegacionEjercicio"
import { useTemporizadorRespuesta } from "../compartido/useTemporizadorRespuesta"
import { DialogoSalidaEjercicio } from "../compartido/DialogoSalidaEjercicio"
import {
  ResumenResultadoEjercicio,
  type ResumenEjercicio,
} from "../compartido/ResumenResultadoEjercicio"
import { TableroVelocidad } from "./TableroVelocidad"

interface Sesion {
  id: string
  exercise: {
    id: string
    payload: VelocidadInstancia
  }
}

type Fase = "instructions" | "waiting" | "arming" | "question" | "feedback" | "saving" | "results"

const control =
  "px-6 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-cyan-800"
const tarjeta = { background: "var(--card)", border: "2px solid var(--border)" }
const principal = { background: "#24697F", color: "white" }

export function EjercicioVelocidad({
  type: tipo,
  onBack: alVolver,
  onSaved: alGuardar,
}: {
  type: TipoVelocidad
  onBack: () => void
  onSaved: () => void
}) {
  const [nivel, establecerNivel] = useState<Nivel | null>(null)
  const [sesion, establecerSesion] = useState<Sesion | null>(null)
  const [fase, establecerFase] = useState<Fase>("instructions")
  const [ocupado, establecerOcupado] = useState(false),
    [pausado, actualizarPausado] = useState(false)
  const [error, establecerError] = useState(""),
    [indice, establecerIndice] = useState(0),
    [retroalimentacion, establecerRetroalimentacion] = useState("")
  const [resumen, establecerResumen] = useState<ResumenEjercicio | null>(null)
  const bloqueo = useRef(false),
    cicloVidaBloqueo = useRef(false)
  const respuestas = useRef<VelocidadRespuesta[]>([]),
    pendiente = useRef<EntregaVelocidad | null>(null)
  const pausarRelojes = useRef<() => void>(() => {})
  function establecerPausa(valor: boolean) {
    if (valor) pausarRelojes.current()
    actualizarPausado(valor)
  }
  function establecerOperacionOcupado(valor: boolean) {
    if (valor) pausarRelojes.current()
    establecerOcupado(valor)
  }
  const instancia = sesion?.exercise.payload,
    ensayo = instancia?.trials[indice]
  const navegacion = useNavegacionEjercicio({
    sessionId: sesion?.id,
    active: !!sesion && !["instructions", "results"].includes(fase),
    onBack: alVolver,
    paused: pausado,
    setPaused: establecerPausa,
    setBusy: establecerOperacionOcupado,
    exerciseType: tipo,
    navigationBlocked: fase === "saving",
  })
  const temporizador = useTemporizadorRespuesta(
    fase === "question" && !pausado && !ocupado,
    navegacion.suspended,
  )
  const esperando = useTemporizadorRespuesta(
    fase === "waiting" && !pausado && !ocupado,
    navegacion.suspended,
  )
  pausarRelojes.current = () => {
    temporizador.stop()
    esperando.stop()
  }
  const deshabilitado = ocupado || pausado || navegacion.suspended.current
  async function cargarNivel() {
    establecerNivel(null)
    establecerOcupado(true)
    establecerError("")
    try {
      const progreso = await api.obtenerFuncionProgreso<{
        currentLevel: Nivel
      }>("speed")
      establecerNivel(progreso.currentLevel ?? "easy")
    } catch {
      establecerError(
        "No pudimos cargar tu nivel de Velocidad. Intentá nuevamente.",
      )
    } finally {
      establecerOcupado(false)
    }
  }
  useEffect(() => {
    void cargarNivel()
  }, [tipo])
  function restablecerEnsayo() {
    temporizador.reset()
    esperando.reset()
    bloqueo.current = false
    establecerRetroalimentacion("")
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
        !siguiente.exercise.payload.trials.length
      )
        throw new Error("Actividad inválida.")
      await api.sesionEstado(siguiente.id, "active")
      establecerSesion(siguiente)
      establecerNivel(siguiente.exercise.payload.level)
      respuestas.current = []
      pendiente.current = null
      restablecerEnsayo()
      establecerIndice(0)
      actualizarPausado(false)
      establecerFase(tipo === "visualReaction" ? "waiting" : "arming")
    } catch {
      establecerError("No pudimos iniciar el ejercicio. Intentá nuevamente.")
    } finally {
      cicloVidaBloqueo.current = false
      establecerOcupado(false)
    }
  }
  const alternarPausar = navegacion.togglePause
  useEffect(() => {
    if (fase !== "arming" || deshabilitado) return
    let segundoCuadro = 0
    // Espera a que se dibuje el estímulo antes de habilitar la respuesta y medir su tiempo.
    const primeroCuadro = requestAnimationFrame(() => {
      segundoCuadro = requestAnimationFrame(() => {
        if (!document.hidden && !navegacion.suspended.current)
          establecerFase("question")
      })
    })
    return () => {
      cancelAnimationFrame(primeroCuadro)
      cancelAnimationFrame(segundoCuadro)
    }
  }, [fase, deshabilitado, navegacion.suspended])
  useEffect(() => {
    if (
      fase !== "waiting" ||
      ensayo?.kind !== "visualReaction" ||
      deshabilitado
    )
      return
    const intervalo = window.setInterval(() => {
      if (
        !document.hidden &&
        !navegacion.suspended.current &&
        esperando.sample() * 1000 >= ensayo.waitingMs
      ) {
        esperando.stop()
        establecerFase("arming")
      }
    }, 20)
    return () => window.clearInterval(intervalo)
  }, [
    fase,
    ensayo,
    deshabilitado,
    esperando.sample,
    esperando.stop,
    navegacion.suspended,
  ])
  function finalizar(
    estado: VelocidadRespuesta["status"],
    enviadoRespuesta: string | null = null,
  ) {
    if (
      !ensayo ||
      !instancia ||
      deshabilitado ||
      document.hidden ||
      bloqueo.current
    )
      return
    if (estado === "falseStart" ? fase !== "waiting" : fase !== "question")
      return
    const transcurridoMs = temporizador.sample() * 1000
    const vencimiento =
      estado === "timeout" ||
      (estado === "answered" && transcurridoMs >= instancia.config.timeoutMs)
    if (
      estado === "answered" &&
      !vencimiento &&
      (!enviadoRespuesta ||
        !ensayo.options.includes(enviadoRespuesta) ||
        transcurridoMs <= 0)
    )
      return
    bloqueo.current = true
    temporizador.stop()
    esperando.stop()
    const resultado: VelocidadRespuesta = {
      trialId: ensayo.id,
      status: vencimiento ? "timeout" : estado,
      submittedAnswer:
        vencimiento || estado === "falseStart" ? null : enviadoRespuesta,
      responseTimeMs:
        estado === "falseStart"
          ? null
          : vencimiento
            ? instancia.config.timeoutMs
            : transcurridoMs,
    }
    respuestas.current.push(resultado)
    audioJuego.reproducir(
      resultado.status === "answered" &&
        enviadoRespuesta === ensayo.expectedAnswer
        ? "correct"
        : "incorrect",
    )
    const esperado =
      ensayo.kind === "touchColor"
        ? velocidadColores.find((color) => color.id === ensayo.expectedAnswer)!
            .name
        : ensayo.expectedAnswer
    establecerRetroalimentacion(
      resultado.status === "falseStart"
        ? "Tocaste antes de la señal. Esperá a que aparezca en la próxima ronda."
        : resultado.status === "timeout"
          ? "Se terminó el tiempo de esta ronda. Continuamos con la próxima."
          : ensayo.kind === "visualReaction"
            ? `Tu tiempo de reacción: ${Math.round(transcurridoMs)} ms.`
            : enviadoRespuesta === ensayo.expectedAnswer
              ? "¡Correcto!"
              : `La respuesta correcta era ${esperado}.`,
    )
    establecerFase("feedback")
  }
  useEffect(() => {
    if (fase !== "question" || deshabilitado || !instancia) return
    const intervalo = window.setInterval(() => {
      if (temporizador.sample() * 1000 >= instancia.config.timeoutMs)
        finalizar("timeout")
    }, 20)
    return () => window.clearInterval(intervalo)
  }, [fase, deshabilitado, instancia, indice, temporizador.sample])
  async function guardar(respuesta: EntregaVelocidad) {
    if (!sesion || cicloVidaBloqueo.current) return
    cicloVidaBloqueo.current = true
    pendiente.current = respuesta
    navegacion.protectSave()
    establecerOperacionOcupado(true)
    establecerFase("saving")
    establecerError("")
    try {
      const resultado = await api.enviarResultado<ResumenEjercicio>({
        sessionId: sesion.id,
        exerciseId: sesion.exercise.id,
        exerciseType: tipo,
        cognitiveFunctionId: "speed",
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
    if (indice + 1 === instancia.trials.length) {
      void guardar({
        answers: respuestas.current,
        actualResponseTimeSeconds:
          respuestas.current.reduce(
            (suma, respuesta) => suma + (respuesta.responseTimeMs ?? 0),
            0,
          ) / 1000,
      })
      return
    }
    restablecerEnsayo()
    establecerIndice(indice + 1)
    establecerFase(tipo === "visualReaction" ? "waiting" : "arming")
  }
  const activoTiempo =
    respuestas.current.reduce(
      (suma, respuesta) => suma + (respuesta.responseTimeMs ?? 0),
      0,
    ) /
      1000 +
    (fase === "question" ? temporizador.seconds : 0)
  function capturarEstado() {
    return {
      version: 1 as const,
      exerciseId: sesion?.exercise.id ?? tipo,
      phase: fase,
      step: indice,
      activeSeconds: temporizador.sample(),
      state: {
        feedback: retroalimentacion,
        answers: respuestas.current,
        locked: bloqueo.current,
        pending: pendiente.current,
        waiting: esperando.sample(),
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
    establecerRetroalimentacion(datos.feedback)
    respuestas.current = datos.answers
    bloqueo.current = datos.locked
    pendiente.current =
      restaurado.pendingResult?.response as typeof pendiente.current ??
      datos.pending
    esperando.restore(datos.waiting)
  })
  return (
    <div
      className="exercise-screen min-h-screen"
      onKeyDown={(evento) => {
        if (evento.repeat) evento.preventDefault()
      }}
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
          ← Volver a Velocidad
        </button>
        <div>
          <p style={{ color: "#24697F" }}>Velocidad</p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {nombresVelocidad[tipo]}
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
        instrucciones={velocidadInstrucciones[tipo]}
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
          <section className="p-8 rounded-3xl space-y-6" style={tarjeta}>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Cómo jugar
            </h2>
            <InstruccionesEjercicio text={velocidadInstrucciones[tipo]} />
            <p className="text-lg">
              Podés pausar o salir cuando lo necesites. El tiempo disponible se
              muestra en cada ronda.
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
          ensayo &&
          ["waiting", "arming", "question", "feedback"].includes(fase) && (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <p className="text-xl font-semibold">
                  Ronda {indice + 1} de {instancia.trials.length}
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
              <progress
                aria-label="Progreso del ejercicio"
                className="w-full h-4 mb-5"
                max={instancia.trials.length}
                value={respuestas.current.length}
              />
              <p className="text-lg mb-3">
                Tiempo activo: {activoTiempo.toFixed(1)} s
              </p>
              {fase === "question" && (
                <p className="text-lg mb-5">
                  Tiempo restante:{" "}
                  {Math.max(
                    0,
                    instancia.config.timeoutMs / 1000 - temporizador.seconds,
                  ).toFixed(1)}{" "}
                  s
                </p>
              )}
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
                {["waiting", "arming", "question"].includes(fase) && (
                  <TableroVelocidad
                    trial={ensayo}
                    phase={fase as "waiting" | "arming" | "question"}
                    disabled={deshabilitado}
                    onAnswer={(respuesta) => finalizar("answered", respuesta)}
                    onFalseStart={() => finalizar("falseStart")}
                  />
                )}
                {fase === "feedback" && (
                  <>
                    <MensajeRespuesta
                      mensaje={retroalimentacion}
                      correcto={aciertoVelocidad(
                        instancia,
                        respuestas.current.at(-1),
                      )}
                    />
                    <button
                      className={control}
                      style={principal}
                      disabled={deshabilitado}
                      onClick={siguiente}
                    >
                      {indice + 1 === instancia.trials.length
                        ? "Ver resultado"
                        : "Siguiente ronda"}
                    </button>
                  </>
                )}
              </section>
            </>
          )}
        {fase === "saving" && !error && (
          <p role="status" className="p-12 text-2xl">
            Guardando tu resultado…
          </p>
        )}
        {fase === "results" && resumen && (
          <ResumenResultadoEjercicio
            summary={resumen}
            category="Velocidad"
            color="#24697F"
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
