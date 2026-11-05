import { aplicacion } from "./aplicacion"
import { obtenerFirestoreAdmin } from "./configuracion/firebaseAdmin"

const puerto = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 8787)

obtenerFirestoreAdmin()

aplicacion.listen(puerto, "0.0.0.0", () =>
  console.log(`Backend de MenteClear iniciado en el puerto ${puerto}`),
)
