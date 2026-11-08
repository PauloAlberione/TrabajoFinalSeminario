import test from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { aplicacion } from "../aplicacion"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import type { InstanciaMemoria } from "../../../compartido/memoria"

const habilitado = process.env.RUN_FIREBASE_INTEGRATION === "1"

test(
  "API autenticada real: cuatro juegos de Memoria, progreso atómico, idempotencia e historial",
  { skip: !habilitado, timeout: 120000 },
  async () => {
    const bd = obtenerFirestoreAdmin()
    const idUsuario = `memory-check-${randomUUID()}`
    const servidor = aplicacion.listen(0, "127.0.0.1")
    await new Promise<void>((resolver) => servidor.once("listening", resolver))
    const direccion = servidor.address()
    assert.ok(direccion && typeof direccion !== "string")
    const base = `http://127.0.0.1:${direccion.port}`
    let usuarioCreado = false
    try {
      assert.ok(
        process.env.VITE_FIREBASE_API_KEY,
        "Firebase web API key is required",
      )
      const correo = `${idUsuario}@example.com`
      const contrasena = "Aa" + randomUUID() + randomUUID()
      await getAuth().createUser({
        uid: idUsuario,
        email: correo,
        password: contrasena,
      })
      usuarioCreado = true
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
      const autenticacion = (await ingreso.json()) as {
        idToken?: string
      }
      assert.equal(
        ingreso.status,
        200,
        "Firebase email/password sign-in failed",
      )
      assert.ok(autenticacion.idToken)
      usuarioCreado = true
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
      assert.equal(
        (
          await fetch(`${base}/api/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          })
        ).status,
        401,
      )
      assert.equal(
        (await solicitar("/api/sessions", { exerciseType: "missing" })).status,
        400,
      )
      let cantidad = 0
      for (const tipo of [
        "imagePairs",
        "colorSequence",
        "wordList",
        "rememberOrder",
      ] as const) {
        const iniciar = await solicitar("/api/sessions", { exerciseType: tipo })
        assert.equal(iniciar.status, 201)
        const { id, exercise: ejercicio } = iniciar.body as {
          id: string
          exercise: {
            id: string
            payload: InstanciaMemoria
          }
        }
        const instancia = ejercicio.payload
        assert.equal(instancia.level, cantidad < 2 ? "easy" : "normal")
        if (tipo === "wordList") assert.equal(instancia.config.size, 5)
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
        assert.equal(
          (
            await solicitar(
              `/api/sessions/${id}`,
              { status: "paused" },
              "PATCH",
            )
          ).status,
          200,
        )
        const respuestas =
          tipo === "imagePairs"
            ? instancia.rounds[0].target.map((elemento) =>
                instancia.rounds[0].options.flatMap((valor, indice) =>
                  valor === elemento ? [String(indice)] : [],
                ),
              )
            : instancia.rounds.map((ronda) => ronda.target)
        const contenido = {
          sessionId: id,
          exerciseId: ejercicio.id,
          exerciseType: tipo,
          cognitiveFunctionId: "memory",
          response: { answers: respuestas, actualResponseTimeSeconds: 10 },
        }
        assert.equal(
          (await solicitar("/api/results", contenido)).status,
          400,
          "paused submission must fail",
        )
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
        const [primero, reintentar] = await Promise.all([
          solicitar("/api/results", contenido),
          solicitar("/api/results", contenido),
        ])
        assert.equal(primero.status, 201)
        assert.equal(reintentar.status, 201)
        assert.deepEqual(primero.body, reintentar.body)
        assert.equal(primero.body.accuracy, 100)
        cantidad++
        const progreso = await solicitar("/api/progress/memory")
        assert.equal(progreso.status, 200)
        assert.equal(progreso.body.totalExercises, cantidad)
        if (cantidad === 1) assert.equal(progreso.body.promotionStreak, 1)
        if (cantidad === 2) {
          assert.equal(progreso.body.currentLevel, "normal")
          assert.equal(progreso.body.promotionStreak, 0)
        }
        assert.equal(
          (await bd.doc(`users/${idUsuario}/sessions/${id}`).get()).data()!
            .status,
          "completed",
        )
        assert.equal(
          (
            await bd
              .collection(`users/${idUsuario}/sessions/${id}/results`)
              .get()
          ).size,
          1,
        )
        const historial = await solicitar("/api/results")
        assert.equal(historial.status, 200)
        assert.equal(historial.body.length, cantidad)
        assert.ok(
          historial.body.some(
            (elemento: Record<"exerciseType" | "createdAt", string>) =>
              elemento.exerciseType === tipo &&
              Number.isFinite(Date.parse(elemento.createdAt)),
          ),
        )
        assert.equal(
          (
            await solicitar("/api/results", {
              ...contenido,
              sessionId: "another-users-session",
            })
          ).status,
          400,
        )
      }
      const cancelacion = await solicitar("/api/sessions", {
        exerciseType: "imagePairs",
      })
      assert.equal(cancelacion.status, 201)
      const canceladoId = cancelacion.body.id as string
      assert.equal(
        (
          await solicitar(
            `/api/sessions/${canceladoId}`,
            { status: "active" },
            "PATCH",
          )
        ).status,
        200,
      )
      assert.equal(
        (
          await solicitar(
            `/api/sessions/${canceladoId}`,
            { status: "paused" },
            "PATCH",
          )
        ).status,
        200,
      )
      assert.equal(
        (
          await solicitar(
            `/api/sessions/${canceladoId}`,
            { status: "cancelled" },
            "PATCH",
          )
        ).status,
        200,
      )
      assert.equal(
        (
          await solicitar(
            `/api/sessions/${canceladoId}`,
            { status: "cancelled" },
            "PATCH",
          )
        ).status,
        200,
      )
      assert.equal(
        (
          await solicitar(
            `/api/sessions/${canceladoId}`,
            { status: "active" },
            "PATCH",
          )
        ).status,
        400,
      )
      const cancelado = (
        await bd.doc(`users/${idUsuario}/sessions/${canceladoId}`).get()
      ).data()!
      assert.equal(cancelado.status, "cancelled")
      assert.ok(cancelado.endedAt)
      const canceladoInstancia = cancelacion.body.exercise
        .payload as InstanciaMemoria
      const canceladoRespuestas = canceladoInstancia.rounds[0].target.map(
        (elemento) =>
          canceladoInstancia.rounds[0].options.flatMap((valor, indice) =>
            valor === elemento ? [String(indice)] : [],
          ),
      )
      assert.equal(
        (
          await solicitar("/api/results", {
            sessionId: canceladoId,
            exerciseId: cancelacion.body.exercise.id,
            exerciseType: "imagePairs",
            cognitiveFunctionId: "memory",
            response: {
              answers: canceladoRespuestas,
              actualResponseTimeSeconds: 10,
            },
          })
        ).status,
        400,
      )
      assert.equal(
        (await solicitar("/api/progress/memory")).body.totalExercises,
        4,
      )
      assert.equal((await solicitar("/api/results")).body.length, 4)
      assert.equal(
        (
          await bd
            .collection(`users/${idUsuario}/sessions/${canceladoId}/results`)
            .get()
        ).size,
        0,
      )
    } finally {
      await bd.recursiveDelete(bd.doc(`users/${idUsuario}`))
      if (usuarioCreado) await getAuth().deleteUser(idUsuario)
      await new Promise<void>((resolver, rechazar) =>
        servidor.close((error) => (error ? rechazar(error) : resolver())),
      )
    }
  },
)
