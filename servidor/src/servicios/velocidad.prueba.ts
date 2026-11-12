import test from "node:test"
import assert from "node:assert/strict"
import {
  tiposVelocidad,
  velocidadConfiguraciones,
  generarVelocidad,
  evaluarVelocidad,
  clasificacionElementos,
  coloresSolicitados,
  type VelocidadInstancia,
  type EntregaVelocidad,
} from "../../../compartido/velocidad"
import { visualClave } from "../../../compartido/atencionReconocimiento"
import { ActivoTiempo } from "../../../compartido/tiempoActivo"
import { obtenerEjercicioEstrategia } from "./estrategiasEjercicio"
import { prepararSesionResultado } from "./resultadoEjercicio.servicio"
import {
  calcularMetricasRendimiento,
  determinarAjusteDificultad,
} from "./dificultadAdaptativa.servicio"
import type { Nivel } from "../../../compartido/memoria"

const niveles: Nivel[] = ["easy", "normal", "hard", "veryHard"]

function perfecto(instancia: VelocidadInstancia): EntregaVelocidad {
  return {
    actualResponseTimeSeconds: instancia.trials.length / 2,
    answers: instancia.trials.map((ensayo) => ({
      trialId: ensayo.id,
      status: "answered",
      submittedAnswer: ensayo.expectedAnswer,
      responseTimeMs: 500,
    })),
  }
}

for (const tipo of tiposVelocidad)
  test(`${tipo}: registration, all difficulty configurations and complete perfect results`, () => {
    niveles.forEach((nivel, indice) => {
      const estrategia = obtenerEjercicioEstrategia(tipo),
        ejercicio = estrategia.generateExercise(nivel),
        instancia = ejercicio.payload as VelocidadInstancia
      assert.equal(estrategia.cognitiveFunctionId, "speed")
      assert.equal(
        instancia.trials.length,
        (tipo === "visualReaction" ? 6 : 8) + indice * 2,
      )
      assert.equal(
        instancia.config.timeoutMs,
        {
          quickResponse: [8000, 7000, 9000, 11000],
          touchColor: [8000, 7000, 6000, 8000],
          quickClassification: [8000, 7000, 6000, 5000],
          visualReaction: [4500, 4500, 5000, 5500],
        }[tipo][indice],
      )
      assert.equal(
        new Set(instancia.trials.map((ensayo) => ensayo.id)).size,
        instancia.trials.length,
      )
      const resultado = prepararSesionResultado(
        ejercicio,
        { currentLevel: nivel },
        perfecto(instancia),
      )
      assert.equal(resultado.summary.metrics.accuracy, 100)
      assert.equal(resultado.summary.metrics.performanceScore, 100)
      assert.equal(resultado.nextProgress.cognitiveFunctionId, "speed")
      assert.equal(resultado.nextProgress.currentLevel, nivel)
      assert.equal(resultado.record.details?.exerciseType, tipo)
    })
  })

test("Igual o diferente equilibra atributos visibles y evita parejas consecutivas repetidas", () => {
  for (const nivel of niveles)
    for (let muestra = 0; muestra < 20; muestra++) {
      const instancia = generarVelocidad("quickResponse", nivel)
      assert.equal(
        instancia.trials.filter((ensayo) => ensayo.expectedAnswer === "IGUALES")
          .length,
        instancia.trials.length / 2,
      )
      let anterior = ""
      for (const ensayo of instancia.trials) {
        if (ensayo.kind !== "quickResponse") throw new Error("Wrong trial")
        assert.equal(
          ensayo.expectedAnswer,
          (ensayo.comparisonPairs ?? [ensayo.pair]).every(
            (pareja) => visualClave(pareja[0]) === visualClave(pareja[1]),
          )
            ? "IGUALES"
            : "DIFERENTES",
        )
        const pareja = (ensayo.comparisonPairs ?? [ensayo.pair])
          .map((pareja) => pareja.map(visualClave).join("|"))
          .join(";")
        assert.notEqual(pareja, anterior)
        anterior = pareja
      }
    }
})

test("Los colores solicitados son distintos, tienen un botón por color y posiciones variables", () => {
  niveles.forEach((nivel, indice) => {
    const instancia = generarVelocidad("touchColor", nivel)
    instancia.trials.forEach((ensayo, ensayoIndice) => {
      if (ensayo.kind !== "touchColor") throw new Error("Ensayo inesperado")
      assert.equal(ensayo.options.length, [3, 4, 6, 8][indice])
      assert.equal(new Set(ensayo.options).size, ensayo.options.length)
      const solicitados = coloresSolicitados(ensayo)
      assert.equal(solicitados.length, nivel === "veryHard" ? 2 : 1)
      assert.equal(new Set(solicitados).size, solicitados.length)
      assert.equal(ensayo.expectedAnswer, solicitados.join("|"))
      for (const color of solicitados)
        assert.equal(
          ensayo.options.filter((opcion) => opcion === color).length,
          1,
        )
      if (ensayoIndice)
        assert.notDeepEqual(
          ensayo.options,
          instancia.trials[ensayoIndice - 1].options,
        )
    })
  })
})

test("La clasificación usa elementos únicos y una categoría autorizada por palabra", () => {
  assert.equal(
    new Set(clasificacionElementos.map((elemento) => elemento.label)).size,
    clasificacionElementos.length,
  )
  for (const nivel of niveles) {
    const instancia = generarVelocidad("quickClassification", nivel)
    const categorias =
      niveles.indexOf(nivel) < 2 ? 2 : niveles.indexOf(nivel) + 1
    const ids: string[] = []
    for (const ensayo of instancia.trials) {
      if (ensayo.kind !== "quickClassification") throw new Error("Wrong trial")
      const elemento = clasificacionElementos.find(
        (elemento) => elemento.id === ensayo.itemId,
      )!
      ids.push(elemento.id)
      assert.equal(ensayo.expectedAnswer, elemento.category)
      assert.equal(ensayo.options.length, categorias)
      assert.equal(
        ensayo.options.filter((opcion) => opcion === elemento.category).length,
        1,
      )
      if (nivel === "easy") assert.equal(elemento.familiar, true)
    }
    assert.equal(new Set(ids).size, instancia.trials.length)
  }
})

test("La reacción limita esperas, conserva objetivos grandes y no asigna latencia válida a anticipaciones", () => {
  for (const nivel of niveles) {
    const instancia = generarVelocidad("visualReaction", nivel)
    for (const ensayo of instancia.trials) {
      if (ensayo.kind !== "visualReaction") throw new Error("Wrong trial")
      assert.ok(ensayo.waitingMs >= 1500 && ensayo.waitingMs <= 3500)
      if (nivel === "easy" || nivel === "normal")
        assert.equal(ensayo.position, "center")
    }
    const entrada = perfecto(instancia)
    entrada.answers[0] = {
      trialId: instancia.trials[0].id,
      status: "falseStart",
      submittedAnswer: null,
      responseTimeMs: null,
    }
    entrada.actualResponseTimeSeconds -= 0.5
    const resultado = evaluarVelocidad(instancia, entrada)
    assert.equal(resultado.falseStarts, 1)
    assert.equal(resultado.errors, 1)
    assert.equal(
      resultado.actualResponseTimeSeconds,
      (instancia.trials.length - 1) / 2,
    )
    assert.equal(resultado.averageResponseTimeMs, 500)
    assert.throws(() =>
      evaluarVelocidad(instancia, {
        ...entrada,
        answers: [
          { ...entrada.answers[0], responseTimeMs: 1 },
          ...entrada.answers.slice(1),
        ],
      }),
    )
  }
})

test("Los vencimientos y anticipaciones no reciben eficiencia temporal ni premio por reacciones ausentes", () => {
  for (const tipo of tiposVelocidad) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise("easy"),
      instancia = ejercicio.payload as VelocidadInstancia
    const entrada: EntregaVelocidad = {
      actualResponseTimeSeconds:
        (instancia.config.timeoutMs * instancia.trials.length) / 1000,
      answers: instancia.trials.map((ensayo) => ({
        trialId: ensayo.id,
        status: "timeout",
        submittedAnswer: null,
        responseTimeMs: instancia.config.timeoutMs,
      })),
    }
    const resultado = prepararSesionResultado(ejercicio, {}, entrada)
    assert.equal(resultado.summary.metrics.accuracy, 0)
    assert.equal(resultado.summary.metrics.timeEfficiency, 0)
    assert.equal(resultado.summary.metrics.performanceScore, 0)
    if (tipo === "visualReaction") {
      entrada.actualResponseTimeSeconds = 0
      entrada.answers = entrada.answers.map((respuesta) => ({
        ...respuesta,
        status: "falseStart",
        responseTimeMs: null,
      }))
      const vacio = prepararSesionResultado(ejercicio, {}, entrada)
      assert.equal(vacio.summary.metrics.timeEfficiency, 0)
      const detalles = vacio.record.details
      if (detalles?.exerciseType !== "visualReaction")
        throw new Error("Wrong metrics")
      assert.equal(detalles.averageResponseTimeMs, null)
      assert.equal(detalles.medianResponseTimeMs, null)
      assert.equal(detalles.fastestResponseTimeMs, null)
    }
  }
})

test("Los errores cuentan una vez y las penalizaciones y estadísticas de reacción se recalculan", () => {
  const instancia = generarVelocidad("quickResponse", "easy"),
    entrada = perfecto(instancia)
  entrada.answers[0].submittedAnswer = instancia.trials[0].options.find(
    (opcion) => opcion !== instancia.trials[0].expectedAnswer,
  )!
  entrada.answers[1] = {
    ...entrada.answers[1],
    status: "timeout",
    submittedAnswer: null,
    responseTimeMs: 8000,
  }
  entrada.actualResponseTimeSeconds += 7.5
  const resultado = evaluarVelocidad(instancia, entrada)
  assert.equal(resultado.correctAnswers, 6)
  assert.equal(resultado.errors, 2)
  assert.equal(resultado.timeouts, 1)
  assert.equal(resultado.responseTimeEfficiency, 87.5)
  const reaccion = generarVelocidad("visualReaction", "easy"),
    tiempos = [100, 300, 200, 600, 400, 500]
  const reacciones = perfecto(reaccion)
  reacciones.answers.forEach((respuesta, indice) => {
    respuesta.responseTimeMs = tiempos[indice]
  })
  reacciones.actualResponseTimeSeconds = 2.1
  const evaluacion = evaluarVelocidad(reaccion, reacciones)
  if (evaluacion.details.exerciseType !== "visualReaction")
    throw new Error("Wrong metrics")
  assert.equal(evaluacion.details.medianResponseTimeMs, 350)
  assert.equal(evaluacion.details.fastestResponseTimeMs, 100)
  assert.equal(evaluacion.averageResponseTimeMs, 350)
})

test("La validación rechaza ensayos incompletos o repetidos, opciones inválidas y tiempos inconsistentes", () => {
  for (const tipo of tiposVelocidad) {
    const instancia = generarVelocidad(tipo, "easy"),
      entrada = perfecto(instancia)
    for (const respuestas of [
      [],
      entrada.answers.slice(1),
      entrada.answers.map(() => entrada.answers[0]),
      [null, ...entrada.answers.slice(1)],
    ])
      assert.throws(() =>
        evaluarVelocidad(instancia, { ...entrada, answers: respuestas }),
      )
    for (const respuestaTiempoMs of [
      -1,
      0,
      Infinity,
      NaN,
      "300",
      instancia.config.timeoutMs + 1,
    ])
      assert.throws(() =>
        evaluarVelocidad(instancia, {
          ...entrada,
          answers: [
            { ...entrada.answers[0], responseTimeMs: respuestaTiempoMs },
            ...entrada.answers.slice(1),
          ],
        }),
      )
    for (const estado of ["skipped", null, "falseStart"]) {
      if (tipo === "visualReaction" && estado === "falseStart") continue
      assert.throws(() =>
        evaluarVelocidad(instancia, {
          ...entrada,
          answers: [
            { ...entrada.answers[0], status: estado },
            ...entrada.answers.slice(1),
          ],
        }),
      )
    }
    assert.throws(() =>
      evaluarVelocidad(instancia, {
        ...entrada,
        actualResponseTimeSeconds: -1,
      }),
    )
    assert.throws(() =>
      evaluarVelocidad(instancia, {
        ...entrada,
        actualResponseTimeSeconds: Infinity,
      }),
    )
    assert.throws(() =>
      evaluarVelocidad(instancia, {
        ...entrada,
        answers: [
          { ...entrada.answers[0], submittedAnswer: "invalid" },
          ...entrada.answers.slice(1),
        ],
      }),
    )
  }
})

test("El reloj monotónico conserva fracciones y excluye esperas, pausas, retroalimentación y transiciones", () => {
  const reloj = new ActivoTiempo()
  assert.equal(reloj.read(3500), 0)
  reloj.resume(3500)
  assert.equal(reloj.read(3600.25), 100.25)
  reloj.pause(3650.5)
  assert.equal(reloj.read(9000), 150.5)
  reloj.resume(10000)
  assert.equal(reloj.pause(10125.25), 275.75)
  assert.equal(reloj.read(50000), 275.75)
  reloj.reset()
  assert.equal(reloj.read(60000), 0)
})

test("Velocidad asciende entre juegos, cambia configuración y respeta límites al descender", () => {
  let estado = {
    currentLevel: "easy" as Nivel,
    promotionStreak: 0,
    demotionStreak: 0,
  }
  for (const tipo of ["quickResponse", "touchColor"] as const) {
    const ejercicio = obtenerEjercicioEstrategia(tipo).generateExercise(
      estado.currentLevel,
    )
    estado = prepararSesionResultado(
      ejercicio,
      estado,
      perfecto(ejercicio.payload as VelocidadInstancia),
    ).nextProgress
    if (tipo === "quickResponse") {
      assert.equal(estado.currentLevel, "easy")
      assert.equal(estado.promotionStreak, 1)
    }
  }
  assert.equal(estado.currentLevel, "normal")
  assert.equal(estado.promotionStreak, 0)
  assert.deepEqual(
    (obtenerEjercicioEstrategia("quickClassification").generateExercise(
      estado.currentLevel,
    ).payload as VelocidadInstancia).config,
    velocidadConfiguraciones.quickClassification.normal,
  )
  const ejercicio =
      obtenerEjercicioEstrategia("touchColor").generateExercise("normal"),
    instancia = ejercicio.payload as VelocidadInstancia,
    entrada = perfecto(instancia)
  for (let indice = 0; indice < 3; indice++)
    entrada.answers[indice].submittedAnswer = instancia.trials[
      indice
    ].options.find(
      (opcion) => opcion !== instancia.trials[indice].expectedAnswer,
    )!
  const neutro = prepararSesionResultado(
    ejercicio,
    { ...estado, promotionStreak: 1 },
    entrada,
  )
  assert.equal(neutro.nextProgress.promotionStreak, 0)
  assert.equal(neutro.nextProgress.currentLevel, "normal")
  for (let intento = 0; intento < 2; intento++) {
    const actual = obtenerEjercicioEstrategia(
        "visualReaction",
      ).generateExercise(estado.currentLevel),
      configuracion = actual.payload as VelocidadInstancia
    estado = prepararSesionResultado(actual, estado, {
      actualResponseTimeSeconds: 0,
      answers: configuracion.trials.map((ensayo) => ({
        trialId: ensayo.id,
        status: "falseStart",
        submittedAnswer: null,
        responseTimeMs: null,
      })),
    }).nextProgress
  }
  assert.equal(estado.currentLevel, "easy")
  const maximo = generarVelocidad("quickResponse", "veryHard")
  assert.equal(
    determinarAjusteDificultad(
      { currentLevel: "veryHard", promotionStreak: 1, demotionStreak: 0 },
      evaluarVelocidad(maximo, perfecto(maximo)),
    ).currentLevel,
    "veryHard",
  )
  assert.throws(() =>
    calcularMetricasRendimiento(
      {
        correctAnswers: 1,
        errors: 0,
        totalQuestions: 1,
        actualTimeSeconds: 1,
        targetTimeSeconds: 1,
      },
      101,
    ),
  )
})
