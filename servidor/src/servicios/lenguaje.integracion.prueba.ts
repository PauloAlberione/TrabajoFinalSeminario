import test from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { aplicacion } from "../aplicacion"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import type {
  LenguajeInstancia,
  LenguajeRespuesta,
} from "../../../compartido/lenguaje"
import type { InstanciaMemoria } from "../../../compartido/memoria"

test(
  "API real de Lenguaje: cuatro juegos, ascenso entre juegos, aislamiento, cancelación e historial",
  { skip: process.env.RUN_FIREBASE_INTEGRATION !== "1", timeout: 120000 },
  async () => {
    const bd = obtenerFirestoreAdmin()
    const uid = `language-check-${randomUUID()}`
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
      const memoriaInicial = {
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
      await bd.doc(`users/${uid}/progress/memory`).set(memoriaInicial)
      let cantidad = 0
      for (const tipo of [
        "wordAssociation",
        "completeSentence",
        "synonymsAntonyms",
        "simpleCrossword",
      ] as const) {
        const iniciar = await solicitar("/api/sessions", { exerciseType: tipo })
        assert.equal(iniciar.status, 201)
        const { id, exercise: ejercicio } = iniciar.body as {
          id: string
          exercise: {
            id: string
            payload: LenguajeInstancia
          }
        }
        const instancia = ejercicio.payload
        assert.equal(instancia.level, cantidad < 2 ? "easy" : "normal")
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
        const respuesta: LenguajeRespuesta = {
          actualResponseTimeSeconds: instancia.config.questionCount * 2,
          answers: instancia.questions.map((pregunta) => ({
            questionId: pregunta.id,
            answer: pregunta.answer,
            responseTimeSeconds: 2,
          })),
          words:
            instancia.puzzle?.words.map((palabra) => ({
              wordId: palabra.id,
              attempts: [palabra.answer],
            })) ?? [],
        }
        const contenido = {
          sessionId: id,
          exerciseId: ejercicio.id,
          exerciseType: tipo,
          cognitiveFunctionId: "language",
          response: respuesta,
        }
        assert.equal(
          (
            await solicitar("/api/results", {
              ...contenido,
              cognitiveFunctionId: "memory",
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
        const progreso = await solicitar("/api/progress/language")
        assert.equal(progreso.body.totalExercises, cantidad)
        if (cantidad === 1) assert.equal(progreso.body.promotionStreak, 1)
        if (cantidad === 2) assert.equal(progreso.body.currentLevel, "normal")
        const memoria = (
          await bd.doc(`users/${uid}/progress/memory`).get()
        ).data()
        assert.deepEqual(memoria, memoriaInicial)
        const historial = await solicitar("/api/results")
        assert.equal(historial.status, 200)
        assert.equal(historial.body.length, cantidad)
        assert.ok(
          historial.body.some(
            (
              elemento: Record<"exerciseType" | "cognitiveFunctionId", string>,
            ) =>
              elemento.exerciseType === tipo &&
              elemento.cognitiveFunctionId === "language",
          ),
        )
        assert.equal(
          (await bd.collection(`users/${uid}/sessions/${id}/results`).get())
            .size,
          1,
        )
      }
      const lenguajeAntes = (
        await bd.doc(`users/${uid}/progress/language`).get()
      ).data()
      const cancelar = await solicitar("/api/sessions", {
        exerciseType: "simpleCrossword",
      })
      const cancelarId = cancelar.body.id as string
      for (const estado of ["active", "paused", "cancelled"])
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
      assert.deepEqual(
        (await bd.doc(`users/${uid}/progress/language`).get()).data(),
        lenguajeAntes,
      )
      assert.equal((await solicitar("/api/results")).body.length, 4)
      assert.equal(
        (
          await bd
            .collection(`users/${uid}/sessions/${cancelarId}/results`)
            .get()
        ).size,
        0,
      )
      const memoriaSesion = await solicitar("/api/sessions", {
        exerciseType: "imagePairs",
      })
      assert.equal(memoriaSesion.body.exercise.payload.level, "hard")
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
      assert.equal(
        (await bd.doc(`users/${uid}/progress/memory`).get()).data()!
          .currentLevel,
        "veryHard",
      )
      assert.deepEqual(
        (await bd.doc(`users/${uid}/progress/language`).get()).data(),
        lenguajeAntes,
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
