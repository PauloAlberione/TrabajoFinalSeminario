import test from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { Timestamp } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { aplicacion } from "../aplicacion"
import { obtenerFirestoreAdmin } from "../configuracion/firebaseAdmin"
import { crearPerfil } from "./usuario.servicio"
import type { PaginaHistorial } from "../../../compartido/historial"
import type { InformeEstadisticas } from "../../../compartido/estadisticas"

test(
  "Seguridad real de Firebase: aislamiento, exportaciones, 135 resultados, agregación y tokens revocados",
  { skip: process.env.RUN_FIREBASE_INTEGRATION !== "1", timeout: 120000 },
  async () => {
    const baseDatos = obtenerFirestoreAdmin(),
      autenticacion = getAuth(),
      creado: string[] = []
    const servidor = aplicacion.listen(0, "127.0.0.1")
    await once(servidor, "listening")
    const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`
    async function cuenta() {
      const uid = `security-check-${randomUUID()}`,
        correo = `${uid}@example.com`,
        contrasena = "Aa" + randomUUID() + randomUUID()
      await autenticacion.createUser({
        uid,
        email: correo,
        password: contrasena,
      })
      creado.push(uid)
      await crearPerfil(
        uid,
        { firstName: "Prueba", lastName: "Seguridad" },
        baseDatos,
      )
      const respuesta = await fetch(
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
      const resultado = (await respuesta.json()) as { idToken?: string }
      assert.equal(respuesta.status, 200)
      assert.ok(resultado.idToken)
      return { uid, token: resultado.idToken }
    }
    async function solicitar(
      ruta: string,
      token?: string,
      cuerpo?: object,
      metodo = cuerpo ? "POST" : "GET",
    ) {
      return fetch(`${base}${ruta}`, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
      })
    }
    try {
      assert.ok(process.env.VITE_FIREBASE_API_KEY)
      const propietario = await cuenta(),
        otro = await cuenta()
      const directoLeer = await fetch(
        `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${otro.uid}`,
        { headers: { Authorization: `Bearer ${propietario.token}` } },
      )
      assert.equal(
        directoLeer.status,
        403,
        "Deployed Firestore rules must deny cross-user client access",
      )
      assert.equal((await solicitar("/api/users/me")).status, 401)
      assert.equal(
        (await solicitar("/api/users/me", "invalid-token")).status,
        401,
      )
      assert.equal(
        (
          await solicitar(
            "/api/users/me",
            propietario.token,
            { uid: otro.uid },
            "PATCH",
          )
        ).status,
        400,
      )
      assert.equal(
        (
          await solicitar(
            "/api/users/me",
            propietario.token,
            { email: "other@example.com" },
            "PATCH",
          )
        ).status,
        400,
      )
      assert.equal(
        (
          await solicitar(
            "/api/users/me",
            propietario.token,
            { accessibilityPreferences: { currentLevel: "veryHard" } },
            "PATCH",
          )
        ).status,
        400,
      )
      for (const ruta of [
        "/api/results",
        "/api/statistics",
        "/api/users/me/export",
      ])
        assert.equal(
          (await solicitar(`${ruta}?uid=${otro.uid}`, propietario.token))
            .status,
          400,
        )
      assert.equal(
        (
          await solicitar("/api/users/me/deletion/prepare", propietario.token, {
            confirmed: true,
            uid: otro.uid,
          })
        ).status,
        400,
      )
      const cambioPerfil = await solicitar(
        "/api/users/me",
        propietario.token,
        { countryCode: "CO", avatarTone: "oscuro" },
        "PATCH",
      )
      assert.equal(cambioPerfil.status, 200)
      const perfilGuardado = (
        await baseDatos.doc(`users/${propietario.uid}`).get()
      ).data()!
      assert.equal(perfilGuardado.countryCode, "CO")
      assert.equal(perfilGuardado.timeZone, "America/Bogota")
      assert.equal(perfilGuardado.avatarTone, "oscuro")
      assert.equal(
        (await baseDatos.doc(`users/${otro.uid}`).get()).data()?.countryCode,
        undefined,
      )
      const recargado = await solicitar("/api/users/me", propietario.token)
      assert.equal(
        ((await recargado.json()) as { avatarTone: string }).avatarTone,
        "oscuro",
      )
      const recordatorios = await solicitar(
        "/api/reminders/me",
        propietario.token,
        {
          enabled: false,
          frequency: "daily",
          time: "17:35",
          timeZone: "UTC",
          weekdays: [1],
        },
        "PATCH",
      )
      assert.equal(recordatorios.status, 200)
      assert.equal(
        ((await recordatorios.json()) as { settings: { timeZone: string } })
          .settings.timeZone,
        "America/Bogota",
      )
      const copia = await solicitar("/api/users/me/export", propietario.token)
      assert.equal(copia.status, 200)
      const datosExportados = (await copia.json()) as {
        profile: Record<string, unknown>
      }
      assert.equal(datosExportados.profile.countryCode, "CO")
      assert.equal(datosExportados.profile.timeZone, "America/Bogota")
      assert.equal(datosExportados.profile.avatarTone, "oscuro")
      const iniciado = await solicitar("/api/sessions", otro.token, {
        exerciseType: "quickResponse",
        resumable: true,
      })
      assert.equal(iniciado.status, 201)
      const sesion = (await iniciado.json()) as { id: string }
      assert.equal(
        (await solicitar(`/api/sessions/${sesion.id}`, propietario.token))
          .status,
        404,
      )
      assert.equal(
        (
          await solicitar(
            `/api/results/${sesion.id}/completed`,
            propietario.token,
          )
        ).status,
        404,
      )
      const pdf = await solicitar(
        `/api/results/export/pdf?scope=single&sessionId=${sesion.id}&resultId=completed&timeZone=UTC`,
        propietario.token,
      )
      assert.equal(pdf.status, 404)
      const propioIniciar = await solicitar(
        "/api/sessions",
        propietario.token,
        { exerciseType: "quickResponse", userId: otro.uid },
      )
      assert.equal(propioIniciar.status, 201)
      const propioSesion = (await propioIniciar.json()) as { id: string }
      assert.equal(
        (
          await baseDatos
            .doc(`users/${propietario.uid}/sessions/${propioSesion.id}`)
            .get()
        ).exists,
        true,
      )
      assert.equal(
        (
          await baseDatos
            .doc(`users/${otro.uid}/sessions/${propioSesion.id}`)
            .get()
        ).exists,
        false,
      )
      const lote = baseDatos.batch(),
        registrado = Timestamp.now()
      for (let indice = 0; indice < 135; indice++) {
        const referencia = baseDatos.doc(
          `users/${propietario.uid}/sessions/history-${indice}`,
        )
        lote.set(referencia, { status: "completed", endedAt: registrado })
        lote.set(referencia.collection("results").doc("completed"), {
          userId: propietario.uid,
          exerciseId: "wordList",
          exerciseType: "wordList",
          exerciseName: "Fixture de historial",
          cognitiveFunctionId: "memory",
          difficultyBefore: "easy",
          correctAnswers: 1,
          errors: indice % 2 ? 0 : 1,
          accuracy: indice % 2 ? 100 : 50,
          actualTimeSeconds: 29.9,
          completedAt: registrado,
        })
      }
      for (let indice = 0; indice < 150; indice++)
        lote.set(
          baseDatos.doc(
            `users/${propietario.uid}/sessions/cancelled-${indice}`,
          ),
          { status: "cancelled", endedAt: registrado },
        )
      await lote.commit()
      const vistos = new Set<string>()
      let cursor = "",
        tieneMas = true,
        paginas = 0
      while (tieneMas && paginas < 10) {
        const paginaRespuesta = await solicitar(
          `/api/results?paginated=true&limit=20${
            cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
          }`,
          propietario.token,
        )
        assert.equal(paginaRespuesta.status, 200)
        const pagina = (await paginaRespuesta.json()) as PaginaHistorial
        for (const elemento of pagina.items) {
          assert.equal(vistos.has(elemento.sessionId), false)
          vistos.add(elemento.sessionId)
        }
        tieneMas = pagina.hasMore
        cursor = pagina.nextCursor ?? ""
        paginas++
      }
      assert.equal(tieneMas, false)
      assert.equal(vistos.size, 135)
      assert.equal(paginas, 7)
      const agregado = await solicitar(
        "/api/statistics?range=all&timeZone=UTC",
        propietario.token,
      )
      assert.equal(agregado.status, 200)
      const estadisticas = (await agregado.json()) as InformeEstadisticas
      assert.equal(estadisticas.lifetime.completedExercises, 135)
      assert.equal(estadisticas.lifetime.correctAnswers, 135)
      assert.equal(estadisticas.lifetime.errors, 68)
      assert.ok(
        Math.abs(estadisticas.lifetime.activeSeconds - 4036.5) < 0.00001,
      )
      assert.ok(
        Math.abs(estadisticas.lifetime.accuracy! - (135 / 203) * 100) < 0.00001,
      )
      await new Promise((resolver) => setTimeout(resolver, 1100))
      await autenticacion.revokeRefreshTokens(propietario.uid)
      assert.equal(
        (await solicitar("/api/users/me", propietario.token)).status,
        401,
      )
      await autenticacion.updateUser(otro.uid, { disabled: true })
      assert.equal((await solicitar("/api/users/me", otro.token)).status, 401)
    } finally {
      await new Promise<void>((resolver) => servidor.close(() => resolver()))
      for (const uid of creado) {
        await baseDatos.recursiveDelete(baseDatos.doc(`users/${uid}`))
        await autenticacion.deleteUser(uid)
      }
    }
  },
)
