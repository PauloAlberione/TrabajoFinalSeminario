import { crearConexionServidor } from "./disponibilidadServidor"

export const conexionServidor = crearConexionServidor(
  import.meta.env.VITE_BACKEND_URL?.trim(),
)
