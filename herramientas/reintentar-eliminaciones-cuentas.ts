import { reintentarPendienteEliminaciones } from "../servidor/src/servicios/eliminacionCuenta.servicio.ts"
// Solo se reintentan solicitudes ya autorizadas mediante autenticación reciente.
console.info(
  "account_deletion.retry_summary",
  await reintentarPendienteEliminaciones(),
)
