import { SelectorUbicacion } from "./SelectorUbicacion"
import { SelectorTonoAvatar } from "./SelectorTonoAvatar"
import { useState, useRef, useEffect } from "react"
import {
  validarCambiosPerfil,
  ErrorValidacionPerfil,
  type CambiosPerfil,
} from "../../../compartido/perfil"
import type { PerfilUsuario } from "../../servicios/datosUsuario"

const entradaEstilo = {
  border: "2px solid var(--border)",
  background: "var(--background)",
}

export function EditorPerfil({
  profile: perfil,
  onSave: alGuardar,
  onCancel: alCancelar,
}: {
  profile: PerfilUsuario
  onSave: (cambios: CambiosPerfil) => Promise<void>
  onCancel: () => void
}) {
  const [nombre, establecerPrimeroNombre] = useState(perfil.nombre)
  const [apellido, establecerUltimoNombre] = useState(perfil.apellido)
  const [fechaNacimiento, establecerNacimientoFecha] = useState(
    perfil.fechaNacimiento,
  )
  const [genero, establecerGenero] = useState(perfil.gender ?? "")
  const [pais, establecerPais] = useState(perfil.pais ?? "")
  const [zonaHoraria, establecerZonaHoraria] = useState(
    perfil.zonaHoraria ?? "",
  )
  const [tono, establecerTono] = useState(perfil.tonoAvatar ?? "predeterminado")
  const [guardando, establecerGuardando] = useState(false)
  const [error, establecerError] = useState("")
  const formularioReferencia = useRef<HTMLFormElement>(null)
  const ocupado = useRef(false)
  useEffect(() => {
    formularioReferencia.current?.querySelector("input")?.focus()
  }, [])
  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (ocupado.current) return
    establecerError("")
    try {
      const cambios: CambiosPerfil = {}
      if (nombre.trim() !== perfil.nombre) cambios.firstName = nombre
      if (apellido.trim() !== perfil.apellido) cambios.lastName = apellido
      if (fechaNacimiento !== perfil.fechaNacimiento)
        cambios.birthDate = fechaNacimiento
      if (genero && genero !== perfil.gender)
        cambios.gender = (genero as PerfilUsuario["gender"])
      if (
        pais !== (perfil.pais ?? "") ||
        zonaHoraria !== (perfil.zonaHoraria ?? "")
      ) {
        cambios.countryCode = pais
        cambios.timeZone = zonaHoraria
      }
      if (tono !== (perfil.tonoAvatar ?? "predeterminado"))
        cambios.avatarTone = tono
      if (!Object.keys(cambios).length) {
        alCancelar()
        return
      }
      const validado = validarCambiosPerfil(cambios)
      ocupado.current = true
      establecerGuardando(true)
      await alGuardar(validado)
    } catch (fallo) {
      establecerError(
        fallo instanceof ErrorValidacionPerfil
          ? fallo.message
          : "No pudimos guardar los cambios. Revisá tu conexión e intentá nuevamente.",
      )
    } finally {
      ocupado.current = false
      establecerGuardando(false)
    }
  }
  return (
    <form
      ref={formularioReferencia}
      onSubmit={guardar}
      className="rounded-3xl p-6 mb-6 space-y-5"
      style={{ background: "var(--card)", border: "2px solid var(--border)" }}
      aria-labelledby="edit-profile-title"
      aria-busy={guardando}
    >
      <h2 id="edit-profile-title" className="text-2xl font-bold">
        Editar perfil
      </h2>
      <fieldset disabled={guardando} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label className="text-lg font-semibold">
            Nombre <span aria-hidden="true">*</span>
            <input
              className="block w-full p-3 mt-2 rounded-xl"
              style={entradaEstilo}
              required
              minLength={1}
              maxLength={80}
              autoComplete="given-name"
              value={nombre}
              onChange={(evento) =>
                establecerPrimeroNombre(evento.target.value)
              }
            />
          </label>
          <label className="text-lg font-semibold">
            Apellido <span aria-hidden="true">*</span>
            <input
              className="block w-full p-3 mt-2 rounded-xl"
              style={entradaEstilo}
              required
              minLength={1}
              maxLength={80}
              autoComplete="family-name"
              value={apellido}
              onChange={(evento) => establecerUltimoNombre(evento.target.value)}
            />
          </label>
          <label className="text-lg font-semibold">
            Fecha de nacimiento (opcional)
            <input
              className="block w-full p-3 mt-2 rounded-xl"
              style={entradaEstilo}
              type="date"
              autoComplete="bday"
              value={fechaNacimiento}
              onChange={(evento) =>
                establecerNacimientoFecha(evento.target.value)
              }
            />
          </label>
          <label className="text-lg font-semibold">
            Género
            <select
              className="block w-full p-3 mt-2 rounded-xl"
              style={entradaEstilo}
              value={genero}
              onChange={(evento) =>
                establecerGenero(evento.target.value as typeof genero)
              }
            >
              <option value="" disabled>
                Sin registrar
              </option>
              <option value="female">Femenino</option>
              <option value="male">Masculino</option>
            </select>
          </label>
        </div>
        <SelectorUbicacion
          pais={pais}
          zona={zonaHoraria}
          alCambiar={(nuevoPais, zona) => {
            establecerPais(nuevoPais)
            establecerZonaHoraria(zona)
          }}
        />
        <SelectorTonoAvatar
          genero={genero === "male" || genero === "female" ? genero : undefined}
          tono={tono}
          alCambiar={establecerTono}
        />
        <label className="block text-lg font-semibold">
          Correo electrónico
          <input
            className="block w-full p-3 mt-2 rounded-xl"
            style={entradaEstilo}
            type="email"
            readOnly
            value={perfil.email}
          />
        </label>
        <p>
          El correo pertenece a tu cuenta de acceso y no se puede cambiar desde
          este formulario.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            className="px-8 py-4 rounded-2xl text-xl font-bold"
            style={{ background: "var(--primary)", color: "white" }}
            type="submit"
          >
            Guardar cambios
          </button>
          <button
            className="px-8 py-4 rounded-2xl text-xl font-bold"
            style={{ background: "var(--muted)" }}
            type="button"
            onClick={alCancelar}
          >
            Cancelar
          </button>
        </div>
      </fieldset>
      {guardando && <p role="status">Guardando perfil…</p>}
      {error && (
        <p role="alert" className="text-lg">
          {error}
        </p>
      )}
    </form>
  )
}
