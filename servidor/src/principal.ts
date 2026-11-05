import { aplicacion } from "./aplicacion"
import { obtenerFirestoreAdmin } from "./configuracion/firebaseAdmin"

const puerto = Number(process.env.BACKEND_PORT ?? 8787)

obtenerFirestoreAdmin()

aplicacion.listen(puerto, () =>
  console.log(`MenteClear backend listening on port ${puerto}`),
)
