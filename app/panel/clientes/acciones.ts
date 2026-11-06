"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, exigir, type Resultado } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { tiposDePlantilla } from "@/lib/panel/plantillas"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"

const tipo = z.enum(tiposDePlantilla.map((item) => item.id) as [string, ...string[]])

const plantilla = z.object({
  id: z.number().int().positive().optional(),
  tipo,
  nombre: z.string().trim().min(1, "Poné un nombre para reconocerlo.").max(60, "Es muy largo: dejalo en 60 letras."),
  texto: z.string().trim().min(1, "Escribí el mensaje.").max(2000, "Es muy largo: dejalo en 2000 letras."),
})

export async function guardarPlantilla(pedido: z.input<typeof plantilla>): Promise<Resultado<{ id: number }>> {
  return accion("guardarPlantilla", async () => {
    const sesion = await permisoParaAccion("clientes")
    const { id, ...datos } = plantilla.parse(pedido)
    const guardada = id
      ? await db().plantillaWhatsapp.update({ where: { id }, data: datos, select: { id: true } })
      : await db().plantillaWhatsapp.create({ data: { ...datos, orden: await db().plantillaWhatsapp.count({ where: { tipo: datos.tipo } }) }, select: { id: true } })
    revalidatePath("/panel", "layout")
    await anotar(sesion, { seccion: "clientes", accion: id ? "editó mensaje" : "creó mensaje", detalle: `${id ? "Editó" : "Creó"} el mensaje de WhatsApp «${datos.nombre}»` })
    return { ok: true, id: guardada.id }
  })
}

export async function borrarPlantilla(id: number): Promise<Resultado> {
  return accion("borrarPlantilla", async () => {
    const sesion = await permisoParaAccion("clientes")
    const actual = await db().plantillaWhatsapp.findUnique({ where: { id: z.number().int().positive().parse(id) }, select: { tipo: true, nombre: true } })
    exigir(actual, "Ese mensaje ya no estaba. Actualizá la página.")
    // Siempre queda al menos uno de cada tipo, así el envío tiene qué proponer.
    exigir((await db().plantillaWhatsapp.count({ where: { tipo: actual.tipo } })) > 1, "Es el único mensaje de ese tipo: editalo en vez de borrarlo.")
    await db().plantillaWhatsapp.delete({ where: { id } })
    revalidatePath("/panel", "layout")
    await anotar(sesion, { seccion: "clientes", accion: "borró mensaje", detalle: `Borró el mensaje de WhatsApp «${actual.nombre}»` })
    return { ok: true }
  })
}

const contacto = z.object({
  clienteId: z.number().int().positive().optional(),
  reservaId: z.number().int().positive().optional(),
  tipo,
  plantilla: z.string().max(60).optional(),
})

/// Anota que se abrió un WhatsApp para el cliente (o la reserva). Es lo que muestra el
/// tilde de contacto en Puerta.
export async function anotarWhatsapp(pedido: z.input<typeof contacto>): Promise<Resultado> {
  return accion("anotarWhatsapp", async () => {
    const sesion = await permisoParaAccion("clientes", "puerta")
    const datos = contacto.parse(pedido)
    const reserva = datos.reservaId ? await db().reserva.findUnique({ where: { id: datos.reservaId }, select: { clienteId: true } }) : null
    const clienteId = reserva?.clienteId ?? datos.clienteId
    exigir(clienteId, "No encontramos a quién se le escribió. Actualizá la página.")
    await db().contactoWhatsapp.create({
      data: { clienteId, reservaId: reserva ? datos.reservaId : null, tipo: datos.tipo, plantilla: datos.plantilla ?? null, por: sesion.user.name.slice(0, 80) },
    })
    if (reserva && datos.tipo === "ticket") await db().reserva.update({ where: { id: datos.reservaId }, data: { ticketEnviadoEn: new Date() } })
    revalidatePath("/panel", "layout")
    return { ok: true }
  })
}
