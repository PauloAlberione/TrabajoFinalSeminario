import { NavegacionPoliticaPrivacidad } from "./funcionalidades/privacidad/NavegacionPoliticaPrivacidad"
import React from "react"
import ReactDOM from "react-dom/client"
import Aplicacion from "./Aplicacion"
import { ProveedorAccesibilidad } from "./funcionalidades/accesibilidad/ProveedorAccesibilidad"
import "./indice.css"
import { AvisoConexionServidor } from "./componentes/AvisoConexionServidor"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProveedorAccesibilidad>
      <AvisoConexionServidor />
      <NavegacionPoliticaPrivacidad>
        <Aplicacion />
      </NavegacionPoliticaPrivacidad>
    </ProveedorAccesibilidad>
  </React.StrictMode>,
)
