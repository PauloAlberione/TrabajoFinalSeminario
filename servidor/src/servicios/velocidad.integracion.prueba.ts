import test from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { aplicacion } from "../aplicacion"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import {
  type VelocidadInstancia,
  type EntregaVelocidad,
} from "../../../compartido/velocidad"
import { type AtencionInstancia } from "../../../compartido/atencionReconocimiento"
import type { InstanciaMemoria } from "../../../compartido/memoria"
import type { LenguajeInstancia } from "../../../compartido/lenguaje"
import type { CalculoInstancia } from "../../../compartido/calculo"

test(
  "API real de Velocidad: juegos, rachas, persistencia atómica, tiempos, historial y aislamiento",
  { skip: process.env.RUN_FIREBASE_INTEGRATION !== "1", timeout: 120000 },
  async () => {
    const bd = obtenerFirestoreAdmin(),
      uid = `speed-check-${randomUUID()}`,
      ajenoUid = `speed-foreign-${randomUUID()}`
    const servidor = aplicacion.listen(0, "127.0.0.1")
    await new Promise<void>((resolver) => servidor.once("listening", resolver))
    const direccion = servidor.address()
    assert.ok(direccion && typeof direccion !== "string")
    const base = `http://127.0.0.1:${direccion.port}`
    let creado = false
    try {
      const correo = `${uid}@example.com`,
        contrasena = "Aa" + randomUUID() + randomUUID()
      await getAuth().createUser({ uid, email: correo, password: contrasena })
      creado = true
      const ingreso = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.VITE_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: correo,
            password: contrasena,
            returnSecureToken: true,
          }),
        },
      )
      assert.equal(ingreso.status, 200)
      const autenticacion = (await ingreso.json()) as {
        idToken: string
      }
      async function solicitar(
        ruta: string,
        cuerpo?: object,
        metodo = cuerpo ? "POST" : "GET",
      ) {
        const resultado = await fetch(`${base}${ruta}`, {
          method: metodo,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${autenticacion.idToken}`,
          },
          ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
        })
        return { status: resultado.status, body: await resultado.json() }
      }
      const categorias = [
        "memory",
        "language",
        "calculation",
        "attentionRecognition",
      ] as const
      const inicial = Object.fromEntries(
        categorias.map((idFuncionCognitiva, indice) => [
          idFuncionCognitiva,
          {
            cognitiveFunctionId: idFuncionCognitiva,
            currentLevel: indice === 0 ? "hard" : "normal",
            promotionStreak: 1,
            demotionStreak: 0,
            totalExercises: 0,
            totalSessions: 0,
            averageAccuracy: 0,
            averageTime: 0,
            lastPerformanceScore: 0,
          },
        ]),
      )
      for (const categoria of categorias)
        await bd
          .doc(`users/${uid}/progress/${categoria}`)
          .set(inicial[categoria])
      assert.equal(
        (await solicitar("/api/progress/speed")).body.currentLevel,
        "easy",
      )
      assert.ok(
        (await solicitar("/api/progress")).body.some(
          (elemento: { cognitiveFunctionId: string }) =>
            elemento.cognitiveFunctionId === "speed",
        ),
      )
      let cantidad = 0
      for (const tipo of [
        "quickResponse",
        "touchColor",
        "quickClassification",
        "visualReaction",
      ] as const) {
        const iniciar = await solicitar("/api/sessions", { exerciseType: tipo })
        assert.equal(iniciar.status, 201)
        const { id, exercise: ejercicio } = iniciar.body as {
          id: string
          exercise: {
            id: string
            payload: VelocidadInstancia
          }
        }
        const instancia = ejercicio.payload
        assert.equal(instancia.level, cantidad < 2 ? "easy" : "normal")
        const respuesta: EntregaVelocidad = {
          actualResponseTimeSeconds: instancia.trials.length / 2,
          answers: instancia.trials.map((ensayo) => ({
            trialId: ensayo.id,
            status: "answered",
            submittedAnswer: ensayo.expectedAnswer,
            responseTimeMs: 500,
          })),
        }
        if (tipo === "visualReaction") {
          respuesta.answers[0] = {
            trialId: instancia.trials[0].id,
            status: "falseStart",
            submittedAnswer: null,
            responseTimeMs: null,
          }
          respuesta.answers[1] = {
            trialId: instancia.trials[1].id,
            status: "timeout",
            submittedAnswer: null,
            responseTimeMs: instancia.config.timeoutMs,
          }
          respuesta.actualResponseTimeSeconds =
            (instancia.trials.length - 2) / 2 +
            instancia.config.timeoutMs / 1000
        }
        const contenido = {
          sessionId: id,
          exerciseId: ejercicio.id,
          exerciseType: tipo,
          cognitiveFunctionId: "speed",
          response: respuesta,
        }
        assert.equal((await solicitar("/api/results", contenido)).status, 400)
        assert.equal(
          (
            await solicitar(
              `/api/sessions/${id}`,
              { status: "active" },
              "PATCH",
            )
          ).status,
          200,
        )
        for (const idFuncionCognitiva of categorias)
          assert.equal(
            (
              await solicitar("/api/results", {
                ...contenido,
                cognitiveFunctionId: idFuncionCognitiva,
              })
            ).status,
            400,
          )
        assert.equal(
          (
            await solicitar("/api/results", {
              ...contenido,
              response: { ...respuesta, answers: [] },
            })
          ).status,
          400,
        )
        await bd
          .doc(`users/${ajenoUid}/sessions/${id}-foreign`)
          .set({ status: "active", exercise: ejercicio })
        assert.equal(
          (
            await solicitar("/api/results", {
              ...contenido,
              sessionId: `${id}-foreign`,
              userId: ajenoUid,
            })
          ).status,
          400,
        )
        const [primero, reintentar] = await Promise.all([
          solicitar("/api/results", contenido),
          solicitar("/api/results", contenido),
        ])
        assert.equal(primero.status, 201)
        assert.equal(reintentar.status, 201)
        assert.deepEqual(primero.body, reintentar.body)
        assert.equal(
          primero.body.accuracy,
          tipo === "visualReaction" ? 75 : 100,
        )
        cantidad++
        const progreso = (await solicitar("/api/progress/speed")).body
        assert.equal(progreso.totalExercises, cantidad)
        if (cantidad === 1) {
          assert.equal(progreso.promotionStreak, 1)
          assert.equal(progreso.currentLevel, "easy")
        }
        if (cantidad === 2) assert.equal(progreso.currentLevel, "normal")
        for (const categoria of categorias)
          assert.deepEqual(
            (await bd.doc(`users/${uid}/progress/${categoria}`).get()).data(),
            inicial[categoria],
          )
        const registro = (
          await bd.doc(`users/${uid}/sessions/${id}/results/completed`).get()
        ).data()!
        assert.equal(registro.cognitiveFunctionId, "speed")
        assert.equal(registro.sessionId, id)
        assert.equal(registro.userId, uid)
        assert.equal(registro.totalTrials, instancia.trials.length)
        assert.equal(registro.trialResults.length, instancia.trials.length)
        assert.ok(registro.startedAt)
        assert.ok(registro.completedAt)
        assert.equal(registro.averageResponseTimeMs, 500)
        if (tipo === "visualReaction") {
          assert.equal(registro.falseStarts, 1)
          assert.equal(registro.timeouts, 1)
          assert.equal(registro.timeEfficiency, 75)
          assert.equal(registro.details.medianResponseTimeMs, 500)
        }
        assert.equal(
          (await bd.collection(`users/${uid}/sessions/${id}/results`).get())
            .size,
          1,
        )
        assert.equal((await solicitar("/api/results")).body.length, cantidad)
      }
      const antes = (await bd.doc(`users/${uid}/progress/speed`).get()).data()
      const cancelar = await solicitar("/api/sessions", {
        exerciseType: "visualReaction",
      })
      for (const estado of ["active", "paused", "active", "cancelled"])
        assert.equal(
          (
            await solicitar(
              `/api/sessions/${cancelar.body.id}`,
              { status: estado },
              "PATCH",
            )
          ).status,
          200,
        )
      assert.equal(
        (
          await bd.doc(`users/${uid}/sessions/${cancelar.body.id}`).get()
        ).data()!.status,
        "cancelled",
      )
      assert.equal(
        (
          await bd
            .collection(`users/${uid}/sessions/${cancelar.body.id}/results`)
            .get()
        ).size,
        0,
      )
      assert.deepEqual(
        (await bd.doc(`users/${uid}/progress/speed`).get()).data(),
        antes,
      )
      for (const [ejercicioTipo, idFuncionCognitiva] of [
        ["imagePairs", "memory"],
        ["wordAssociation", "language"],
        ["mentalCalculation", "calculation"],
        ["identifyElements", "attentionRecognition"],
      ] as const) {
        const siguiente = await solicitar("/api/sessions", {
            exerciseType: ejercicioTipo,
          }),
          sesion = siguiente.body
        await solicitar(
          `/api/sessions/${sesion.id}`,
          { status: "active" },
          "PATCH",
        )
        let respuesta: object
        if (ejercicioTipo === "imagePairs") {
          const instancia = sesion.exercise.payload as InstanciaMemoria
          respuesta = {
            actualResponseTimeSeconds: 10,
            answers: instancia.rounds[0].target.map((elemento) =>
              instancia.rounds[0].options.flatMap((valor, indice) =>
                valor === elemento ? [String(indice)] : [],
              ),
            ),
          }
        } else if (ejercicioTipo === "wordAssociation") {
          const instancia = sesion.exercise.payload as LenguajeInstancia
          respuesta = {
            actualResponseTimeSeconds: instancia.questions.length,
            answers: instancia.questions.map((pregunta) => ({
              questionId: pregunta.id,
              answer: pregunta.answer,
              responseTimeSeconds: 1,
            })),
            words: [],
          }
        } else if (ejercicioTipo === "mentalCalculation") {
          const instancia = sesion.exercise.payload as CalculoInstancia
          respuesta = {
            actualResponseTimeSeconds: instancia.questions.length,
            answers: instancia.questions.map((pregunta) => ({
              questionId: pregunta.id,
              answer:
                "expected" in pregunta ? pregunta.expected : pregunta.answer,
              responseTimeSeconds: 1,
            })),
          }
        } else {
          const instancia = sesion.exercise.payload as AtencionInstancia
          respuesta = {
            actualResponseTimeSeconds: instancia.rounds.length,
            answers: instancia.rounds.map((ronda) => ({
              roundId: ronda.id,
              selection: "targetIndices" in ronda ? ronda.targetIndices : [],
              responseTimeSeconds: 1,
            })),
          }
        }
        assert.equal(
          (
            await solicitar("/api/results", {
              sessionId: sesion.id,
              exerciseId: sesion.exercise.id,
              exerciseType: ejercicioTipo,
              cognitiveFunctionId: idFuncionCognitiva,
              response: respuesta,
            })
          ).status,
          201,
        )
        assert.deepEqual(
          (await bd.doc(`users/${uid}/progress/speed`).get()).data(),
          antes,
        )
      }
      assert.equal((await fetch(`${base}/api/progress/speed`)).status, 401)
    } finally {
      await bd.recursiveDelete(bd.doc(`users/${uid}`))
      await bd.recursiveDelete(bd.doc(`users/${ajenoUid}`))
      if (creado) await getAuth().deleteUser(uid)
      await new Promise<void>((resolver, rechazar) =>
        servidor.close((error) => (error ? rechazar(error) : resolver())),
      )
    }
  },
)
