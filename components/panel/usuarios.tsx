"use client"

import { useState, useTransition, type FormEvent } from "react"

import { cambiarAcceso, cambiarRoles, crearUsuario, generarContrasena, type ResultadoUsuario } from "@/app/panel/general/usuarios/acciones"
import { Button } from "@/components/ui/button"
import { avisarError, avisarExito, conAviso } from "@/lib/avisos"
import { actividadesConProfesor } from "@/lib/panel/actividades"
import { ROLES, type Rol } from "@/lib/panel/roles"
import { cn } from "cn"

const nombreDeRol: Record<Rol, string> = {
  admin: "Administración (todo)",
  reservas: "Reservas",
  puerta: "Puerta",
  bar: "Bar",
  restaurante: "Restaurante",
  caja: "Caja (cobros y movimientos)",
  profesor: "Profesor de actividad",
}

function ElegirRoles({ elegidos, onChange, prefijo }: { elegidos: Rol[]; onChange: (roles: Rol[]) => void; prefijo: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROLES.map((rol) => {
        const activo = elegidos.includes(rol)
        return (
          <label
            key={rol}
            htmlFor={`${prefijo}-${rol}`}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold",
              activo ? "border-panel-naranja bg-panel-claro text-panel-tostado" : "border-panel-line bg-white text-panel-muted",
            )}
          >
            <input
              id={`${prefijo}-${rol}`}
              type="checkbox"
              className="sr-only"
              checked={activo}
              onChange={() => onChange(activo ? elegidos.filter((item) => item !== rol) : [...elegidos, rol])}
            />
            {nombreDeRol[rol]}
          </label>
        )
      })}
    </div>
  )
}

function ElegirActividades({ elegidas, onChange, prefijo }: { elegidas: string[]; onChange: (actividades: string[]) => void; prefijo: string }) {
  return (
    <fieldset className="rounded-2xl bg-panel px-3 py-2.5">
      <legend className="sr-only">Actividades a cargo</legend>
      <p className="text-sm font-semibold">Actividades a cargo</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {actividadesConProfesor.map((actividad) => {
          const activa = elegidas.includes(actividad.slug)
          return (
            <label
              key={actividad.slug}
              htmlFor={`${prefijo}-act-${actividad.slug}`}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold",
                activa ? "border-panel-ink bg-white text-panel-ink" : "border-panel-line bg-white/60 text-panel-muted",
              )}
            >
              <input
                id={`${prefijo}-act-${actividad.slug}`}
                type="checkbox"
                className="sr-only"
                checked={activa}
                onChange={() => onChange(activa ? elegidas.filter((item) => item !== actividad.slug) : [...elegidas, actividad.slug])}
              />
              {activa ? "✓ " : ""}
              {actividad.nombre}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function ContrasenaNueva({ email, password, onCerrar }: { email: string; password: string; onCerrar: () => void }) {
  return (
    <div role="status" className="rounded-2xl border border-panel-ambar bg-panel-claro p-4 text-sm">
      <p className="font-semibold">Contraseña para {email}. Se muestra una sola vez: pasala por un canal privado.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-white px-3 py-2 font-mono text-base">{password}</code>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={() =>
            navigator.clipboard.writeText(password).then(
              () => avisarExito("Contraseña copiada. Pegala en un mensaje privado."),
              () => avisarError("El navegador no nos dejó copiar. Seleccioná la contraseña y copiala a mano."),
            )
          }
        >
          Copiar
        </Button>
        <button type="button" className="text-panel-muted underline-offset-4 hover:underline" onClick={onCerrar}>
          Listo
        </button>
      </div>
    </div>
  )
}

export function NuevoUsuario() {
  const [roles, setRoles] = useState<Rol[]>(["reservas"])
  const [actividades, setActividades] = useState<string[]>([])
  const [creado, setCreado] = useState<{ email: string; password: string } | null>(null)
  const [pendiente, iniciar] = useTransition()

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    const nombre = String(datos.get("nombre")).trim()
    const email = String(datos.get("email"))
    iniciar(async () => {
      const resultado = await conAviso(
        () => crearUsuario({ nombre, email, roles, actividades }),
        `Listo, ${nombre} ya tiene usuario. Pasale la contraseña que te mostramos abajo.`,
      )
      if (!resultado.ok) return
      formulario.reset()
      setRoles(["reservas"])
      setActividades([])
      if (resultado.password) setCreado({ email, password: resultado.password })
    })
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
      <h2 className="font-display text-2xl tracking-tight">Sumar a alguien del equipo</h2>
      <form onSubmit={enviar} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Nombre
            <input name="nombre" required className="mt-1 block h-10 w-full rounded-lg border border-panel-line px-3 font-normal" />
          </label>
          <label className="text-sm font-semibold">
            Correo
            <input name="email" type="email" required className="mt-1 block h-10 w-full rounded-lg border border-panel-line px-3 font-normal" />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Paneles a los que entra</legend>
          <div className="mt-2">
            <ElegirRoles elegidos={roles} onChange={setRoles} prefijo="nuevo" />
          </div>
        </fieldset>
        {roles.includes("profesor") ? <ElegirActividades elegidas={actividades} onChange={setActividades} prefijo="nuevo" /> : null}
        <Button type="submit" disabled={pendiente || roles.length === 0} className="h-11 bg-panel-naranja px-5 text-white hover:bg-panel-tostado">
          {pendiente ? "Creando…" : "Crear usuario"}
        </Button>
      </form>
      {creado ? (
        <div className="mt-4">
          <ContrasenaNueva email={creado.email} password={creado.password} onCerrar={() => setCreado(null)} />
        </div>
      ) : null}
    </section>
  )
}

export function FilaUsuario({
  usuario,
  soyYo,
}: {
  usuario: { id: string; nombre: string; email: string; roles: Rol[]; actividades: string[]; deshabilitado: boolean }
  soyYo: boolean
}) {
  const [roles, setRoles] = useState<Rol[]>(usuario.roles)
  const [actividades, setActividades] = useState<string[]>(usuario.actividades)
  const [contrasena, setContrasena] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()
  const distintas = (a: string[], b: string[]) => a.length !== b.length || a.some((item) => !b.includes(item))
  const cambiaron = distintas(roles, usuario.roles) || (roles.includes("profesor") && distintas(actividades, usuario.actividades))

  function correr(tarea: () => Promise<ResultadoUsuario>, exito: string) {
    iniciar(async () => {
      const resultado = await conAviso(tarea, exito)
      if (resultado.ok && resultado.password) setContrasena(resultado.password)
    })
  }

  return (
    <li className={cn("space-y-3 py-4", usuario.deshabilitado && "opacity-60")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p>
          <span className="font-semibold">{usuario.nombre}</span>
          {soyYo ? <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-xs font-bold text-panel-muted">Vos</span> : null}
          {usuario.deshabilitado ? <span className="ml-2 rounded-full bg-panel-line px-2 py-0.5 text-xs font-bold text-panel-muted">Deshabilitado</span> : null}
          <span className="block text-sm text-panel-muted">{usuario.email}</span>
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <button
            type="button"
            disabled={pendiente}
            className="text-panel-tostado underline-offset-4 hover:underline"
            onClick={() => {
              if (window.confirm(`¿Generar una contraseña nueva para ${usuario.nombre}? La actual deja de funcionar.`)) {
                correr(() => generarContrasena(usuario.id), `Listo, la contraseña anterior de ${usuario.nombre} dejó de funcionar. Pasale la nueva.`)
              }
            }}
          >
            Nueva contraseña
          </button>
          {!soyYo ? (
            <button
              type="button"
              disabled={pendiente}
              className="text-panel-muted underline-offset-4 hover:underline"
              onClick={() =>
                correr(() => cambiarAcceso(usuario.id, usuario.deshabilitado), usuario.deshabilitado ? `${usuario.nombre} puede volver a entrar al panel.` : `${usuario.nombre} ya no puede entrar al panel.`)
              }
            >
              {usuario.deshabilitado ? "Habilitar" : "Deshabilitar"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ElegirRoles elegidos={roles} onChange={setRoles} prefijo={usuario.id} />
        {cambiaron ? (
          <Button type="button" disabled={pendiente || roles.length === 0} className="h-9 bg-panel-ink text-white" onClick={() => correr(() => cambiarRoles(usuario.id, roles, actividades), `Listo, cambiaron los paneles de ${usuario.nombre}.`)}>
            Guardar paneles
          </Button>
        ) : null}
      </div>
      {roles.includes("profesor") ? <ElegirActividades elegidas={actividades} onChange={setActividades} prefijo={usuario.id} /> : null}
      {contrasena ? <ContrasenaNueva email={usuario.email} password={contrasena} onCerrar={() => setContrasena(null)} /> : null}
    </li>
  )
}
