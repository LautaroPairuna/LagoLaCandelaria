import type { Metadata } from "next"

import { FilaUsuario, NuevoUsuario } from "@/components/panel/usuarios"
import { rolesDe } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"

export const metadata: Metadata = { title: "Usuarios y permisos" }

export default async function Usuarios() {
  const sesion = await exigirPanel("general")
  const usuarios = await db().user.findMany({
    orderBy: [{ banned: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, banned: true },
  })
  const asignaciones = await db().profesorDeActividad.findMany({ select: { userId: true, actividad: true } })
  const actividadesDe = (userId: string) => asignaciones.filter((fila) => fila.userId === userId).map((fila) => fila.actividad)

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <section className="rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
        <h2 className="font-display text-2xl tracking-tight">Equipo</h2>
        <p className="mt-1 text-sm text-panel-muted">
          Cada persona entra solo a los paneles marcados. Administración ve todo, incluido este panel.
        </p>
        <ul className="mt-2 divide-y divide-panel-line">
          {usuarios.map((usuario) => (
            <FilaUsuario
              key={usuario.id}
              soyYo={usuario.id === sesion.user.id}
              usuario={{ id: usuario.id, nombre: usuario.name, email: usuario.email, roles: rolesDe(usuario.role), actividades: actividadesDe(usuario.id), deshabilitado: Boolean(usuario.banned) }}
            />
          ))}
        </ul>
      </section>
      <NuevoUsuario />
    </div>
  )
}
