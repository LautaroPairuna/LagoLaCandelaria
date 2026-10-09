import type { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/prisma"

/// Dónde pasó cada cosa, para filtrar el registro de actividad.
export const seccionesDeActividad = {
  acceso: "Acceso",
  reservas: "Reservas",
  puerta: "Puerta",
  caja: "Caja",
  restaurante: "Restaurante",
  bar: "Bar",
  actividades: "Actividades",
  usuarios: "Usuarios",
} as const

export type SeccionDeActividad = keyof typeof seccionesDeActividad

// Las acciones que mueven plata: son las que muestra la Actividad de la caja.
export const accionesDePlata = ["cobro", "cobro anulado", "movimiento", "movimiento borrado"]

export type DatosDeActividad = {
  usuario: string
  userId?: string | null
  seccion: SeccionDeActividad
  accion: string
  detalle: string
  reservaId?: number
  monto?: number
}

export function autorDe(sesion: { user: { id: string; name: string } }) {
  return { usuario: sesion.user.name.slice(0, 80), userId: sesion.user.id }
}

/// Deja asentado quién hizo qué. Con la plata va dentro de la misma transacción que el
/// cambio, así no queda un cobro sin registro ni un registro sin cobro.
export function registrarActividad(cliente: Prisma.TransactionClient, datos: DatosDeActividad) {
  return cliente.actividad.create({
    data: {
      usuario: datos.usuario.slice(0, 80),
      userId: datos.userId ?? null,
      seccion: datos.seccion,
      accion: datos.accion.slice(0, 40),
      detalle: datos.detalle.slice(0, 255),
      reservaId: datos.reservaId ?? null,
      monto: datos.monto ?? null,
    },
  })
}

/// Para todo lo demás: se anota después de hacer el cambio y, si el registro falla, la
/// acción no se cae (queda en el log del servidor).
export async function anotar(sesion: { user: { id: string; name: string } }, datos: Omit<DatosDeActividad, "usuario" | "userId">) {
  try {
    await registrarActividad(db(), { ...autorDe(sesion), ...datos })
  } catch (error) {
    console.error(`[anotar] ${datos.seccion}/${datos.accion}: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`)
  }
}
