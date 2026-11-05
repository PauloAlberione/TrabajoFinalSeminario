import { NavegacionPoliticaPrivacidad } from "./funcionalidades/privacidad/NavegacionPoliticaPrivacidad"
import React from "react"
import ReactDOM from "react-dom/client"
import Aplicacion from "./Aplicacion"
import { ProveedorAccesibilidad } from "./funcionalidades/accesibilidad/ProveedorAccesibilidad"
import "./indice.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProveedorAccesibilidad>
      <NavegacionPoliticaPrivacidad>
        <Aplicacion />
      </NavegacionPoliticaPrivacidad>
    </ProveedorAccesibilidad>
  </React.StrictMode>,
)
