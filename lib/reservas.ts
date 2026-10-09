import {
  Prisma,
  type EstadoReserva,
  type FormaPago,
  type Modulo,
  type OrigenReserva,
} from "@/generated/prisma/client"
import type { Cotizacion, Grupo } from "@/lib/predio/cotizacion"
import { aFechaDb, deFechaDb, fechasEntre, sumarDiasIso } from "@/lib/predio/fechas"
import { claveDeHora } from "@/lib/predio/horario"
import { db } from "@/lib/prisma"

const INTENTOS = 3
const MARGEN_DE_DIAS = 8

function duplicado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export function crearCodigo() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let codigo = ""
  for (const byte of bytes) codigo += alfabeto[byte % alfabeto.length]
  return `LC-${codigo}`
}

/// Lo que se guarda en `reservas.detalle`. Las reservas de la web anterior traen además
/// la solicitud completa (versión 1); de todas se lee solo lo que está acá.
export type DetalleReserva = {
  version: 1 | 2
  cotizacion: Cotizacion
  lugares?: { id: string; nombre: string }[]
  extra?: Record<string, unknown>
}

export function detalleDe(valor: Prisma.JsonValue) {
  return valor as unknown as DetalleReserva
}

export async function ocupadosEntre(desde: string, hasta: string, unidades?: string[]) {
  const filas = await db().ocupacion.findMany({
    where: {
      fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) },
      ...(unidades ? { unidadId: { in: unidades } } : {}),
    },
    select: { unidadId: true },
    distinct: ["unidadId"],
  })
  return new Set(filas.map((fila) => fila.unidadId))
}

/// Por cada unidad, los días que tiene tomados ("2026-10-12") y, en las mesas, las horas
/// ("2026-10-12@13").
export async function ocupacionPorUnidad(desde: string, hasta: string) {
  const filas = await db().ocupacion.findMany({
    where: { fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) } },
    select: { unidadId: true, fecha: true, hora: true },
  })
  const mapa = new Map<string, Set<string>>()
  for (const fila of filas) {
    const tomado = mapa.get(fila.unidadId) ?? new Set<string>()
    const fecha = deFechaDb(fila.fecha)
    tomado.add(fila.hora ? claveDeHora(fecha, fila.hora) : fecha)
    mapa.set(fila.unidadId, tomado)
  }
  return mapa
}

export type PersonaNueva = {
  familia: number
  responsable: boolean
  nombre: string
  apellido: string
  dni: string | null
  edad: number
  cud: boolean
  notas: string | null
}

export type NuevaReserva = {
  modulo: Modulo
  desde: string
  hasta: string
  ingreso: string
  salida: string
  cliente: { nombre: string; apellido: string; dni: string | null; email: string | null; telefono: string | null }
  grupo: Grupo
  cotizacion: Cotizacion
  institucion?: string | null
  cargo?: string | null
  edadesGrupo?: string | null
  propuesta?: string | null
  notas?: string | null
  formaPago?: FormaPago | null
  personas?: PersonaNueva[]
  extra?: Record<string, unknown>
  detalle?: Record<string, unknown>
  origen?: OrigenReserva
  estado?: EstadoReserva
  token?: string
  codigo?: string
  creadaEn?: Date
  /// Recibe qué unidades están tomadas en las fechas de la reserva (y unos días antes y
  /// después, para la regla de bungalows) y devuelve las que hay que ocupar, o null si
  /// no hay lugar. Se vuelve a llamar si otra reserva ganó el lugar mientras tanto.
  asignar?: (ocupacion: Map<string, Set<string>>) => string[] | null
  /// Las horas que ocupa cada unidad (mesas del restaurante). Sin horas, el día entero.
  horas?: number[]
  /// Horas de algunas unidades. El resto ocupa el día entero, salvo que no haya mapa y sí `horas`.
  horasPorUnidad?: Record<string, number[]>
  /// Días que ocupa cada unidad. Sin mapa, todas las fechas de la reserva.
  diasPorUnidad?: Record<string, string[]>
}

export type ReservaCreada = { id: number; token: string; codigo: string; unidades: string[] }

async function crearUnaVez(nueva: NuevaReserva, codigo: string, unidades: string[]) {
  const fechas = fechasEntre(nueva.desde, nueva.hasta)
  const detalle = {
    version: 2,
    cotizacion: nueva.cotizacion,
    ...(nueva.extra ? { extra: nueva.extra } : {}),
    ...nueva.detalle,
  }

  return db().$transaction(async (tx) => {
    const { cliente } = nueva
    const { id: clienteId } = cliente.dni
      ? await tx.cliente.upsert({
          where: { dni: cliente.dni },
          create: cliente,
          update: { nombre: cliente.nombre, apellido: cliente.apellido, email: cliente.email, telefono: cliente.telefono },
          select: { id: true },
        })
      : await tx.cliente.create({ data: cliente, select: { id: true } })

    return tx.reserva.create({
      data: {
        token: nueva.token,
        codigo,
        modulo: nueva.modulo,
        estado: nueva.estado,
        origen: nueva.origen,
        creadaEn: nueva.creadaEn,
        desde: aFechaDb(nueva.desde),
        hasta: aFechaDb(nueva.hasta),
        ingreso: nueva.ingreso,
        salida: nueva.salida,
        clienteId,
        institucion: nueva.institucion || null,
        cargo: nueva.cargo || null,
        edadesGrupo: nueva.edadesGrupo || null,
        propuesta: nueva.propuesta || null,
        notas: nueva.notas || null,
        formaPago: nueva.formaPago ?? null,
        ...nueva.grupo,
        total: nueva.cotizacion.total,
        detalle: detalle as Prisma.InputJsonValue,
        personas: { create: nueva.personas ?? [] },
        ocupaciones: {
          createMany: {
            data: unidades.flatMap((unidadId) => {
              const dias = nueva.diasPorUnidad?.[unidadId] ?? fechas
              const propias = nueva.horasPorUnidad?.[unidadId]
              const horas = propias?.length ? propias : !nueva.horasPorUnidad && nueva.horas?.length ? nueva.horas : [0]
              return dias.flatMap((fecha) => horas.map((hora) => ({ unidadId, fecha: aFechaDb(fecha), hora })))
            }),
          },
        },
      },
      select: { id: true, token: true, codigo: true },
    })
  })
}

// El índice único de ocupaciones frena a la segunda reserva que pide el mismo lugar el
// mismo día. En ese caso se vuelve a leer la ocupación y se asigna de nuevo.
export async function crearReserva(nueva: NuevaReserva): Promise<ReservaCreada | { sinLugar: true }> {
  let codigo = nueva.codigo ?? crearCodigo()
  for (let intento = 1; ; intento += 1) {
    let unidades: string[] = []
    if (nueva.asignar) {
      const ocupacion = await ocupacionPorUnidad(sumarDiasIso(nueva.desde, -MARGEN_DE_DIAS), sumarDiasIso(nueva.hasta, MARGEN_DE_DIAS))
      const asignadas = nueva.asignar(ocupacion)
      if (!asignadas) return { sinLugar: true }
      unidades = asignadas
    }
    try {
      return { ...(await crearUnaVez(nueva, codigo, unidades)), unidades }
    } catch (error) {
      if (!duplicado(error) || intento >= INTENTOS) throw error
      if (!nueva.codigo) codigo = crearCodigo()
    }
  }
}

/// Si la unidad está libre esos días. Con `horas`, alcanza con que estén libres esas
/// horas; sin ellas, el día tiene que estar libre entero (ni una hora tomada).
export function libreEn(ocupacion: Map<string, Set<string>>, desde: string, hasta: string, horas?: number[]) {
  const fechas = fechasEntre(desde, hasta)
  return (unidadId: string) => {
    const tomado = ocupacion.get(unidadId)
    if (!tomado) return true
    return !fechas.some(
      (fecha) =>
        tomado.has(fecha) ||
        (horas ? horas.some((hora) => tomado.has(claveDeHora(fecha, hora))) : [...tomado].some((clave) => clave.startsWith(`${fecha}@`))),
    )
  }
}

export async function ticketDeReserva(token: string) {
  const reserva = await db().reserva.findUnique({
    where: { token },
    include: {
      cliente: true,
      personas: { orderBy: [{ familia: "asc" }, { id: "asc" }] },
      ocupaciones: { distinct: ["unidadId"], select: { unidad: { select: { tipo: true, etiqueta: true, numero: true } } } },
    },
  })
  if (!reserva) return null
  return {
    numero: reserva.id,
    token: reserva.token,
    codigo: reserva.codigo,
    estado: reserva.estado,
    modulo: reserva.modulo,
    desde: deFechaDb(reserva.desde),
    hasta: deFechaDb(reserva.hasta),
    ingreso: reserva.ingreso,
    salida: reserva.salida,
    titular: { nombre: reserva.cliente.nombre, apellido: reserva.cliente.apellido, dni: reserva.cliente.dni },
    contacto: { email: reserva.cliente.email, telefono: reserva.cliente.telefono },
    institucion: reserva.institucion,
    cargo: reserva.cargo,
    propuesta: reserva.propuesta,
    grupo: { adultos: reserva.adultos, menores: reserva.menores, sinCargo: reserva.sinCargo },
    personas: reserva.personas.map(({ nombre, apellido, dni, edad, cud, notas, familia, responsable }) => ({
      nombre,
      apellido,
      dni,
      edad,
      cud,
      notas,
      familia,
      responsable,
    })),
    lugares: reserva.ocupaciones
      .map((item) => item.unidad)
      .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.numero - b.numero)
      .map((unidad) => ({ tipo: unidad.tipo, etiqueta: unidad.etiqueta })),
    formaPago: reserva.formaPago,
    cotizacion: detalleDe(reserva.detalle).cotizacion,
  }
}

export type TicketDatos = NonNullable<Awaited<ReturnType<typeof ticketDeReserva>>>
