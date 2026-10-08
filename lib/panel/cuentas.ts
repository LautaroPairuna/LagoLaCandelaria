import type { Local } from "@/generated/prisma/enums"
import { totalDeCuenta } from "@/lib/panel/local"
import { aFechaDb, deFechaDb } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

export async function menuDelLocal(local: Local, soloDisponibles = false) {
  return db().itemDeMenu.findMany({
    where: { local, ...(soloDisponibles ? { disponible: true } : {}) },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, categoria: true, nombre: true, descripcion: true, precio: true, disponible: true },
  })
}

export type ItemDelMenu = Awaited<ReturnType<typeof menuDelLocal>>[number]

/// Las cuentas del día: primero las abiertas (lo que hay que atender y cobrar), después
/// las cobradas.
export async function cuentasDelDia(local: Local, fecha: string) {
  const filas = await db().cuentaDeMesa.findMany({
    where: { local, fecha: aFechaDb(fecha) },
    orderBy: [{ estado: "asc" }, { creadoEn: "asc" }],
    include: { items: { orderBy: { creadoEn: "asc" }, select: { id: true, nombre: true, precio: true, cantidad: true } } },
  })
  return filas.map((cuenta) => ({
    id: cuenta.id,
    fecha: deFechaDb(cuenta.fecha),
    mesa: cuenta.mesa,
    titular: cuenta.titular,
    reservaId: cuenta.reservaId,
    estado: cuenta.estado,
    forma: cuenta.forma,
    cobradaEn: cuenta.cobradaEn?.toISOString() ?? null,
    cobradaPor: cuenta.cobradaPor,
    abiertaPor: cuenta.abiertaPor,
    items: cuenta.items,
    total: totalDeCuenta(cuenta.items),
  }))
}

export type CuentaDelDia = Awaited<ReturnType<typeof cuentasDelDia>>[number]
