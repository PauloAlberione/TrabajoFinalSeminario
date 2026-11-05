import { representarAvatar, type TonoAvatar } from "../../compartido/avatar"
import type { PerfilUsuario } from "../servicios/datosUsuario"

export function avatarUsuario(
  genero?: PerfilUsuario["gender"],
  tono?: TonoAvatar,
) {
  return representarAvatar(genero, tono)
}
