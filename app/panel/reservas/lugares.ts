"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { Prisma, type Modulo, type TipoUnidad } from "@/generated/prisma/client"
import { accion, ErrorHumano, exigir, type Resultado } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { aFechaDb, deFechaDb, fechasEntre, hoyEnElPredio } from "@/lib/predio/fechas"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

/// Entre qué lugares se puede cambiar: una parrilla por otra parrilla o un quincho, un
/// gazebo por otro gazebo o una palapa, y así.
const familias: TipoUnidad[][] = [["PARRILLA", "QUINCHO"], ["GAZEBO", "PALAPA"], ["BUNGALOW"], ["MESA_RESTAURANTE"], ["MESA_BAR"]]

/// Lo que se le puede asignar a una reserva que se quedó sin lugar. El restaurante no
/// entra: sus mesas se ocupan por hora y sin la reserva original no se sabe cuáles.
const paraAsignar: Partial<Record<Modulo, TipoUnidad[]>> = {
  FINDE_FAMILIA: ["PARRILLA", "QUINCHO", "GAZEBO", "PALAPA"],
  BUNGALOW: ["BUNGALOW"],
}

const familiaDe = (tipo: TipoUnidad) => familias.find((familia) => familia.includes(tipo))!
const nombreDe = (unidad: { tipo: TipoUnidad; etiqueta: string }) => `${nombreDeUnidad[unidad.tipo]} ${unidad.etiqueta}`
const clave = (fecha: string, hora: number) => `${fecha}|${hora}`

export type LugarParaElegir = { id: string; nombre: string; capacidad: number | null }
export type LugaresParaReasignar = {
  actuales: { id: string; nombre: string; opciones: LugarParaElegir[] }[]
  /// Sin lugar asignado: las opciones para asignarle uno (vacío si no se puede).
  paraAsignar: LugarParaElegir[]
}

/// La reserva, si todavía se le puede cambiar el lugar: vigente, no pasada y sin nadie
/// adentro. Una vez que ingresaron, el lugar ya es el que ocupan.
async function reservaReasignable(reservaId: number) {
  const reserva = await db().reserva.findUnique({
    where: { id: reservaId },
    select: {
      id: true,
      codigo: true,
      modulo: true,
      estado: true,
      desde: true,
      hasta: true,
      ingresoEn: true,
      detalle: true,
      personas: { where: { ingresoEn: { not: null } }, select: { id: true }, take: 1 },
      ocupaciones: { select: { unidadId: true, fecha: true, hora: true, unidad: { select: { tipo: true, etiqueta: true } } } },
    },
  })
  exigir(reserva, "Esa reserva ya no está. Actualizá la página.")
  exigir(reserva.estado !== "CANCELADA", "La reserva está cancelada: no tiene lugar para cambiar.")
  exigir(!reserva.ingresoEn && reserva.personas.length === 0, "El grupo ya ingresó: el lugar es el que están ocupando y ya no se reasigna.")
  exigir(deFechaDb(reserva.hasta) >= hoyEnElPredio(), "La reserva ya pasó: no se le cambia el lugar.")
  return reserva
}

type Reserva = Awaited<ReturnType<typeof reservaReasignable>>

/// Los días y horas que ocupa cada lugar de la reserva. Sin lugar, todos sus días enteros.
function turnosDe(reserva: Reserva, unidadId?: string) {
  const filas = reserva.ocupaciones.filter((fila) => !unidadId || fila.unidadId === unidadId)
  if (filas.length) return filas.map((fila) => ({ fecha: deFechaDb(fila.fecha), hora: fila.hora }))
  return fechasEntre(deFechaDb(reserva.desde), deFechaDb(reserva.hasta)).map((fecha) => ({ fecha, hora: 0 }))
}

/// Los lugares activos de esos tipos que están libres en todos esos turnos (sin contar a
/// la reserva misma).
async function libres(reserva: Reserva, tipos: TipoUnidad[], turnos: { fecha: string; hora: number }[]) {
  const pedidos = new Set(turnos.map((turno) => clave(turno.fecha, turno.hora)))
  const fechas = [...new Set(turnos.map((turno) => turno.fecha))]
  const [unidades, tomadas] = await Promise.all([
    db().unidad.findMany({ where: { tipo: { in: tipos }, activa: true }, orderBy: [{ tipo: "asc" }, { numero: "asc" }], select: { id: true, tipo: true, etiqueta: true, capacidad: true } }),
    db().ocupacion.findMany({
      where: { fecha: { in: fechas.map(aFechaDb) }, reservaId: { not: reserva.id }, unidad: { tipo: { in: tipos } } },
      select: { unidadId: true, fecha: true, hora: true },
    }),
  ])
  const ocupadas = new Set(tomadas.filter((fila) => pedidos.has(clave(deFechaDb(fila.fecha), fila.hora))).map((fila) => fila.unidadId))
  const propias = new Set(reserva.ocupaciones.map((fila) => fila.unidadId))
  return unidades.filter((unidad) => !ocupadas.has(unidad.id) && !propias.has(unidad.id)).map((unidad) => ({ id: unidad.id, nombre: nombreDe(unidad), capacidad: unidad.capacidad }))
}

const idDeReserva = z.number().int().positive()

export async function lugaresParaReasignar(id: number): Promise<Resultado<{ lugares: LugaresParaReasignar }>> {
  return accion("lugaresParaReasignar", async () => {
    await permisoParaAccion("reservas", "puerta")
    const reserva = await reservaReasignable(idDeReserva.parse(id))
    const unidades = [...new Map(reserva.ocupaciones.map((fila) => [fila.unidadId, fila.unidad])).entries()]
    const actuales = await Promise.all(
      unidades.map(async ([unidadId, unidad]) => ({ id: unidadId, nombre: nombreDe(unidad), opciones: await libres(reserva, familiaDe(unidad.tipo), turnosDe(reserva, unidadId)) })),
    )
    const tipos = paraAsignar[reserva.modulo]
    const asignables = !unidades.length && tipos ? await libres(reserva, tipos, turnosDe(reserva)) : []
    return { ok: true, lugares: { actuales, paraAsignar: asignables } }
  })
}

const pedidoDeReasignar = z.object({ reservaId: idDeReserva, desde: z.string().max(24).optional(), hacia: z.string().min(1).max(24) })

/// Cambia un lugar de la reserva por otro (o le asigna uno si no tenía). El índice único de
/// ocupaciones frena el cambio si otro lo tomó mientras tanto.
export async function reasignarLugar(pedido: z.input<typeof pedidoDeReasignar>): Promise<Resultado> {
  return accion("reasignarLugar", async () => {
    const sesion = await permisoParaAccion("reservas", "puerta")
    const datos = pedidoDeReasignar.parse(pedido)
    const reserva = await reservaReasignable(datos.reservaId)
    const actual = datos.desde ? reserva.ocupaciones.find((fila) => fila.unidadId === datos.desde) : undefined
    exigir(!datos.desde || actual, "Ese lugar ya no era de esta reserva. Actualizá la página.")
    const tipos = actual ? familiaDe(actual.unidad.tipo) : paraAsignar[reserva.modulo]
    exigir(tipos && (actual || reserva.ocupaciones.length === 0), "A esta reserva no se le puede asignar un lugar desde acá.")
    const turnos = turnosDe(reserva, datos.desde)
    const opciones = await libres(reserva, tipos, turnos)
    const nuevo = opciones.find((opcion) => opcion.id === datos.hacia)
    exigir(nuevo, "Ese lugar ya está ocupado esos días. Elegí otro.")

    const detalle = detalleDe(reserva.detalle)
    const lugaresPedidos = detalle.lugares && actual ? detalle.lugares.map((lugar) => (lugar.id === datos.desde ? { id: nuevo.id, nombre: nuevo.nombre } : lugar)) : detalle.lugares
    try {
      await db().$transaction([
        ...(actual
          ? [db().ocupacion.updateMany({ where: { reservaId: reserva.id, unidadId: actual.unidadId }, data: { unidadId: nuevo.id } })]
          : [db().ocupacion.createMany({ data: turnos.map((turno) => ({ reservaId: reserva.id, unidadId: nuevo.id, fecha: aFechaDb(turno.fecha), hora: turno.hora })) })]),
        ...(lugaresPedidos !== detalle.lugares ? [db().reserva.update({ where: { id: reserva.id }, data: { detalle: { ...detalle, lugares: lugaresPedidos } as unknown as Prisma.InputJsonValue } })] : []),
      ])
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ErrorHumano(`${nuevo.nombre} se ocupó recién. Elegí otro lugar.`)
      throw error
    }
    revalidatePath("/panel", "layout")
    await anotar(sesion, {
      seccion: "reservas",
      accion: "reasignó lugar",
      detalle: actual ? `Cambió ${nombreDe(actual.unidad)} por ${nuevo.nombre} en la reserva ${reserva.codigo}` : `Asignó ${nuevo.nombre} a la reserva ${reserva.codigo}`,
      reservaId: reserva.id,
    })
    return { ok: true }
  })
}
