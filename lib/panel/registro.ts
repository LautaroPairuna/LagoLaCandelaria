import type { Prisma } from "@/generated/prisma/client"
import { seccionesDeActividad, type SeccionDeActividad } from "@/lib/panel/actividad"
import { etiquetaDeRol, rolesDe } from "@/lib/panel/roles"
import { sumarDiasIso } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

export const POR_PAGINA = 200

export type FiltroDeRegistro = { desde: string; hasta: string; userId?: string; seccion?: SeccionDeActividad; texto?: string }

export function esSeccionDeActividad(valor: string | undefined): valor is SeccionDeActividad {
  return Boolean(valor && valor in seccionesDeActividad)
}

// Las fechas del registro son momentos; el período se toma en días del predio (UTC−3).
function condicion({ desde, hasta, userId, seccion, texto }: FiltroDeRegistro): Prisma.ActividadWhereInput {
  const inicio = new Date(`${desde}T03:00:00.000Z`)
  const fin = new Date(`${sumarDiasIso(hasta, 1)}T03:00:00.000Z`)
  return {
    creadoEn: { gte: inicio, lt: fin },
    ...(userId ? { userId } : {}),
    ...(seccion ? { seccion } : {}),
    ...(texto ? { OR: [{ detalle: { contains: texto } }, { usuario: { contains: texto } }, { accion: { contains: texto } }] } : {}),
  }
}

/// El registro de lo que hizo el equipo en el panel, con el rol actual de cada persona.
export async function registroDeActividad(filtro: FiltroDeRegistro, cantidad = POR_PAGINA) {
  const where = condicion(filtro)
  const [total, filas, porUsuario, usuarios] = await Promise.all([
    db().actividad.count({ where }),
    db().actividad.findMany({ where, orderBy: { creadoEn: "desc" }, take: cantidad }),
    db().actividad.groupBy({ by: ["userId", "usuario"], where, _count: { _all: true } }),
    db().user.findMany({ select: { id: true, name: true, email: true, role: true, banned: true }, orderBy: { name: "asc" } }),
  ])
  const quien = new Map(usuarios.map((usuario) => [usuario.id, usuario]))
  const rolesDeUsuario = (userId: string | null) => {
    const usuario = userId ? quien.get(userId) : undefined
    return usuario ? rolesDe(usuario.role).map((rol) => etiquetaDeRol[rol]) : []
  }
  // Una misma persona puede figurar con nombres viejos: se suma por usuario.
  const resumen = new Map<string, { clave: string; nombre: string; roles: string[]; acciones: number }>()
  for (const fila of porUsuario) {
    const clave = fila.userId ?? `nombre:${fila.usuario}`
    const actual = resumen.get(clave) ?? { clave, nombre: (fila.userId && quien.get(fila.userId)?.name) || fila.usuario, roles: rolesDeUsuario(fila.userId), acciones: 0 }
    actual.acciones += fila._count._all
    resumen.set(clave, actual)
  }
  return {
    total,
    filas: filas.map((fila) => ({
      id: fila.id,
      creadoEn: fila.creadoEn,
      usuario: (fila.userId && quien.get(fila.userId)?.name) || fila.usuario,
      email: fila.userId ? (quien.get(fila.userId)?.email ?? null) : null,
      roles: rolesDeUsuario(fila.userId),
      eliminado: Boolean(fila.userId && !quien.has(fila.userId)),
      seccion: (esSeccionDeActividad(fila.seccion) ? fila.seccion : "caja") as SeccionDeActividad,
      accion: fila.accion,
      detalle: fila.detalle,
      reservaId: fila.reservaId,
      monto: fila.monto,
    })),
    porUsuario: [...resumen.values()].sort((a, b) => b.acciones - a.acciones),
    usuarios: usuarios.map((usuario) => ({ id: usuario.id, nombre: usuario.name, roles: rolesDe(usuario.role).map((rol) => etiquetaDeRol[rol]), deshabilitado: Boolean(usuario.banned) })),
  }
}

export type FilaDeRegistro = Awaited<ReturnType<typeof registroDeActividad>>["filas"][number]

/// Para filtrar por día sin depender del huso del servidor.
export function diaDelPredio(momento: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(momento)
}
