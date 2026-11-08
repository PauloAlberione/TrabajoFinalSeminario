export const REQUISITOS_CONTRASENA =
  "La contraseña debe tener al menos 8 caracteres, una mayúscula (A-Z) y una minúscula (a-z)."

export function validarContrasena(contrasena: string): string | null {
  if (
    contrasena.length < 8 ||
    !/[A-Z]/.test(contrasena) ||
    !/[a-z]/.test(contrasena)
  ) {
    return REQUISITOS_CONTRASENA
  }

  if (contrasena.length > 4096) {
    return "La contraseña no puede superar los 4096 caracteres."
  }

  return null
}
