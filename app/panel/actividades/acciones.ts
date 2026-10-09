"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, ErrorHumano, exigir, type Resultado } from "@/lib/errores"
import { esActividadConProfesor, nombreDeActividad } from "@/lib/panel/actividades"
import { rolesDe } from "@/lib/panel/roles"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { aFechaDb, deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

const id = z.number().int().positive()

/// El profesor marca solo las actividades que tiene a cargo; la administración, todas.
async function permisoDeActividad(actividad: string) {
  exigir(esActividadConProfesor(actividad), "Esa actividad no se marca desde el panel.")
  const sesion = await permisoParaAccion("actividades")
  if (!rolesDe(sesion.user.role).includes("admin")) {
    const asignada = await db().profesorDeActividad.findUnique({ where: { userId_actividad: { userId: sesion.user.id, actividad } } })
    if (!asignada) throw new ErrorHumano(`No tenés ${nombreDeActividad(actividad).toLowerCase()} a cargo. Pedile a administración que te la asigne.`)
  }
  return sesion
}

/// La reserva tiene que estar en el predio hoy: las actividades se marcan el día de la visita.
async function reservaDeHoy(reservaId: number) {
  const reserva = await db().reserva.findUnique({ where: { id: reservaId }, select: { estado: true, desde: true, hasta: true, adultos: true, menores: true, sinCargo: true, personas: { select: { id: true } } } })
  if (!reserva || reserva.estado === "CANCELADA") throw new ErrorHumano("Esa reserva se canceló. Te mostramos cómo quedó.")
  const hoy = hoyEnElPredio()
  exigir(deFechaDb(reserva.desde) <= hoy && deFechaDb(reserva.hasta) >= hoy, "Las actividades se marcan el día de la visita.")
  return reserva
}

function refrescar() {
  revalidatePath("/panel/actividades", "layout")
}

const marcado = z.object({
  reservaId: id,
  actividad: z.string().max(40),
  personas: z.array(id).min(1).max(200),
  hizo: z.boolean(),
})

/// Marca (o desmarca) que una o varias personas hicieron la actividad. Cada persona la
/// puede hacer una sola vez por visita: si ya estaba marcada, no se duplica.
export async function marcarActividad(pedido: z.input<typeof marcado>): Promise<Resultado<{ personas: number }>> {
  return accion("marcarActividad", async () => {
    const datos = marcado.parse(pedido)
    const sesion = await permisoDeActividad(datos.actividad)
    const reserva = await reservaDeHoy(datos.reservaId)
    const propias = new Set(reserva.personas.map((persona) => persona.id))
    exigir(datos.personas.every((persona) => propias.has(persona)), "Alguna de esas personas no es de esta reserva. Recargá la página.")

    if (datos.hizo) {
      const ya = await db().actividadRealizada.findMany({ where: { actividad: datos.actividad, personaId: { in: datos.personas } }, select: { personaId: true } })
      const yaHicieron = new Set(ya.map((fila) => fila.personaId))
      const nuevas = datos.personas.filter((persona) => !yaHicieron.has(persona))
      exigir(nuevas.length > 0, `Ya tenían ${nombreDeActividad(datos.actividad).toLowerCase()} marcada: cada persona la hace una sola vez por visita.`)
      await db().actividadRealizada.createMany({
        data: nuevas.map((personaId) => ({
          reservaId: datos.reservaId,
          personaId,
          actividad: datos.actividad,
          fecha: aFechaDb(hoyEnElPredio()),
          registradoPor: sesion.user.name.slice(0, 80),
        })),
        skipDuplicates: true,
      })
      refrescar()
      return { ok: true, personas: nuevas.length }
    }

    const borradas = await db().actividadRealizada.deleteMany({ where: { actividad: datos.actividad, reservaId: datos.reservaId, personaId: { in: datos.personas } } })
    refrescar()
    return { ok: true, personas: borradas.count }
  })
}

const conteo = z.object({ reservaId: id, actividad: z.string().max(40), cantidad: z.number().int().min(0).max(2000) })

/// Para grupos sin la lista de personas (estudiantiles): cuántos del grupo ya la hicieron.
export async function contarEnGrupo(pedido: z.input<typeof conteo>): Promise<Resultado<{ cantidad: number }>> {
  return accion("contarEnGrupo", async () => {
    const datos = conteo.parse(pedido)
    const sesion = await permisoDeActividad(datos.actividad)
    const reserva = await reservaDeHoy(datos.reservaId)
    const total = reserva.adultos + reserva.menores + reserva.sinCargo
    exigir(datos.cantidad <= total, `El grupo es de ${total} personas: no pueden ser más los que la hicieron.`)
    const fila = await db().actividadRealizada.findFirst({ where: { reservaId: datos.reservaId, actividad: datos.actividad, personaId: null }, select: { id: true } })
    if (datos.cantidad === 0) {
      if (fila) await db().actividadRealizada.delete({ where: { id: fila.id } })
    } else if (fila) {
      await db().actividadRealizada.update({ where: { id: fila.id }, data: { cantidad: datos.cantidad, registradoPor: sesion.user.name.slice(0, 80) } })
    } else {
      await db().actividadRealizada.create({
        data: { reservaId: datos.reservaId, actividad: datos.actividad, fecha: aFechaDb(hoyEnElPredio()), cantidad: datos.cantidad, registradoPor: sesion.user.name.slice(0, 80) },
      })
    }
    refrescar()
    return { ok: true, cantidad: datos.cantidad }
  })
}
