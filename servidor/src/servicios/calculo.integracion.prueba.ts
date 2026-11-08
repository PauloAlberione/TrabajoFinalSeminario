import test from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { aplicacion } from "../aplicacion"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import type {
  CalculoInstancia,
  EntregaCalculo,
} from "../../../compartido/calculo"
import type { InstanciaMemoria } from "../../../compartido/memoria"
import type { LenguajeInstancia } from "../../../compartido/lenguaje"

test(
  "API real de Cálculo: cuatro juegos, adaptación compartida, aislamiento, propiedad, reintento y cancelación",
  { skip: process.env.RUN_FIREBASE_INTEGRATION !== "1", timeout: 120000 },
  async () => {
    const bd = obtenerFirestoreAdmin(),
      uid = `calculation-check-${randomUUID()}`
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
        const respuesta = await fetch(`${base}${ruta}`, {
          method: metodo,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${autenticacion.idToken}`,
          },
          ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
        })
        return { status: respuesta.status, body: await respuesta.json() }
      }
      const memoria = {
        cognitiveFunctionId: "memory",
        currentLevel: "hard",
        promotionStreak: 1,
        demotionStreak: 0,
        totalExercises: 0,
        totalSessions: 0,
        averageAccuracy: 0,
        averageTime: 0,
        lastPerformanceScore: 0,
      }
      const lenguaje = {
        ...memoria,
        cognitiveFunctionId: "language",
        currentLevel: "normal",
      }
      await bd.doc(`users/${uid}/progress/memory`).set(memoria)
      await bd.doc(`users/${uid}/progress/language`).set(lenguaje)
      assert.equal(
        (await solicitar("/api/progress/calculation")).body.currentLevel,
        "easy",
      )
      let cantidad = 0
      for (const tipo of [
        "mentalCalculation",
        "numberSequence",
        "orderNumbers",
        "subtractionDifference",
      ] as const) {
        const iniciar = await solicitar("/api/sessions", { exerciseType: tipo })
        assert.equal(iniciar.status, 201)
        const { id, exercise: ejercicio } = iniciar.body as {
          id: string
          exercise: {
            id: string
            payload: CalculoInstancia
          }
        }
        const instancia = ejercicio.payload
        assert.equal(instancia.level, cantidad < 2 ? "easy" : "normal")
        if (instancia.type === "orderNumbers")
          assert.equal(instancia.config.numbersPerRound, 5)
        const respuesta: EntregaCalculo = {
          actualResponseTimeSeconds: instancia.questions.length * 2,
          answers: instancia.questions.map((pregunta) => ({
            questionId: pregunta.id,
            answer:
              "expected" in pregunta ? pregunta.expected : pregunta.answer,
            responseTimeSeconds: 2,
          })),
        }
        const contenido = {
          sessionId: id,
          exerciseId: ejercicio.id,
          exerciseType: tipo,
          cognitiveFunctionId: "calculation",
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
        for (const invalidoCategoria of ["memory", "language"])
          assert.equal(
            (
              await solicitar("/api/results", {
                ...contenido,
                cognitiveFunctionId: invalidoCategoria,
              })
            ).status,
            400,
          )
        assert.equal(
          (
            await solicitar("/api/results", {
              ...contenido,
              sessionId: randomUUID(),
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
        const [primero, duplicado] = await Promise.all([
          solicitar("/api/results", contenido),
          solicitar("/api/results", contenido),
        ])
        assert.equal(primero.status, 201)
        assert.equal(duplicado.status, 201)
        assert.deepEqual(primero.body, duplicado.body)
        assert.equal(primero.body.accuracy, 100)
        assert.equal(primero.body.details.exerciseType, tipo)
        cantidad++
        const progreso = (await solicitar("/api/progress/calculation")).body
        assert.equal(progreso.totalExercises, cantidad)
        if (cantidad === 1) assert.equal(progreso.promotionStreak, 1)
        if (cantidad === 2) {
          assert.equal(progreso.currentLevel, "normal")
          assert.equal(progreso.promotionStreak, 0)
        }
        assert.deepEqual(
          (await bd.doc(`users/${uid}/progress/memory`).get()).data(),
          memoria,
        )
        assert.deepEqual(
          (await bd.doc(`users/${uid}/progress/language`).get()).data(),
          lenguaje,
        )
        const guardado = (
          await bd.doc(`users/${uid}/sessions/${id}/results/completed`).get()
        ).data()!
        assert.equal(guardado.cognitiveFunctionId, "calculation")
        assert.equal(guardado.exerciseType, tipo)
        assert.ok(guardado.startedAt)
        assert.ok(guardado.completedAt)
        assert.equal(
          guardado.targetTimeSeconds,
          instancia.config.targetTimeSeconds,
        )
        assert.equal(
          (await bd.collection(`users/${uid}/sessions/${id}/results`).get())
            .size,
          1,
        )
        assert.equal((await solicitar("/api/results")).body.length, cantidad)
      }
      const calculoAntes = (
        await bd.doc(`users/${uid}/progress/calculation`).get()
      ).data()
      const cancelado = await solicitar("/api/sessions", {
          exerciseType: "orderNumbers",
        }),
        cancelarId = cancelado.body.id as string
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
              `/api/sessions/${cancelarId}`,
              { status: estado },
              "PATCH",
            )
          ).status,
          200,
        )
      assert.equal(
        (await bd.doc(`users/${uid}/sessions/${cancelarId}`).get()).data()!
          .status,
        "cancelled",
      )
      assert.equal(
        (
          await bd
            .collection(`users/${uid}/sessions/${cancelarId}/results`)
            .get()
        ).size,
        0,
      )
      const cancelarInstancia = cancelado.body.exercise
        .payload as CalculoInstancia
      assert.equal(
        (
          await solicitar("/api/results", {
            sessionId: cancelarId,
            exerciseId: "orderNumbers",
            exerciseType: "orderNumbers",
            cognitiveFunctionId: "calculation",
            response: {
              actualResponseTimeSeconds: 10,
              answers: cancelarInstancia.questions.map((pregunta) => ({
                questionId: pregunta.id,
                answer:
                  "expected" in pregunta ? pregunta.expected : pregunta.answer,
                responseTimeSeconds: 10 / cancelarInstancia.questions.length,
              })),
            },
          })
        ).status,
        400,
      )
      assert.deepEqual(
        (await bd.doc(`users/${uid}/progress/calculation`).get()).data(),
        calculoAntes,
      )
      assert.equal((await solicitar("/api/results")).body.length, 4)
      const memoriaSesion = await solicitar("/api/sessions", {
        exerciseType: "imagePairs",
      })
      const memoriaInstancia = memoriaSesion.body.exercise
        .payload as InstanciaMemoria
      await solicitar(
        `/api/sessions/${memoriaSesion.body.id}`,
        { status: "active" },
        "PATCH",
      )
      const memoriaRespuesta = {
        answers: memoriaInstancia.rounds[0].target.map((elemento) =>
          memoriaInstancia.rounds[0].options.flatMap((valor, indice) =>
            valor === elemento ? [String(indice)] : [],
          ),
        ),
        actualResponseTimeSeconds: 10,
      }
      assert.equal(
        (
          await solicitar("/api/results", {
            sessionId: memoriaSesion.body.id,
            exerciseId: "imagePairs",
            exerciseType: "imagePairs",
            cognitiveFunctionId: "memory",
            response: memoriaRespuesta,
          })
        ).status,
        201,
      )
      const lenguajeSesion = await solicitar("/api/sessions", {
        exerciseType: "wordAssociation",
      })
      const lenguajeInstancia = lenguajeSesion.body.exercise
        .payload as LenguajeInstancia
      await solicitar(
        `/api/sessions/${lenguajeSesion.body.id}`,
        { status: "active" },
        "PATCH",
      )
      assert.equal(
        (
          await solicitar("/api/results", {
            sessionId: lenguajeSesion.body.id,
            exerciseId: "wordAssociation",
            exerciseType: "wordAssociation",
            cognitiveFunctionId: "language",
            response: {
              actualResponseTimeSeconds: lenguajeInstancia.questions.length,
              answers: lenguajeInstancia.questions.map((pregunta) => ({
                questionId: pregunta.id,
                answer: pregunta.answer,
                responseTimeSeconds: 1,
              })),
              words: [],
            },
          })
        ).status,
        201,
      )
      assert.equal(
        (await bd.doc(`users/${uid}/progress/memory`).get()).data()!
          .currentLevel,
        "veryHard",
      )
      assert.equal(
        (await bd.doc(`users/${uid}/progress/language`).get()).data()!
          .currentLevel,
        "hard",
      )
      assert.deepEqual(
        (await bd.doc(`users/${uid}/progress/calculation`).get()).data(),
        calculoAntes,
      )
      assert.equal(
        (await fetch(`${base}/api/progress/calculation`)).status,
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
