import test from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { aplicacion } from "../aplicacion"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import {
  visualClave,
  type AtencionInstancia,
} from "../../../compartido/atencionReconocimiento"
import type { InstanciaMemoria } from "../../../compartido/memoria"
import type { LenguajeInstancia } from "../../../compartido/lenguaje"
import type { CalculoInstancia } from "../../../compartido/calculo"

test(
  "API real de Atención: cuatro juegos, aislamiento, ascenso entre juegos, reintento atómico y cancelación",
  { skip: process.env.RUN_FIREBASE_INTEGRATION !== "1", timeout: 120000 },
  async () => {
    const bd = obtenerFirestoreAdmin(),
      uid = `attention-check-${randomUUID()}`
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
      const otros = ["memory", "language", "calculation"] as const
      const inicial = Object.fromEntries(
        otros.map((idFuncionCognitiva, indice) => [
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
      for (const categoria of otros)
        await bd
          .doc(`users/${uid}/progress/${categoria}`)
          .set(inicial[categoria])
      assert.equal(
        (await solicitar("/api/progress/attentionRecognition")).body
          .currentLevel,
        "easy",
      )
      let cantidad = 0
      for (const tipo of [
        "identifyElements",
        "recognizePattern",
        "hiddenFigure",
        "followObject",
      ] as const) {
        const iniciar = await solicitar("/api/sessions", { exerciseType: tipo })
        assert.equal(iniciar.status, 201)
        const { id, exercise: ejercicio } = iniciar.body as {
          id: string
          exercise: {
            id: string
            payload: AtencionInstancia
          }
        }
        const instancia = ejercicio.payload
        assert.equal(instancia.level, cantidad < 2 ? "easy" : "normal")
        if (tipo === "hiddenFigure")
          assert.equal(instancia.config.elementCount, 18)
        const respuesta = {
          actualResponseTimeSeconds: instancia.rounds.length,
          answers: instancia.rounds.map((ronda) => ({
            roundId: ronda.id,
            responseTimeSeconds: 1,
            selection:
              "objects" in ronda
                ? ronda.targetId
                : "correctAnswer" in ronda
                  ? visualClave(ronda.correctAnswer)
                  : tipo === "hiddenFigure"
                    ? [ronda.targetIndices[0]]
                    : ronda.targetIndices,
          })),
        }
        const contenido = {
          sessionId: id,
          exerciseId: ejercicio.id,
          exerciseType: tipo,
          cognitiveFunctionId: "attentionRecognition",
          response: respuesta,
        }
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
        for (const idFuncionCognitiva of otros)
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
        const [primero, reintentar] = await Promise.all([
          solicitar("/api/results", contenido),
          solicitar("/api/results", contenido),
        ])
        assert.equal(primero.status, 201)
        assert.equal(reintentar.status, 201)
        assert.deepEqual(primero.body, reintentar.body)
        assert.equal(primero.body.accuracy, 100)
        cantidad++
        const progreso = (await solicitar("/api/progress/attentionRecognition"))
          .body
        assert.equal(progreso.totalExercises, cantidad)
        if (cantidad === 1) assert.equal(progreso.promotionStreak, 1)
        if (cantidad === 2) assert.equal(progreso.currentLevel, "normal")
        for (const categoria of otros)
          assert.deepEqual(
            (await bd.doc(`users/${uid}/progress/${categoria}`).get()).data(),
            inicial[categoria],
          )
        assert.equal(
          (await bd.collection(`users/${uid}/sessions/${id}/results`).get())
            .size,
          1,
        )
        const registro = (
          await bd.doc(`users/${uid}/sessions/${id}/results/completed`).get()
        ).data()!
        assert.equal(registro.details.exerciseType, tipo)
        assert.ok(registro.startedAt)
        assert.ok(registro.completedAt)
        assert.equal((await solicitar("/api/results")).body.length, cantidad)
      }
      const antes = (
        await bd.doc(`users/${uid}/progress/attentionRecognition`).get()
      ).data()
      const cancelado = await solicitar("/api/sessions", {
        exerciseType: "followObject",
      })
      for (const estado of [
        "active",
        "paused",
        "active",
        "paused",
        "cancelled",
      ])
        assert.equal(
          (
            await solicitar(
              `/api/sessions/${cancelado.body.id}`,
              { status: estado },
              "PATCH",
            )
          ).status,
          200,
        )
      assert.equal(
        (
          await bd.doc(`users/${uid}/sessions/${cancelado.body.id}`).get()
        ).data()!.status,
        "cancelled",
      )
      assert.equal(
        (
          await bd
            .collection(`users/${uid}/sessions/${cancelado.body.id}/results`)
            .get()
        ).size,
        0,
      )
      assert.deepEqual(
        (
          await bd.doc(`users/${uid}/progress/attentionRecognition`).get()
        ).data(),
        antes,
      )
      assert.equal((await solicitar("/api/results")).body.length, 4)
      for (const [ejercicioTipo, idFuncionCognitiva] of [
        ["imagePairs", "memory"],
        ["wordAssociation", "language"],
        ["mentalCalculation", "calculation"],
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
        } else {
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
          (
            await bd.doc(`users/${uid}/progress/attentionRecognition`).get()
          ).data(),
          antes,
        )
      }
      assert.equal(
        (await fetch(`${base}/api/progress/attentionRecognition`)).status,
        401,
      )
    } finally {
      await bd.recursiveDelete(bd.doc(`users/${uid}`))
      if (creado) await getAuth().deleteUser(uid)
      await new Promise<void>((resolver, rechazar) =>
        servidor.close((error) => (error ? rechazar(error) : resolver())),
      )
    }
  },
)
