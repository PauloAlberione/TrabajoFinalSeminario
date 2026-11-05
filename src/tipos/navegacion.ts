import { type TipoVelocidad } from "../../compartido/velocidad"
import { type TipoAtencion } from "../../compartido/atencionReconocimiento"
import { type TipoCalculo } from "../../compartido/calculo"
import { type TipoLenguaje } from "../../compartido/lenguaje"
import { type TipoMemoria } from "../../compartido/memoria"

export type Pantalla =
  | TipoVelocidad
  | TipoAtencion
  | TipoCalculo
  | TipoLenguaje
  | TipoMemoria
  | "home"
  | "activities"
  | "game"
  | "lenguaje-game"
  | "calculo-game"
  | "atencion-game"
  | "velocidad-game"
  | "progress"
  | "profile"
  | "help"

export type EstadoAplicacion = "login" | "register" | "forgot" | "app"
