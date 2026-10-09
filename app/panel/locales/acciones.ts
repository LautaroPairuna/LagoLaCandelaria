"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import type { Local } from "@/generated/prisma/enums"
import { accion, ErrorHumano, exigir, type Resultado } from "@/lib/errores"
import { registrarActividad } from "@/lib/panel/actividad"
import { locales, totalDeCuenta } from "@/lib/panel/local"
import { pesos } from "@/lib/predio/tarifas"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { aFechaDb, esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

const local = z.enum(["RESTAURANTE", "BAR"])
const id = z.number().int().positive()

async function permiso(cual: Local) {
  return permisoParaAccion(locales[cual].panel)
}

function refrescar(cual: Local) {
  revalidatePath(locales[cual].base, "layout")
  revalidatePath(`/menu/${locales[cual].slug}`)
}

const quien = (sesion: { user: { name: string } }) => sesion.user.name.slice(0, 80)

const nombreDeForma = { EFECTIVO: "efectivo", DEBITO: "débito", TRANSFERENCIA: "transferencia" } as const

// —— Menú ——

const itemDeMenu = z.object({
  id: id.optional(),
  local,
  categoria: z.string().trim().min(2, "Escribí la categoría: «Minutas», «Bebidas», «Postres».").max(60, "Es muy larga: dejala en 60 letras."),
  nombre: z.string().trim().min(2, "Escribí el nombre del plato.").max(80, "Es muy largo: dejalo en 80 letras."),
  descripcion: z.string().trim().max(200, "Es muy larga: resumila en 200 letras.").optional(),
  precio: z.number("Escribí el precio en pesos, sin puntos.").int("Escribí el precio sin centavos.").positive("El precio tiene que ser mayor a cero.").max(10_000_000, "Ese precio es demasiado alto. Revisalo."),
})

export async function guardarItemDeMenu(pedido: z.input<typeof itemDeMenu>): Promise<Resultado<{ id: number }>> {
  return accion("guardarItemDeMenu", async () => {
    const datos = itemDeMenu.parse(pedido)
    await permiso(datos.local)
    const { id: existente, ...resto } = datos
    const campos = { ...resto, descripcion: resto.descripcion || null }
    let guardado: { id: number }
    if (existente) {
      const actual = await db().itemDeMenu.findUnique({ where: { id: existente }, select: { local: true } })
      if (!actual || actual.local !== datos.local) throw new ErrorHumano("Ese plato ya no estaba en la carta. Te mostramos cómo quedó.")
      guardado = await db().itemDeMenu.update({ where: { id: existente }, data: campos, select: { id: true } })
    } else {
      const ultimo = await db().itemDeMenu.aggregate({ where: { local: datos.local }, _max: { orden: true } })
      guardado = await db().itemDeMenu.create({ data: { ...campos, orden: (ultimo._max.orden ?? 0) + 1 }, select: { id: true } })
    }
    refrescar(datos.local)
    return { ok: true, id: guardado.id }
  })
}

async function itemDelMenu(itemId: number) {
  const item = await db().itemDeMenu.findUnique({ where: { id: itemId }, select: { local: true } })
  if (!item) throw new ErrorHumano("Ese plato ya no estaba en la carta. Te mostramos cómo quedó.")
  return item
}

export async function cambiarDisponible(pedido: { id: number; disponible: boolean }): Promise<Resultado<{ id: number }>> {
  return accion("cambiarDisponible", async () => {
    const itemId = id.parse(pedido.id)
    const item = await itemDelMenu(itemId)
    await permiso(item.local)
    await db().itemDeMenu.update({ where: { id: itemId }, data: { disponible: z.boolean().parse(pedido.disponible) } })
    refrescar(item.local)
    return { ok: true, id: itemId }
  })
}

export async function borrarItemDeMenu(pedido: { id: number }): Promise<Resultado<{ id: number }>> {
  return accion("borrarItemDeMenu", async () => {
    const itemId = id.parse(pedido.id)
    const item = await itemDelMenu(itemId)
    await permiso(item.local)
    await db().itemDeMenu.delete({ where: { id: itemId } })
    refrescar(item.local)
    return { ok: true, id: itemId }
  })
}

// —— Cuentas ——

const nuevaCuenta = z.object({
  local,
  fecha: z.string(),
  mesa: z.string().trim().min(1, "Escribí la mesa o el lugar.").max(30, "Es muy largo: dejalo en 30 letras."),
  titular: z.string().trim().max(80, "Es muy largo: dejalo en 80 letras.").optional(),
  reservaId: id.optional(),
})

export async function abrirCuenta(pedido: z.input<typeof nuevaCuenta>): Promise<Resultado<{ id: number }>> {
  return accion("abrirCuenta", async () => {
    const datos = nuevaCuenta.parse(pedido)
    const sesion = await permiso(datos.local)
    const hoy = hoyEnElPredio()
    exigir(esFechaIso(datos.fecha) && datos.fecha <= sumarDiasIso(hoy, 1) && datos.fecha >= sumarDiasIso(hoy, -7), "Las cuentas se abren para hoy o para algún día de esta semana.")
    const cuenta = await db().cuentaDeMesa.create({
      data: { local: datos.local, fecha: aFechaDb(datos.fecha), mesa: datos.mesa, titular: datos.titular || null, reservaId: datos.reservaId ?? null, abiertaPor: quien(sesion) },
      select: { id: true },
    })
    refrescar(datos.local)
    return { ok: true, id: cuenta.id }
  })
}

/// Trae la cuenta y verifica el permiso. Una cuenta cobrada no se toca: hay que reabrirla.
async function cuentaParaCambiar(cuentaId: number, abierta = true) {
  const cuenta = await db().cuentaDeMesa.findUnique({ where: { id: cuentaId }, select: { id: true, local: true, estado: true, mesa: true } })
  if (!cuenta) throw new ErrorHumano("Esa cuenta ya no estaba: alguien la borró. Te mostramos cómo quedó.")
  const sesion = await permiso(cuenta.local)
  if (abierta && cuenta.estado === "COBRADA") throw new ErrorHumano(`La cuenta de ${cuenta.mesa} ya está cobrada. Si hay que sumar algo, reabrila primero.`)
  return { cuenta, sesion }
}

const agregado = z.object({
  cuentaId: id,
  menuItemId: id.optional(),
  // Algo fuera de la carta: nombre y precio a mano.
  nombre: z.string().trim().min(2, "Escribí qué es.").max(80, "Es muy largo: dejalo en 80 letras.").optional(),
  precio: z.number().int().positive("Escribí el precio en pesos.").max(10_000_000).optional(),
  cantidad: z.number().int().min(1).max(99).default(1),
})

export async function agregarAlPedido(pedido: z.input<typeof agregado>): Promise<Resultado<{ id: number }>> {
  return accion("agregarAlPedido", async () => {
    const datos = agregado.parse(pedido)
    const { cuenta } = await cuentaParaCambiar(datos.cuentaId)
    let item: { nombre: string; precio: number; menuItemId: number | null }
    if (datos.menuItemId) {
      const delMenu = await db().itemDeMenu.findUnique({ where: { id: datos.menuItemId }, select: { local: true, nombre: true, precio: true } })
      if (!delMenu || delMenu.local !== cuenta.local) throw new ErrorHumano("Ese plato ya no está en la carta. Elegí otro.")
      item = { nombre: delMenu.nombre, precio: delMenu.precio, menuItemId: datos.menuItemId }
    } else {
      exigir(datos.nombre && datos.precio, "Elegí un plato de la carta, o escribí qué es y cuánto sale.")
      item = { nombre: datos.nombre, precio: datos.precio, menuItemId: null }
    }
    // El mismo plato al mismo precio suma cantidad en vez de repetir el renglón.
    const igual = await db().itemDeCuenta.findFirst({ where: { cuentaId: cuenta.id, nombre: item.nombre, precio: item.precio }, select: { id: true, cantidad: true } })
    const guardado = igual
      ? await db().itemDeCuenta.update({ where: { id: igual.id }, data: { cantidad: Math.min(igual.cantidad + datos.cantidad, 99) }, select: { id: true } })
      : await db().itemDeCuenta.create({ data: { cuentaId: cuenta.id, ...item, cantidad: datos.cantidad }, select: { id: true } })
    refrescar(cuenta.local)
    return { ok: true, id: guardado.id }
  })
}

export async function cambiarCantidad(pedido: { itemId: number; cantidad: number }): Promise<Resultado<{ id: number }>> {
  return accion("cambiarCantidad", async () => {
    const itemId = id.parse(pedido.itemId)
    const cantidad = z.number().int().min(0).max(99).parse(pedido.cantidad)
    const item = await db().itemDeCuenta.findUnique({ where: { id: itemId }, select: { cuentaId: true } })
    if (!item) throw new ErrorHumano("Ese renglón ya no estaba en el pedido. Te mostramos cómo quedó.")
    const { cuenta } = await cuentaParaCambiar(item.cuentaId)
    if (cantidad === 0) await db().itemDeCuenta.delete({ where: { id: itemId } })
    else await db().itemDeCuenta.update({ where: { id: itemId }, data: { cantidad } })
    refrescar(cuenta.local)
    return { ok: true, id: itemId }
  })
}

export async function cobrarCuenta(pedido: { cuentaId: number; forma: "EFECTIVO" | "DEBITO" | "TRANSFERENCIA" }): Promise<Resultado<{ id: number }>> {
  return accion("cobrarCuenta", async () => {
    const { cuenta, sesion } = await cuentaParaCambiar(id.parse(pedido.cuentaId))
    const forma = z.enum(["EFECTIVO", "DEBITO", "TRANSFERENCIA"]).parse(pedido.forma)
    const items = await db().itemDeCuenta.findMany({ where: { cuentaId: cuenta.id }, select: { precio: true, cantidad: true } })
    exigir(items.length > 0, `La cuenta de ${cuenta.mesa} está vacía: cargá el pedido antes de cobrar.`)
    const total = totalDeCuenta(items)
    await db().$transaction(async (tx) => {
      await tx.cuentaDeMesa.update({ where: { id: cuenta.id }, data: { estado: "COBRADA", forma, cobradaEn: new Date(), cobradaPor: quien(sesion) } })
      await registrarActividad(tx, {
        usuario: quien(sesion),
        accion: "cobro",
        detalle: `${locales[cuenta.local].nombre}: cobró ${pesos(total)} en ${nombreDeForma[forma]} a ${cuenta.mesa}`,
        monto: total,
      })
    })
    refrescar(cuenta.local)
    return { ok: true, id: cuenta.id }
  })
}

export async function reabrirCuenta(pedido: { cuentaId: number }): Promise<Resultado<{ id: number }>> {
  return accion("reabrirCuenta", async () => {
    const { cuenta, sesion } = await cuentaParaCambiar(id.parse(pedido.cuentaId), false)
    if (cuenta.estado === "COBRADA") {
      const items = await db().itemDeCuenta.findMany({ where: { cuentaId: cuenta.id }, select: { precio: true, cantidad: true } })
      await db().$transaction(async (tx) => {
        await tx.cuentaDeMesa.update({ where: { id: cuenta.id }, data: { estado: "ABIERTA", forma: null, cobradaEn: null, cobradaPor: null } })
        await registrarActividad(tx, {
          usuario: quien(sesion),
          accion: "cobro anulado",
          detalle: `${locales[cuenta.local].nombre}: reabrió la cuenta de ${cuenta.mesa}, que estaba cobrada`,
          monto: totalDeCuenta(items),
        })
      })
    }
    refrescar(cuenta.local)
    return { ok: true, id: cuenta.id }
  })
}

export async function borrarCuenta(pedido: { cuentaId: number }): Promise<Resultado<{ id: number }>> {
  return accion("borrarCuenta", async () => {
    const { cuenta } = await cuentaParaCambiar(id.parse(pedido.cuentaId))
    await db().cuentaDeMesa.delete({ where: { id: cuenta.id } })
    refrescar(cuenta.local)
    return { ok: true, id: cuenta.id }
  })
}
