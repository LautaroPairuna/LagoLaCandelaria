import { Prisma, type EstadoReserva, type Modulo, type OrigenReserva } from "@/generated/prisma/client"
import { dniValido, limpiarDni, normalizarTelefono } from "@/lib/predio/contacto"
import { aFechaDb, fechasEntre } from "@/lib/predio/fechas"
import { bandaDeEdad } from "@/lib/predio/tarifas"
import { db } from "@/lib/prisma"
import { crearCodigo, unidadesDeSolicitud, type SolicitudGuardada } from "@/lib/solicitud"

const INTENTOS = 3

export function baseCaida(error: unknown) {
  if (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1000", "P1001", "P1002", "P1017", "P2021", "P2022"].includes(error.code)) ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true
  }
  const texto = error instanceof Error ? `${error.name} ${error.message}` : ""
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connect|pool timeout|database server|DATABASE_URL/i.test(texto)
}

function duplicado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
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

export async function reservaPorToken(token: string) {
  const reserva = await db().reserva.findUnique({
    where: { token },
    select: { estado: true, detalle: true },
  })
  if (!reserva) return null
  return { estado: reserva.estado, solicitud: reserva.detalle as unknown as SolicitudGuardada }
}

export function moduloDe(solicitud: SolicitudGuardada): Modulo {
  if (solicitud.tipo === "estudiantil") return "CAMPAMENTO"
  return solicitud.lugares.some((lugar) => lugar.tipo === "bungalow") ? "BUNGALOW" : "FINDE_FAMILIA"
}

function cantidades(solicitud: SolicitudGuardada) {
  if (solicitud.institucion) {
    const { estudiantes, adultos, cud } = solicitud.institucion
    return { adultos, menores: Math.max(estudiantes - cud, 0), sinCargo: cud }
  }
  const bandas = solicitud.familias
    .flatMap((familia) => [familia.responsable, ...familia.integrantes])
    .map((persona) => bandaDeEdad(persona.edad, persona.cud))
  return {
    adultos: bandas.filter((banda) => banda === "adulto").length,
    menores: bandas.filter((banda) => banda === "menor").length,
    sinCargo: bandas.filter((banda) => banda === "sin-cargo").length,
  }
}

function clienteDe(solicitud: SolicitudGuardada) {
  const { nombre, apellido, email, telefono } = solicitud.contacto
  const mismo = (persona: { nombre: string; apellido: string }) =>
    persona.nombre.toLowerCase() === nombre.toLowerCase() && persona.apellido.toLowerCase() === apellido.toLowerCase()
  const candidatos = solicitud.institucion
    ? [solicitud.institucion.responsable]
    : solicitud.familias.flatMap((familia) => [familia.responsable, ...familia.integrantes])
  const dni = limpiarDni(candidatos.find(mismo)?.dni ?? "")
  return {
    dni: dniValido(dni) ? dni : null,
    nombre: nombre.slice(0, 80),
    apellido: apellido.slice(0, 80),
    email: email.slice(0, 120) || null,
    telefono: (normalizarTelefono(telefono)?.e164 ?? telefono).slice(0, 40) || null,
  }
}

export type OpcionesDeGuardado = {
  origen?: OrigenReserva
  estado?: EstadoReserva
  token?: string
  creadaEn?: Date
  ocupar?: boolean
}

function datosDeReserva(solicitud: SolicitudGuardada, clienteId: number, opciones: OpcionesDeGuardado) {
  const fechas = fechasEntre(solicitud.desde, solicitud.hasta)
  const ocupaciones = (opciones.ocupar ?? true)
    ? unidadesDeSolicitud(solicitud).flatMap((unidadId) => fechas.map((fecha) => ({ unidadId, fecha: aFechaDb(fecha) })))
    : []

  return {
    token: opciones.token,
    codigo: solicitud.codigo,
    modulo: moduloDe(solicitud),
    estado: opciones.estado,
    origen: opciones.origen,
    creadaEn: opciones.creadaEn,
    desde: aFechaDb(solicitud.desde),
    hasta: aFechaDb(solicitud.hasta),
    ingreso: solicitud.ingreso,
    salida: solicitud.salida,
    clienteId,
    institucion: solicitud.institucion?.nombre || null,
    cargo: solicitud.institucion?.cargo || null,
    edadesGrupo: solicitud.institucion?.edades || null,
    notas: solicitud.institucion?.notas || null,
    ...cantidades(solicitud),
    total: solicitud.cotizacion.total,
    detalle: solicitud as unknown as Prisma.InputJsonValue,
    personas: {
      create: solicitud.familias.flatMap((familia, indice) =>
        [familia.responsable, ...familia.integrantes].map((persona, posicion) => ({
          familia: indice + 1,
          responsable: posicion === 0,
          nombre: persona.nombre.slice(0, 80),
          apellido: persona.apellido.slice(0, 80),
          dni: dniValido(persona.dni) ? persona.dni : null,
          edad: persona.edad,
          cud: persona.cud,
          notas: persona.notas.slice(0, 400) || null,
        })),
      ),
    },
    ocupaciones: { createMany: { data: ocupaciones } },
  } satisfies Prisma.ReservaUncheckedCreateInput
}

async function crearUnaVez(solicitud: SolicitudGuardada, opciones: OpcionesDeGuardado) {
  return db().$transaction(async (tx) => {
    const datos = clienteDe(solicitud)
    const cliente = datos.dni
      ? await tx.cliente.upsert({
          where: { dni: datos.dni },
          create: datos,
          update: { nombre: datos.nombre, apellido: datos.apellido, email: datos.email, telefono: datos.telefono },
          select: { id: true },
        })
      : await tx.cliente.create({ data: datos, select: { id: true } })

    return tx.reserva.create({
      data: datosDeReserva(solicitud, cliente.id, opciones),
      select: { id: true, token: true, codigo: true },
    })
  })
}

// El índice único de ocupaciones rechaza el lugar tomado por otra reserva. Un P2002 sin
// lugares tomados es un choque de código o de cliente creado en paralelo: se reintenta.
export async function guardarReserva(
  solicitud: SolicitudGuardada,
  opciones: OpcionesDeGuardado = {},
): Promise<{ id: number; token: string; codigo: string } | { conflicto: string[] }> {
  let actual = solicitud
  for (let intento = 1; ; intento += 1) {
    try {
      return await crearUnaVez(actual, opciones)
    } catch (error) {
      if (!duplicado(error) || intento >= INTENTOS) throw error
      const pedidos = unidadesDeSolicitud(actual)
      const tomados = pedidos.length ? await ocupadosEntre(actual.desde, actual.hasta, pedidos) : new Set<string>()
      if (tomados.size > 0) return { conflicto: [...tomados] }
      if (!opciones.token) actual = { ...actual, codigo: crearCodigo() }
    }
  }
}
