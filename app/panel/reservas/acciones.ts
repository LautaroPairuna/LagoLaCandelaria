"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, exigir, type Resultado } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"

const idDeReserva = z.number().int().positive()

async function describirReserva(id: number) {
  const reserva = await db().reserva.findUnique({ where: { id }, select: { codigo: true, institucion: true, desde: true, cliente: { select: { nombre: true, apellido: true } } } })
  if (!reserva) return ""
  return `${reserva.institucion ?? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`} (${reserva.codigo}), del ${reserva.desde.toISOString().slice(0, 10).split("-").reverse().join("/")}`
}

export async function confirmarReserva(id: number): Promise<Resultado> {
  return accion("confirmarReserva", async () => {
    const sesion = await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const { count } = await db().reserva.updateMany({ where: { id: reservaId, estado: "PENDIENTE" }, data: { estado: "CONFIRMADA" } })
    revalidatePath("/panel", "layout")
    exigir(count > 0, "Esta reserva ya no estaba pendiente: alguien la confirmó o la canceló recién. Ya te mostramos cómo quedó.")
    await anotar(sesion, { seccion: "reservas", accion: "confirmó", detalle: `Confirmó la reserva ${reservaId}, ${await describirReserva(reservaId)}`, reservaId })
    return { ok: true }
  })
}

/// Desde la lista se puede volver una confirmada a «a confirmar» si se confirmó por error,
/// mientras nadie del grupo haya llegado.
export async function volverAConfirmar(id: number): Promise<Resultado> {
  return accion("volverAConfirmar", async () => {
    const sesion = await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const { count } = await db().reserva.updateMany({ where: { id: reservaId, estado: "CONFIRMADA", ingresoEn: null }, data: { estado: "PENDIENTE" } })
    revalidatePath("/panel", "layout")
    exigir(count > 0, "Esta reserva ya no se puede volver a «a confirmar»: cambió de estado o ya llegó alguien. Ya te mostramos cómo quedó.")
    await anotar(sesion, { seccion: "reservas", accion: "volvió a a confirmar", detalle: `Volvió a «a confirmar» la reserva ${reservaId}, ${await describirReserva(reservaId)}`, reservaId })
    return { ok: true }
  })
}

const idsDeReservas = z.array(idDeReserva).min(1, "No hay reservas para confirmar.").max(300, "Son demasiadas juntas: filtrá la lista y confirmalas por partes.")

/// Confirma de una vez las que siguen «a confirmar» de la lista que se está viendo. Las que
/// otro ya confirmó o canceló se saltean.
export async function confirmarVarias(ids: number[]): Promise<Resultado<{ confirmadas: number }>> {
  return accion("confirmarVarias", async () => {
    const sesion = await permisoParaAccion("reservas")
    const lista = idsDeReservas.parse(ids)
    const pendientes = await db().reserva.findMany({ where: { id: { in: lista }, estado: "PENDIENTE" }, select: { id: true, codigo: true } })
    exigir(pendientes.length > 0, "Ninguna de esas reservas seguía a confirmar. Ya te mostramos cómo quedaron.")
    const { count } = await db().reserva.updateMany({ where: { id: { in: pendientes.map((reserva) => reserva.id) }, estado: "PENDIENTE" }, data: { estado: "CONFIRMADA" } })
    revalidatePath("/panel", "layout")
    await anotar(sesion, { seccion: "reservas", accion: "confirmó varias", detalle: `Confirmó ${count} ${count === 1 ? "reserva" : "reservas"} juntas: ${pendientes.map((reserva) => reserva.codigo).join(", ")}` })
    return { ok: true, confirmadas: count }
  })
}

/// Anota que se abrió el WhatsApp con el ticket, para que el envío guiado siga con la próxima.
export async function marcarTicketEnviado(id: number): Promise<Resultado> {
  return accion("marcarTicketEnviado", async () => {
    await permisoParaAccion("reservas", "puerta")
    const reservaId = idDeReserva.parse(id)
    await db().reserva.updateMany({ where: { id: reservaId, estado: "CONFIRMADA" }, data: { ticketEnviadoEn: new Date() } })
    revalidatePath("/panel/puerta")
    return { ok: true }
  })
}

// Cancelar libera los lugares: se borran sus ocupaciones en la misma transacción.
export async function cancelarReserva(id: number): Promise<Resultado> {
  return accion("cancelarReserva", async () => {
    const sesion = await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const [, { count }] = await db().$transaction([
      db().ocupacion.deleteMany({ where: { reservaId } }),
      db().reserva.updateMany({ where: { id: reservaId, estado: { not: "CANCELADA" } }, data: { estado: "CANCELADA" } }),
    ])
    revalidatePath("/panel", "layout")
    exigir(count > 0, "Esta reserva ya estaba cancelada. Ya te mostramos cómo quedó.")
    await anotar(sesion, { seccion: "reservas", accion: "canceló", detalle: `Canceló la reserva ${reservaId}, ${await describirReserva(reservaId)}`, reservaId })
    return { ok: true }
  })
}

const respuestas = z.enum(["CONFIRMO", "CANCELO", "SIN_RESPUESTA"])

/// La respuesta al mensaje del día anterior. Si avisa que no viene, la reserva se cancela
/// y se liberan los lugares.
export async function responderConfirmacion(id: number, respuesta: z.input<typeof respuestas>): Promise<Resultado> {
  return accion("responderConfirmacion", async () => {
    const sesion = await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const valor = respuestas.parse(respuesta)
    if (valor === "CANCELO") {
      await db().$transaction([
        db().ocupacion.deleteMany({ where: { reservaId } }),
        db().reserva.update({ where: { id: reservaId }, data: { estado: "CANCELADA", confirmacion: "CANCELO", confirmacionEn: new Date() } }),
      ])
    } else {
      await db().reserva.update({
        where: { id: reservaId },
        data: valor === "CONFIRMO" ? { confirmacion: "CONFIRMO", confirmacionEn: new Date() } : { confirmacion: null, confirmacionEn: null },
      })
    }
    revalidatePath("/panel", "layout")
    const texto = { CONFIRMO: "confirmó que viene", CANCELO: "avisó que no viene (cancelada)", SIN_RESPUESTA: "volvió a sin respuesta" }[valor]
    await anotar(sesion, { seccion: "reservas", accion: valor === "CANCELO" ? "canceló" : "confirmación", detalle: `Reserva ${reservaId}: ${texto}. ${await describirReserva(reservaId)}`, reservaId })
    return { ok: true }
  })
}
