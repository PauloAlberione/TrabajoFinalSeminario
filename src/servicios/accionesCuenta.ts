const modosFirebase = new Set([
  "verifyEmail",
  "recoverEmail",
  "verifyAndChangeEmail",
  "revertSecondFactorAddition",
])

export function leerEnlaceRestablecimiento(direccion: string) {
  const parametros = new URL(direccion).searchParams
  const modo = parametros.get("mode")
  const codigo = parametros.get("oobCode")
  return {
    modo,
    codigo:
      modo === "resetPassword" &&
      parametros.getAll("mode").length === 1 &&
      parametros.getAll("oobCode").length === 1 &&
      codigo &&
      codigo.length <= 4096
        ? codigo
        : null,
  }
}

export function enlaceAccionFirebase(
  direccion: string,
  proyecto: string,
  claveWeb: string,
): string | null {
  const entrada = new URL(direccion).searchParams
  const modo = entrada.get("mode")
  const codigo = entrada.get("oobCode")
  if (
    !modo ||
    !modosFirebase.has(modo) ||
    !codigo ||
    codigo.length > 4096 ||
    entrada.getAll("mode").length !== 1 ||
    entrada.getAll("oobCode").length !== 1 ||
    !/^[a-z][a-z0-9-]+$/.test(proyecto) ||
    !claveWeb
  )
    return null
  const salida = new URL(`https://${proyecto}.firebaseapp.com/__/auth/action`)
  salida.searchParams.set("mode", modo)
  salida.searchParams.set("oobCode", codigo)
  salida.searchParams.set("apiKey", claveWeb)
  salida.searchParams.set("lang", "es")
  return salida.href
}
