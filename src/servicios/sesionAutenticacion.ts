import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
  type UserCredential,
} from "firebase/auth"
import {
  CLAVE_SESION_ACCESO,
  SESION_POR_VENCER_EVENTO,
  leerControlSesion,
  sesionVigente,
  vencimientoSesion,
  type AvisoVencimientoSesion,
  type ControlSesion,
} from "./politicaSesion"

const claveAviso = "menteclear:auth:notice"
let accesoPendiente: Promise<UserCredential> | null = null
let cierrePendiente: Promise<void> | null = null

function limpiarControl() {
  for (const almacenamiento of ["localStorage", "sessionStorage"] as const) {
    try {
      window[almacenamiento].removeItem(CLAVE_SESION_ACCESO)
    } catch {
      // Un cierre de sesión también debe funcionar con almacenamiento restringido.
    }
  }
}

function obtenerControl(uid: string): ControlSesion | null {
  for (const almacenamiento of ["sessionStorage", "localStorage"] as const) {
    try {
      const control = leerControlSesion(
        window[almacenamiento].getItem(CLAVE_SESION_ACCESO),
        uid,
      )
      if (control && control.mantener === (almacenamiento === "localStorage"))
        return control
    } catch {
      // Se comprueba la otra persistencia antes de rechazar la sesión.
    }
  }
  return null
}

async function autenticar(
  autenticacion: Auth,
  mantener: boolean,
  operacion: () => Promise<UserCredential>,
) {
  if (accesoPendiente) return accesoPendiente
  const pendiente = (async () => {
    await setPersistence(
      autenticacion,
      mantener ? browserLocalPersistence : browserSessionPersistence,
    )
    const credencial = await operacion()
    limpiarControl()
    try {
      const control: ControlSesion = {
        version: 1,
        uid: credencial.user.uid,
        inicio: Date.now(),
        mantener,
      }
      window[mantener ? "localStorage" : "sessionStorage"].setItem(
        CLAVE_SESION_ACCESO,
        JSON.stringify(control),
      )
    } catch {
      await signOut(autenticacion)
      throw new Error(
        "No pudimos guardar la sesión de forma segura. Permití el almacenamiento de este sitio e intentá nuevamente.",
      )
    }
    return credencial
  })()
  accesoPendiente = pendiente
  try {
    return await pendiente
  } finally {
    if (accesoPendiente === pendiente) accesoPendiente = null
  }
}

export function ingresarConCorreo(
  autenticacion: Auth,
  correo: string,
  contrasena: string,
  mantener: boolean,
) {
  return autenticar(autenticacion, mantener, () =>
    signInWithEmailAndPassword(autenticacion, correo, contrasena),
  )
}

export function registrarConCorreo(
  autenticacion: Auth,
  correo: string,
  contrasena: string,
) {
  return autenticar(autenticacion, false, () =>
    createUserWithEmailAndPassword(autenticacion, correo, contrasena),
  )
}

export function guardarAvisoAcceso(mensaje: string) {
  try {
    sessionStorage.setItem(claveAviso, mensaje)
  } catch {
    // El aviso también puede mostrarse en la pantalla actual sin persistirlo.
  }
}

export function leerAvisoAcceso() {
  try {
    return sessionStorage.getItem(claveAviso) ?? ""
  } catch {
    return ""
  }
}

export function retirarAvisoAcceso() {
  try {
    sessionStorage.removeItem(claveAviso)
  } catch {
    // No se bloquea el acceso si el navegador no permite limpiar el aviso.
  }
}

export async function cerrarSesion(autenticacion: Auth) {
  await signOut(autenticacion)
  limpiarControl()
}

function vencerSesion(autenticacion: Auth, alVencer: () => void) {
  if (cierrePendiente) return cierrePendiente
  cierrePendiente = (async () => {
    alVencer()
    const operaciones: Promise<unknown>[] = []
    window.dispatchEvent(
      new CustomEvent<AvisoVencimientoSesion>(SESION_POR_VENCER_EVENTO, {
        detail: { esperar: (operacion) => operaciones.push(operacion) },
      }),
    )
    let limite: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        Promise.allSettled(operaciones),
        new Promise<void>((resolver) => {
          limite = setTimeout(resolver, 5000)
        }),
      ])
      await cerrarSesion(autenticacion)
    } finally {
      clearTimeout(limite)
      cierrePendiente = null
    }
  })()
  return cierrePendiente
}

export function observarSesionAutenticada(
  autenticacion: Auth,
  alCambiar: (usuario: User | null) => void,
  alVencer: () => void,
) {
  let activo = true
  let version = 0
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const finalizarVencimiento = async () => {
    try {
      await vencerSesion(autenticacion, alVencer)
    } catch {
      limpiarControl()
      if (activo) alCambiar(null)
    }
  }
  const comprobar = async () => {
    const usuario = autenticacion.currentUser
    if (!activo || !usuario || accesoPendiente) return
    const control = obtenerControl(usuario.uid)
    if (!control || !sesionVigente(control)) {
      await finalizarVencimiento()
      return
    }
    clearTimeout(temporizador)
    temporizador = setTimeout(
      () => void comprobar(),
      Math.min(vencimientoSesion(control) - Date.now(), 60_000),
    )
  }
  const dejarDeObservar = onAuthStateChanged(autenticacion, async (usuario) => {
    const actual = ++version
    clearTimeout(temporizador)
    await accesoPendiente?.catch(() => undefined)
    if (!activo || version !== actual) return
    if (!usuario) {
      limpiarControl()
      alCambiar(null)
      return
    }
    const control = obtenerControl(usuario.uid)
    if (!control || !sesionVigente(control)) {
      await finalizarVencimiento()
      return
    }
    alCambiar(usuario)
    void comprobar()
  })
  const alActivar = () => void comprobar()
  window.addEventListener("focus", alActivar)
  window.addEventListener("pageshow", alActivar)
  window.addEventListener("storage", alActivar)
  document.addEventListener("visibilitychange", alActivar)
  return () => {
    activo = false
    version++
    clearTimeout(temporizador)
    dejarDeObservar()
    window.removeEventListener("focus", alActivar)
    window.removeEventListener("pageshow", alActivar)
    window.removeEventListener("storage", alActivar)
    document.removeEventListener("visibilitychange", alActivar)
  }
}
