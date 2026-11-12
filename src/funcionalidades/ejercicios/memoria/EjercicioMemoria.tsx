import { AvanceEjercicio } from "../compartido/AvanceEjercicio"
import { GuardandoResultado } from "../compartido/GuardandoResultado"
import { MensajeRespuesta } from "../compartido/MensajeRespuesta"
import { aciertoMemoria } from "../compartido/respuestaVisual"
import { audioJuego } from "../../../servicios/audioJuego"
import { InstruccionesEjercicio } from "../compartido/InstruccionesEjercicio"
import { EstadoSesionEjercicio } from "../compartido/EstadoSesionEjercicio"
import type { ResumenEjercicio as Resumen } from "../../../../compartido/resultados"
import { ResumenResultadoEjercicio } from "../compartido/ResumenResultadoEjercicio"
import { useTemporizadorRespuesta } from "../compartido/useTemporizadorRespuesta"
import { useNavegacionEjercicio } from "../compartido/useNavegacionEjercicio"
import { DialogoSalidaEjercicio } from "../compartido/DialogoSalidaEjercicio"
import { TableroMemoria } from "./TableroMemoria"
import { useEffect, useRef, useState } from "react"
import { api } from "../../../servicios/api"
import { etiquetaDificultad } from "../../../tipos/ejercicios"
import {
  instrucciones,
  nombres,
  type TipoMemoria,
  type InstanciaMemoria,
  type RespuestaMemoria,
  type Nivel,
} from "../../../../compartido/memoria"

type Fase = "instructions" | "ready" | "presentation" | "response" | "feedback" | "saving" | "results"

interface Sesion {
  id: string
  exercise: {
    id: string
    payload: InstanciaMemoria
  }
}

export function EjercicioMemoria({
  type: tipo,
  onBack: alVolver,
  onSaved: alGuardar,
}: {
  type: TipoMemoria
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
  const [sesion, establecerSesion] = useState<Sesion | null>(null)
  const [fase, establecerFase] = useState<Fase>("instructions")
  const [nivel, establecerNivel] = useState<Nivel | null>(null)
  const [error, establecerError] = useState("")
  const [ocupado, establecerOcupadoEstado] = useState(false)
  const [pausado, establecerPausadoEstado] = useState(false)
  const [rondaIndice, establecerRondaIndice] = useState(0)
  const [seleccionado, establecerSeleccionado] = useState<string[]>([])
  const [emparejado, establecerEmparejado] = useState<number[]>([])
  const [mostrar, establecerMostrar] = useState<number[]>([])
  const [transcurrido, establecerTranscurrido] = useState(0)
  const [retroalimentacion, establecerRetroalimentacion] = useState("")
  const [resumen, establecerResumen] = useState<Resumen | null>(null)
  const respuestas = useRef<string[][]>([])
  const faseTranscurrido = useRef(0)
  const bloqueo = useRef(false)
  const enviarBloqueo = useRef(false)
  const pendiente = useRef<RespuestaMemoria | null>(null)
  const cicloVidaBloqueo = useRef(false)
  const instancia = sesion?.exercise.payload
  const ronda = instancia?.rounds[rondaIndice]
  const configuracion = instancia?.config

  async function cargarNivel() {
    establecerOcupado(true)
    establecerError("")
    establecerNivel(null)
    try {
      const progreso = await api.obtenerMemoriaProgreso<{
        currentLevel: Nivel
      }>()
      establecerNivel(progreso.currentLevel ?? "easy")
    } catch {
      establecerError("No pudimos cargar tu nivel. Intentá nuevamente.")
    } finally {
      establecerOcupado(false)
    }
  }
  useEffect(() => {
    void cargarNivel()
  }, [tipo])
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
  const respuestaTemporizador = useTemporizadorRespuesta(
    fase === "response" && !pausado && !ocupado,
    navegacion.suspended,
  )
  pausarReloj.current = respuestaTemporizador.stop
  const respuestaTiempo = respuestaTemporizador.total
  function cambiarFase(siguiente: Fase) {
    faseTranscurrido.current = 0
    establecerTranscurrido(0)
    establecerFase(siguiente)
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
      const siguiente = await api.startMemory<Sesion>(tipo)
      await api.sesionEstado(siguiente.id, "active")
      establecerSesion(siguiente)
      establecerNivel(siguiente.exercise.payload.level)
      respuestas.current = []
      respuestaTemporizador.reset()
      pendiente.current = null
      bloqueo.current = false
      establecerRondaIndice(0)
      establecerSeleccionado([])
      establecerEmparejado([])
      establecerMostrar([])
      establecerPausa(false)
      establecerResumen(null)
      cambiarFase(tipo === "imagePairs" ? "response" : "ready")
    } catch {
      establecerError("No pudimos iniciar la actividad. Intentá nuevamente.")
    } finally {
      cicloVidaBloqueo.current = false
      establecerOcupado(false)
    }
  }
  async function guardar(respuesta: RespuestaMemoria) {
    if (!sesion || enviarBloqueo.current) return
    enviarBloqueo.current = true
    pendiente.current = respuesta
    navegacion.protectSave()
    cambiarFase("saving")
    establecerError("")
    try {
      const resultado = await api.enviarResultado<Resumen>({
        sessionId: sesion.id,
        exerciseId: sesion.exercise.id,
        exerciseType: tipo,
        cognitiveFunctionId: "memory",
        response: respuesta,
      })
      navegacion.saved()
      establecerResumen(resultado)
      cambiarFase("results")
      alGuardar()
    } catch {
      establecerError(
        "No pudimos guardar el resultado. Conservamos tus respuestas: seleccioná Reintentar guardado.",
      )
    } finally {
      enviarBloqueo.current = false
    }
  }
  useEffect(() => {
    if (
      pausado ||
      ocupado ||
      !instancia ||
      !["ready", "presentation", "response", "feedback"].includes(fase)
    )
      return
    let anterior = performance.now()
    const temporizador = window.setInterval(() => {
      if (navegacion.suspended.current || document.hidden) {
        anterior = performance.now()
        return
      }
      const ahora = performance.now()
      const diferencia = ahora - anterior
      anterior = ahora
      faseTranscurrido.current += diferencia
      establecerTranscurrido(faseTranscurrido.current)
      if (fase === "ready" && faseTranscurrido.current >= 800)
        cambiarFase("presentation")
      if (fase === "presentation") {
        const duracion =
          tipo === "colorSequence"
            ? configuracion!.size *
              (configuracion!.presentationMs + configuracion!.gapMs)
            : configuracion!.presentationMs
        if (faseTranscurrido.current >= duracion) {
          bloqueo.current = false
          cambiarFase("response")
        }
      }
      if (
        fase === "response" &&
        tipo === "imagePairs" &&
        mostrar.length === 2 &&
        faseTranscurrido.current >= 1100
      ) {
        establecerMostrar([])
        bloqueo.current = false
      }
      if (fase === "feedback" && faseTranscurrido.current >= 1600) {
        if (rondaIndice + 1 === configuracion!.rounds) {
          void guardar({
            answers: respuestas.current,
            actualResponseTimeSeconds: respuestaTiempo.current,
          })
        } else {
          establecerRondaIndice((indice) => indice + 1)
          establecerSeleccionado([])
          cambiarFase("ready")
        }
      }
    }, 50)
    return () => window.clearInterval(temporizador)
  }, [fase, pausado, ocupado, sesion, rondaIndice, mostrar])
  const alternarPausar = navegacion.togglePause

  function elegirTarjeta(indice: number) {
    if (
      pausado ||
      ocupado ||
      bloqueo.current ||
      emparejado.includes(indice) ||
      mostrar.includes(indice) ||
      !ronda
    )
      return
    if (mostrar.length === 0) {
      establecerMostrar([indice])
      return
    }
    bloqueo.current = true
    const primero = mostrar[0]
    const intento = [String(primero), String(indice)]
    respuestas.current = [...respuestas.current, intento]
    if (ronda.options[primero] === ronda.options[indice]) {
      const siguiente = [...emparejado, primero, indice]
      const completadoTiempo =
        siguiente.length === ronda.options.length
          ? respuestaTemporizador.stop()
          : undefined
      audioJuego.reproducir("correct")
      establecerEmparejado(siguiente)
      establecerMostrar([])
      bloqueo.current = false
      if (siguiente.length === ronda.options.length) {
        bloqueo.current = true
        void guardar({
          answers: respuestas.current,
          actualResponseTimeSeconds: completadoTiempo!,
        })
      }
    } else {
      audioJuego.reproducir("incorrect")
      establecerMostrar([primero, indice])
      faseTranscurrido.current = 0
    }
  }
  function elegir(valor: string) {
    if (
      fase !== "response" ||
      pausado ||
      ocupado ||
      bloqueo.current ||
      !configuracion
    )
      return
    if (tipo === "wordList" && seleccionado.includes(valor)) {
      establecerSeleccionado(
        seleccionado.filter((elemento) => elemento !== valor),
      )
      return
    }
    if (
      seleccionado.length >= configuracion.size ||
      (tipo === "rememberOrder" && seleccionado.includes(valor))
    )
      return
    establecerSeleccionado([...seleccionado, valor])
  }
  function confirmar() {
    if (
      !ronda ||
      !configuracion ||
      seleccionado.length !== configuracion.size ||
      bloqueo.current ||
      pausado
    )
      return
    bloqueo.current = true
    respuestaTemporizador.stop()
    const correcto = seleccionado.filter((valor, indice) =>
      tipo === "wordList"
        ? ronda.target.includes(valor)
        : ronda.target[indice] === valor,
    ).length
    respuestas.current = [...respuestas.current, [...seleccionado]]
    audioJuego.reproducir(
      correcto === configuracion.size ? "correct" : "incorrect",
    )
    establecerRetroalimentacion(
      correcto === configuracion.size
        ? "¡Completaste la ronda sin errores!"
        : `Acertaste ${correcto} de ${configuracion.size}. Seguimos practicando.`,
    )
    cambiarFase("feedback")
  }
  const botonClase =
    "px-8 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-orange-700"
  const principalEstilo = {
    background: "var(--categoria-memoria)",
    color: "white",
  }
  const tarjetaEstilo = {
    background: "var(--card)",
    border: "2px solid var(--border)",
  }
  function capturarEstado() {
    return {
      version: 1 as const,
      exerciseId: sesion?.exercise.id ?? tipo,
      phase: fase,
      step: rondaIndice,
      activeSeconds: respuestaTemporizador.sample(),
      state: {
        selected: seleccionado,
        matched: emparejado,
        reveal: mostrar,
        feedback: retroalimentacion,
        answers: respuestas.current,
        phaseElapsed: faseTranscurrido.current,
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
    establecerRondaIndice(puntoControl.step)
    respuestaTemporizador.restore(puntoControl.activeSeconds)
    establecerSeleccionado(datos.selected)
    establecerEmparejado(datos.matched)
    establecerMostrar(datos.reveal)
    establecerRetroalimentacion(datos.feedback)
    respuestas.current = datos.answers
    faseTranscurrido.current = datos.phaseElapsed
    bloqueo.current = datos.locked
    pendiente.current =
      restaurado.pendingResult?.response as typeof pendiente.current ??
      datos.pending
    establecerTranscurrido(datos.phaseElapsed)
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
          className={botonClase}
          onClick={() => navegacion.requestExit()}
          disabled={fase === "saving" || ocupado}
        >
          ← Volver a Memoria
        </button>
        <div>
          <p
            className="text-base"
            style={{ color: "var(--categoria-memoria)" }}
          >
            Memoria
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {nombres[tipo]}
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
        exitLabel="Salir y cancelar sesión"
      />
      <EstadoSesionEjercicio
        instrucciones={instrucciones[tipo]}
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
                className={botonClase}
                onClick={cargarNivel}
                disabled={ocupado}
              >
                Reintentar
              </button>
            )}
            {fase === "saving" && (
              <button
                className={botonClase}
                style={principalEstilo}
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
            <InstruccionesEjercicio text={instrucciones[tipo]} />
            <p className="text-lg">
              Podés pausar y continuar cuando lo necesites. El nivel se adapta
              según tus actividades anteriores.
            </p>
            <button
              className={botonClase}
              style={principalEstilo}
              disabled={ocupado || !nivel || navegacion.checkingRecovery}
              onClick={iniciar}
            >
              {ocupado ? "Cargando…" : "Comenzar ejercicio"}
            </button>
          </section>
        )}
        {instancia &&
          ["ready", "presentation", "response", "feedback"].includes(fase) && (
            <>
              <AvanceEjercicio
                completados={
                  tipo === "imagePairs"
                    ? emparejado.length / 2
                    : rondaIndice + (fase === "feedback" ? 1 : 0)
                }
                total={
                  tipo === "imagePairs"
                    ? configuracion!.size
                    : configuracion!.rounds
                }
                etiqueta={
                  tipo === "imagePairs"
                    ? `Parejas: ${emparejado.length / 2} de ${configuracion!.size}`
                    : `Ronda ${rondaIndice + 1} de ${configuracion!.rounds}`
                }
              >
                <button
                  className={botonClase}
                  style={tarjetaEstilo}
                  onClick={alternarPausar}
                  disabled={ocupado}
                >
                  {pausado ? "Continuar" : "Pausar"}
                </button>
              </AvanceEjercicio>
              {fase === "response" && (
                <p className="text-lg mb-5">
                  Tiempo de respuesta:{" "}
                  {Math.floor(respuestaTemporizador.seconds)} s
                </p>
              )}
              {pausado ? (
                <div
                  role="status"
                  className="p-12 text-center text-2xl rounded-3xl"
                  style={tarjetaEstilo}
                >
                  Actividad en pausa. Seleccioná Continuar cuando estés listo.
                </div>
              ) : (
                <section
                  className="p-6 rounded-3xl space-y-6"
                  style={tarjetaEstilo}
                >
                  {fase === "ready" && (
                    <p role="status" className="text-2xl text-center p-10">
                      Preparáte para observar…
                    </p>
                  )}
                  {(fase === "presentation" || fase === "response") &&
                    ronda &&
                    configuracion && (
                      <TableroMemoria
                        type={tipo}
                        phase={fase}
                        round={ronda}
                        config={configuracion}
                        elapsed={transcurrido}
                        selected={seleccionado}
                        matched={emparejado}
                        reveal={mostrar}
                        busy={ocupado}
                        chooseCard={elegirTarjeta}
                        choose={elegir}
                        undo={() =>
                          establecerSeleccionado(seleccionado.slice(0, -1))
                        }
                        confirm={confirmar}
                      />
                    )}
                  {fase === "feedback" && (
                    <MensajeRespuesta
                      mensaje={retroalimentacion}
                      correcto={aciertoMemoria(
                        tipo,
                        ronda,
                        respuestas.current.at(-1),
                      )}
                    />
                  )}
                </section>
              )}
            </>
          )}
        {fase === "saving" && !error && <GuardandoResultado />}
        {fase === "results" && resumen && (
          <ResumenResultadoEjercicio
            summary={resumen}
            category="Memoria"
            color="var(--categoria-memoria)"
            onBack={alVolver}
            onRepeat={() => {
              establecerSesion(null)
              cambiarFase("instructions")
              void cargarNivel()
            }}
          />
        )}
      </main>
    </div>
  )
}
