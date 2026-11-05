import { recordatorioProgramadorProteccion } from "./programador.intermediario"
import {
  recordatorioConfiguracion,
  validoCorreo,
} from "../servicios/recordatorioCorreo"

export const exigirEliminacionProgramador = recordatorioProgramadorProteccion(
  undefined,
  () => {
    const audiencia = process.env.ACCOUNT_DELETION_SCHEDULER_AUDIENCE ?? ""
    const servicioCuenta =
      process.env.ACCOUNT_DELETION_SCHEDULER_SERVICE_ACCOUNT ?? ""
    let seguro = false
    try {
      const url = new URL(audiencia)
      seguro =
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
    } catch {
      /* Sin configuración, la tarea permanece bloqueada. */
    }
    return {
      ...recordatorioConfiguracion(),
      audience: audiencia,
      serviceAccount: servicioCuenta,
      configured: seguro && validoCorreo(servicioCuenta),
    }
  },
)
