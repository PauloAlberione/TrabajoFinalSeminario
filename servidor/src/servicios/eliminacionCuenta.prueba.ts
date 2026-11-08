import { autenticacionProteccion } from "../intermediarios/autenticacion.intermediario"
import test from "node:test"
import assert from "node:assert/strict"
import { once } from "node:events"
import type { AddressInfo } from "node:net"
import type { Request, Response } from "express"
import { Timestamp } from "firebase-admin/firestore"
import { AlmacenTransacciones } from "../pruebas/almacenTransacciones"
import { aplicacion } from "../aplicacion"
import {
  verificarRecienteAutenticacion,
  ejecutarCuentaEliminacion,
  type CuentaEliminacionAutenticacion,
} from "./eliminacionCuenta.servicio"
import {
  prepararCuentaEliminacion,
  leerEliminacionComprobante,
  reservaCuentaEliminacion,
  eliminarCuentaDocumentos,
  verificarCuentaModificable,
  eliminacionBloqueoId,
  esCuentaEliminando,
} from "../repositorios/eliminacionCuenta.repositorio"
import {
  crearPerfilUsuario,
  actualizarPerfilUsuario,
} from "../repositorios/usuario.repositorio"
import {
  reservaRecordatorio,
  prepararRecordatorioCorreo,
  finalizarRecordatorio,
} from "../repositorios/recordatorio.repositorio"
import { crearRecordatorioCorreo } from "./recordatorioCorreo"
import {
  prepararEliminacion,
  continuarEliminacion,
} from "../controladores/eliminacionCuenta.controlador"
import type { AutenticadoSolicitud } from "../intermediarios/autenticacion.intermediario"

class EliminacionAlmacen extends AlmacenTransacciones {
  removals: string[] = []
  failRemoval = false
  constructor() {
    super()
    this.database.recursiveDelete = async (referencia) => {
      this.removals.push(referencia.path)
      for (const ruta of [...this.documents.keys()])
        if (
          ruta === referencia.path ||
          ruta.startsWith(`${referencia.path}/`)
        ) {
          this.documents.delete(ruta)
          this.versions.set(ruta, (this.versions.get(ruta) ?? 0) + 1)
          if (this.failRemoval) {
            this.failRemoval = false
            throw new Error("simulated partial recursive failure")
          }
        }
    }
  }
}

function prepararPrueba() {
  const almacen = new EliminacionAlmacen()
  almacen.documents.set("users/owner", {
    firstName: "Ana",
    accessibilityPreferences: { sonidos: true, recordatorios: true },
    reminderPreferences: { enabled: true },
    reminderNextAt: Timestamp.now(),
  })
  for (const ruta of [
    "sessions/one",
    "sessions/one/results/completed",
    "sessions/one/unknown/deep",
    "progress/memory",
    "progress/processingSpeed",
    "reminderDeliveries/test",
    "futureCollection/document",
  ])
    almacen.documents.set(`users/owner/${ruta}`, { private: true })
  almacen.documents.set("users/other", { firstName: "Other" })
  almacen.documents.set("users/other/sessions/one/results/completed", {
    correctAnswers: 3,
  })
  return almacen
}

function simuladoAutenticacion() {
  const llamadas: string[] = []
  let existe = true,
    deshabilitado = false,
    fallar = ""
  const autenticacion: CuentaEliminacionAutenticacion = {
    async updateUser(uid, valor) {
      assert.equal(uid, "owner")
      llamadas.push("disable")
      if (fallar === "disable") {
        fallar = ""
        throw new Error("disable failed")
      }
      if (!existe) throw { code: "auth/user-not-found" }
      deshabilitado = valor.disabled
    },
    async revokeRefreshTokens(uid) {
      assert.equal(uid, "owner")
      llamadas.push("revoke")
      if (fallar === "revoke") {
        fallar = ""
        throw new Error("revoke failed")
      }
    },
    async deleteUser(uid) {
      assert.equal(uid, "owner")
      llamadas.push("delete")
      if (fallar === "delete") {
        fallar = ""
        throw new Error("delete failed")
      }
      if (!existe) throw { code: "auth/user-not-found" }
      existe = false
    },
  }
  return {
    auth: autenticacion,
    calls: llamadas,
    exists: () => existe,
    disabled: () => deshabilitado,
    fail: (paso: string) => {
      fallar = paso
    },
  }
}

test("La autenticación reciente usa auth_time y rechaza fechas antiguas, ausentes o futuras", () => {
  const ahora = Date.now()
  assert.doesNotThrow(() => verificarRecienteAutenticacion(ahora / 1000, ahora))
  for (const valor of [
    undefined,
    NaN,
    "new",
    ahora / 1000 - 301,
    ahora / 1000 + 31,
  ])
    assert.throws(() => verificarRecienteAutenticacion(valor, ahora))
})

test("La preparación no desactiva ni elimina datos y los comprobantes son secretos, acotados y temporales", async () => {
  const almacen = prepararPrueba(),
    antes = JSON.stringify([...almacen.documents])
  const comprobante = await prepararCuentaEliminacion(
    "owner",
    new Date(),
    almacen.database,
  )
  assert.equal(
    JSON.stringify(
      [...almacen.documents].filter(
        ([clave]) => !clave.startsWith("accountDeletionJobs/"),
      ),
    ),
    antes,
  )
  assert.equal(await esCuentaEliminando("owner", almacen.database), false)
  const { job: tarea } = await leerEliminacionComprobante(
    comprobante,
    new Date(),
    almacen.database,
  )
  assert.equal(tarea.uid, "owner")
  assert.notEqual(tarea.secretHash, comprobante.split(".")[1])
  await assert.rejects(
    leerEliminacionComprobante(
      comprobante.slice(0, -1) + (comprobante.endsWith("0") ? "1" : "0"),
      new Date(),
      almacen.database,
    ),
  )
  await assert.rejects(
    leerEliminacionComprobante(
      comprobante,
      new Date(Date.now() + 86401000),
      almacen.database,
    ),
  )
})

test("La eliminación desactiva y revoca antes de borrar datos y elimina Authentication al final", async () => {
  const almacen = prepararPrueba(),
    autenticacion = simuladoAutenticacion(),
    comprobante = await prepararCuentaEliminacion(
      "owner",
      new Date(),
      almacen.database,
    )
  const { id } = await leerEliminacionComprobante(
    comprobante,
    new Date(),
    almacen.database,
  )
  const resultado = await ejecutarCuentaEliminacion(
    id,
    almacen.database,
    autenticacion.auth,
    async (uid, bd) => {
      assert.equal(autenticacion.disabled(), true)
      assert.deepEqual(autenticacion.calls, ["disable", "revoke"])
      assert.equal(await esCuentaEliminando(uid, bd), true)
      await eliminarCuentaDocumentos(uid, bd)
    },
  )
  assert.equal(resultado.status, "completed")
  assert.equal(autenticacion.exists(), false)
  assert.deepEqual(autenticacion.calls, ["disable", "revoke", "delete"])
  assert.deepEqual(
    [...almacen.documents.keys()].filter((ruta) =>
      ruta.startsWith("users/owner"),
    ),
    [],
  )
  assert.equal(almacen.documents.get("users/other")!.firstName, "Other")
  assert.equal(
    almacen.documents.get("users/other/sessions/one/results/completed")!
      .correctAnswers,
    3,
  )
  assert.deepEqual(almacen.removals, ["users/owner"])
  assert.equal(
    (await ejecutarCuentaEliminacion(id, almacen.database, autenticacion.auth))
      .status,
    "completed",
  )
  assert.deepEqual(autenticacion.calls, ["disable", "revoke", "delete"])
})

test("Los fallos parciales mantienen el bloqueo y permiten reintentos sin restaurar acceso", async () => {
  for (const paso of ["disable", "revoke", "recursive", "delete"]) {
    const almacen = prepararPrueba(),
      autenticacion = simuladoAutenticacion(),
      comprobante = await prepararCuentaEliminacion(
        "owner",
        new Date(),
        almacen.database,
      ),
      { id } = await leerEliminacionComprobante(
        comprobante,
        new Date(),
        almacen.database,
      )
    if (paso === "recursive") almacen.failRemoval = true
    else autenticacion.fail(paso)
    assert.equal(
      (
        await ejecutarCuentaEliminacion(
          id,
          almacen.database,
          autenticacion.auth,
        )
      ).status,
      "pending",
      paso,
    )
    assert.equal(await esCuentaEliminando("owner", almacen.database), true)
    await assert.rejects(
      actualizarPerfilUsuario(
        "owner",
        { firstName: "Resurrect" },
        almacen.database,
      ),
    )
    await assert.rejects(
      crearPerfilUsuario("owner", { firstName: "Resurrect" }, almacen.database),
    )
    assert.equal(
      (
        await ejecutarCuentaEliminacion(
          id,
          almacen.database,
          autenticacion.auth,
        )
      ).status,
      "completed",
      paso,
    )
    assert.equal(autenticacion.exists(), false)
    assert.equal(
      [...almacen.documents.keys()].some((ruta) =>
        ruta.startsWith("users/owner"),
      ),
      false,
    )
  }
})

test("Los reintentos paralelos adquieren un único bloqueo y recuperan trabajadores interrumpidos", async () => {
  const almacen = prepararPrueba(),
    comprobante = await prepararCuentaEliminacion(
      "owner",
      new Date(),
      almacen.database,
    ),
    { id } = await leerEliminacionComprobante(
      comprobante,
      new Date(),
      almacen.database,
    ),
    ahora = new Date()
  const reservas = await Promise.all([
    reservaCuentaEliminacion(id, ahora, almacen.database),
    reservaCuentaEliminacion(id, ahora, almacen.database),
  ])
  assert.equal(
    reservas.filter((reserva) => reserva.status === "claimed").length,
    1,
  )
  assert.equal(
    reservas.filter((reserva) => reserva.status === "busy").length,
    1,
  )
  assert.equal(
    (
      await reservaCuentaEliminacion(
        id,
        new Date(ahora.getTime() + 600001),
        almacen.database,
      )
    ).status,
    "claimed",
  )
})

test("Una transacción simultánea no puede recrear datos tras confirmar el bloqueo de eliminación", async () => {
  const almacen = prepararPrueba(),
    comprobante = await prepararCuentaEliminacion(
      "owner",
      new Date(),
      almacen.database,
    ),
    { id } = await leerEliminacionComprobante(
      comprobante,
      new Date(),
      almacen.database,
    )
  let liberar: () => void = () => {},
    observado: () => void = () => {},
    primero = true
  const preparar = new Promise<void>((resolver) => {
      observado = resolver
    }),
    esperar = new Promise<void>((resolver) => {
      liberar = resolver
    })
  const escritor = almacen.database.runTransaction(async (transaccion) => {
    await verificarCuentaModificable(transaccion, "owner", almacen.database)
    if (primero) {
      primero = false
      observado()
      await esperar
    }
    transaccion.set(almacen.database.doc("users/owner/futureCollection/late"), {
      private: true,
    })
  })
  await preparar
  await reservaCuentaEliminacion(id, new Date(), almacen.database)
  liberar()
  await assert.rejects(escritor)
  assert.equal(
    almacen.documents.has("users/owner/futureCollection/late"),
    false,
  )
})

test("Los recordatorios se desactivan atómicamente y los envíos pendientes no recrean datos eliminados", async () => {
  const almacen = prepararPrueba(),
    comprobante = await prepararCuentaEliminacion(
      "owner",
      new Date(),
      almacen.database,
    ),
    { id } = await leerEliminacionComprobante(
      comprobante,
      new Date(),
      almacen.database,
    )
  await reservaCuentaEliminacion(id, new Date(), almacen.database)
  assert.equal(
    (almacen.documents.get("users/owner")!.reminderPreferences as {
      enabled: boolean
    }).enabled,
    false,
  )
  assert.equal(almacen.documents.get("users/owner")!.reminderNextAt, null)
  assert.equal(
    await reservaRecordatorio("owner", new Date(), almacen.database),
    null,
  )
  const reserva = {
    uid: "owner",
    id: "test",
    version: "old",
    consent: "old",
    settings: {
      enabled: true,
      frequency: "daily" as const,
      time: "10:00",
      timeZone: "UTC",
      weekdays: [1],
    },
    occurrence: new Date(),
    attempts: 1,
    firstAttemptAt: Date.now(),
  }
  assert.equal(
    await prepararRecordatorioCorreo(
      reserva,
      crearRecordatorioCorreo(
        "owner",
        "consent",
        "owner@example.com",
        new Date(),
      ),
      almacen.database,
    ),
    false,
  )
  await eliminarCuentaDocumentos("owner", almacen.database)
  await finalizarRecordatorio(
    reserva,
    "accepted",
    "provider_accepted",
    new Date(),
    60,
    almacen.database,
  )
  assert.equal(
    [...almacen.documents.keys()].some((ruta) =>
      ruta.startsWith("users/owner"),
    ),
    false,
  )
})

test("Los controladores rechazan solicitudes sin autenticación, UID ajeno o confirmación ausente", async () => {
  function respuesta() {
    let estado = 0
    const valor = {
      setHeader() {},
      sendStatus(codigo: number) {
        estado = codigo
      },
      status(codigo: number) {
        estado = codigo
        return valor
      },
      json() {},
    }
    return { value: valor as unknown as Response, status: () => estado }
  }
  let resultado = respuesta()
  await prepararEliminacion({} as Request, resultado.value)
  assert.equal(resultado.status(), 401)
  for (const cuerpo of [
    { confirmed: false },
    { confirmed: true, uid: "other" },
  ]) {
    resultado = respuesta()
    await prepararEliminacion(
      {
        userId: "owner",
        authTime: Date.now() / 1000,
        body: cuerpo,
        query: {},
      } as AutenticadoSolicitud,
      resultado.value,
    )
    assert.equal(resultado.status(), 400)
  }
  resultado = respuesta()
  await prepararEliminacion(
    {
      userId: "owner",
      authTime: 1,
      body: { confirmed: true },
      query: {},
    } as AutenticadoSolicitud,
    resultado.value,
  )
  assert.equal(resultado.status(), 401)
  resultado = respuesta()
  await continuarEliminacion(
    { body: { ticket: "invalid", uid: "other" }, query: {} } as Request,
    resultado.value,
  )
  assert.equal(resultado.status(), 400)
})

test("La eliminación HTTP exige credenciales y su continuación pública exige un comprobante privado", async () => {
  const servidor = aplicacion.listen(0, "127.0.0.1")
  await once(servidor, "listening")
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`
  try {
    let resultado = await fetch(`${base}/api/users/me/deletion/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed: true }),
    })
    assert.equal(resultado.status, 401)
    resultado = await fetch(`${base}/api/users/me/deletion/continue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: "invalid", uid: "other" }),
    })
    assert.equal(resultado.status, 400)
    resultado = await fetch(`${base}/api/users/deletion-jobs/dispatch`, {
      method: "POST",
    })
    assert.ok(resultado.status === 401 || resultado.status === 503)
  } finally {
    await new Promise<void>((resolver) => servidor.close(() => resolver()))
  }
})

test("La autenticación comprueba revocación, desactivación y eliminación pendiente sin aceptar otro UID", async () => {
  for (const modo of [
    "active",
    "revoked",
    "disabled",
    "expired",
    "invalid",
    "deleting",
  ]) {
    let estado = 0,
      llamado = false
    const solicitar = {
      header: () => "Bearer signed-token",
      body: { uid: "other" },
    } as unknown as AutenticadoSolicitud
    const respuesta = {
      status(codigo: number) {
        estado = codigo
        return this
      },
      json() {},
    } as unknown as Response
    const intermediario = autenticacionProteccion(
      async (token, comprobarRevocado) => {
        assert.equal(token, "signed-token")
        assert.equal(comprobarRevocado, true)
        if (["revoked", "disabled", "expired", "invalid"].includes(modo))
          throw new Error(modo)
        return { uid: "owner", auth_time: 123 }
      },
      async (uid) => {
        assert.equal(uid, "owner")
        return modo === "deleting"
      },
      () => true,
    )
    await intermediario(solicitar, respuesta, () => {
      llamado = true
    })
    assert.equal(llamado, modo === "active")
    if (modo === "active") assert.equal(solicitar.userId, "owner")
    else assert.equal(estado, modo === "deleting" ? 403 : 401)
  }
})

test("Una preparación repetida sustituye el comprobante anterior sin conservar registros adicionales", async () => {
  const almacen = prepararPrueba()
  const primero = await prepararCuentaEliminacion(
    "owner",
    new Date(),
    almacen.database,
  )
  const segundo = await prepararCuentaEliminacion(
    "owner",
    new Date(),
    almacen.database,
  )
  assert.notEqual(primero, segundo)
  assert.equal(
    [...almacen.documents.keys()].filter((ruta) =>
      ruta.startsWith("accountDeletionJobs/"),
    ).length,
    1,
  )
  await assert.rejects(
    leerEliminacionComprobante(primero, new Date(), almacen.database),
  )
  assert.equal(
    (await leerEliminacionComprobante(segundo, new Date(), almacen.database))
      .job.uid,
    "owner",
  )
})

test("Un fallo al registrar la eliminación de Authentication puede recuperarse con el mismo comprobante", async () => {
  const almacen = prepararPrueba(),
    autenticacion = simuladoAutenticacion(),
    comprobante = await prepararCuentaEliminacion(
      "owner",
      new Date(),
      almacen.database,
    )
  const { id } = await leerEliminacionComprobante(
    comprobante,
    new Date(),
    almacen.database,
  )
  const transaccion = almacen.database.runTransaction.bind(almacen.database)
  let llamadas = 0
  almacen.database.runTransaction = ((async (devolucion) => {
    if (++llamadas === 2) throw new Error("completion commit unavailable")
    return transaccion(devolucion)
  }) as typeof almacen.database.runTransaction)
  assert.equal(
    (await ejecutarCuentaEliminacion(id, almacen.database, autenticacion.auth))
      .status,
    "pending",
  )
  assert.equal(autenticacion.exists(), false)
  assert.equal(
    [...almacen.documents.keys()].some((ruta) =>
      ruta.startsWith("users/owner"),
    ),
    false,
  )
  assert.equal(
    (
      await leerEliminacionComprobante(
        comprobante,
        new Date(),
        almacen.database,
      )
    ).job.status,
    "pending",
  )
  assert.equal(
    (await ejecutarCuentaEliminacion(id, almacen.database, autenticacion.auth))
      .status,
    "completed",
  )
})
