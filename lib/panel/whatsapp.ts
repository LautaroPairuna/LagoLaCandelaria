import type { Modulo } from "@/generated/prisma/enums"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { armarMensaje, enlaceDeWhatsapp, plantillasIniciales, type DatosDelMensaje, type Plantilla, type TipoDePlantilla } from "@/lib/panel/plantillas"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { deFechaDb } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { reglamentoDe, reglamentos } from "@/lib/reglamentos"
import { urlSitio } from "@/lib/url-sitio"

/// Los mensajes guardados. La primera vez se crean los que ya usaba el predio.
export async function plantillasWhatsapp(): Promise<Plantilla[]> {
  let filas = await db().plantillaWhatsapp.findMany({ orderBy: [{ tipo: "asc" }, { orden: "asc" }, { id: "asc" }] })
  if (!filas.length) {
    await db().plantillaWhatsapp.createMany({ data: plantillasIniciales.map((plantilla, orden) => ({ ...plantilla, orden })) })
    filas = await db().plantillaWhatsapp.findMany({ orderBy: [{ tipo: "asc" }, { orden: "asc" }, { id: "asc" }] })
  }
  return filas.map(({ id, tipo, nombre, texto }) => ({ id, tipo: tipo as TipoDePlantilla, nombre, texto }))
}

/// Lo que se reemplaza en el mensaje de una reserva.
export function datosDeReserva(reserva: { nombre: string; codigo: string; desde: string; token: string; modulo: Modulo }): DatosDelMensaje {
  const tipo = reglamentoDe(reserva.modulo)
  const queHay = tipo && reglamentos[tipo].conHorarios ? "los horarios y el reglamento del predio" : "el reglamento del predio"
  return {
    nombre: reserva.nombre,
    codigo: reserva.codigo,
    fecha: fechaLargaPanel(reserva.desde).toLowerCase(),
    ticket: `${urlSitio}/reserva/t/${reserva.token}`,
    reglamento: tipo ? `📌 *En este link también vas a encontrar ${queHay}.*` : "",
  }
}

/// El número para wa.me, o null si el teléfono cargado no es un celular válido.
export function whatsappDe(telefono: string | null | undefined) {
  return normalizarTelefono(telefono ?? "")?.whatsapp ?? null
}

type ParaTicket = { id: number; nombre: string; codigo: string; desde: string; token: string; modulo: Modulo; titular: string; telefono: string | null; ticketEnviadoEn: Date | null }

/// Los tickets para el envío guiado, con el primer mensaje de ticket guardado ya armado.
export function enviosDeTickets(reservas: ParaTicket[], plantillas: Plantilla[]) {
  const plantilla = plantillas.find((item) => item.tipo === "ticket")
  return reservas.map((reserva) => {
    const numero = whatsappDe(reserva.telefono)
    return {
      id: reserva.id,
      titular: reserva.titular,
      telefono: reserva.telefono ?? "",
      whatsapp: numero && plantilla ? enlaceDeWhatsapp(numero, armarMensaje(plantilla.texto, datosDeReserva(reserva))) : null,
      enviado: Boolean(reserva.ticketEnviadoEn),
    }
  })
}

const POR_PAGINA = 50

export const ordenesDeClientes = [
  { id: "recientes", nombre: "Última visita" },
  { id: "frecuentes", nombre: "Más reservas" },
  { id: "az", nombre: "A-Z" },
] as const
export type OrdenDeClientes = (typeof ordenesDeClientes)[number]["id"]

function condicionDeClientes(texto: string) {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).slice(0, 4)
  return palabras.length
    ? { AND: palabras.map((palabra) => ({ OR: [{ nombre: { contains: palabra } }, { apellido: { contains: palabra } }, { dni: { contains: palabra } }, { telefono: { contains: palabra } }, { email: { contains: palabra } }] })) }
    : {}
}

/// Todos los clientes de una búsqueda para el Excel, de la A a la Z.
export async function clientesParaExportar(texto: string) {
  const filas = await db().cliente.findMany({
    where: condicionDeClientes(texto),
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    select: { nombre: true, apellido: true, dni: true, telefono: true, email: true, reservas: { orderBy: { desde: "desc" }, select: { desde: true, estado: true } } },
  })
  return filas.map((cliente) => {
    const vigentes = cliente.reservas.filter((reserva) => reserva.estado !== "CANCELADA")
    return {
      apellido: cliente.apellido,
      nombre: cliente.nombre,
      dni: cliente.dni ?? "",
      telefono: cliente.telefono ?? "",
      email: cliente.email ?? "",
      reservas: vigentes.length,
      ultima: cliente.reservas[0] ? deFechaDb(cliente.reservas[0].desde).split("-").reverse().join("/") : "",
    }
  })
}

/// La base de clientes: cada responsable con cuántas veces reservó, cuándo fue la última,
/// lo que pagó y el último WhatsApp. Se busca por nombre, DNI o teléfono.
export async function clientesConHistorial({ texto, orden, pagina }: { texto: string; orden: OrdenDeClientes; pagina: number }) {
  const where = condicionDeClientes(texto)
  // "Última visita" ordena por la reserva más reciente de cada cliente: se agrupan las
  // reservas para traer solo los clientes de la página.
  const ids =
    orden === "recientes"
      ? (
          await db().reserva.groupBy({
            by: ["clienteId"],
            where: texto.trim() ? { cliente: where } : {},
            _max: { desde: true },
            orderBy: [{ _max: { desde: "desc" } }, { clienteId: "desc" }],
            skip: (pagina - 1) * POR_PAGINA,
            take: POR_PAGINA,
          })
        ).map((fila) => fila.clienteId)
      : null
  const [total, filas] = await Promise.all([
    db().cliente.count({ where }),
    db().cliente.findMany({
      where: ids ? { id: { in: ids } } : where,
      orderBy: orden === "az" ? [{ apellido: "asc" }, { nombre: "asc" }] : [{ reservas: { _count: "desc" } }, { id: "desc" }],
      ...(ids ? {} : { take: POR_PAGINA, skip: (pagina - 1) * POR_PAGINA }),
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        telefono: true,
        email: true,
        reservas: { orderBy: { desde: "desc" }, select: { desde: true, estado: true, pagos: { select: { importe: true } } } },
        contactos: { orderBy: { creadoEn: "desc" }, take: 1, select: { tipo: true, creadoEn: true } },
      },
    }),
  ])
  const lista = filas.map((cliente) => {
    const vigentes = cliente.reservas.filter((reserva) => reserva.estado !== "CANCELADA")
    return {
      id: cliente.id,
      nombre: `${cliente.nombre} ${cliente.apellido}`,
      nombreDePila: cliente.nombre,
      dni: cliente.dni,
      telefono: cliente.telefono,
      email: cliente.email,
      whatsapp: whatsappDe(cliente.telefono),
      reservas: vigentes.length,
      canceladas: cliente.reservas.length - vigentes.length,
      ultima: cliente.reservas[0] ? deFechaDb(cliente.reservas[0].desde) : null,
      pagado: vigentes.reduce((suma, reserva) => suma + reserva.pagos.reduce((parcial, pago) => parcial + pago.importe, 0), 0),
      ultimoContacto: cliente.contactos[0] ?? null,
    }
  })
  const clientes = ids ? ids.flatMap((id) => lista.find((cliente) => cliente.id === id) ?? []) : lista
  return { total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)), clientes }
}

export type ClienteConHistorial = Awaited<ReturnType<typeof clientesConHistorial>>["clientes"][number]

/// Un cliente con todas sus reservas y los WhatsApp que se le mandaron.
export async function fichaDeCliente(id: number) {
  return db().cliente.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      telefono: true,
      email: true,
      creadoEn: true,
      reservas: {
        orderBy: { desde: "desc" },
        select: {
          id: true,
          codigo: true,
          modulo: true,
          estado: true,
          desde: true,
          hasta: true,
          adultos: true,
          menores: true,
          sinCargo: true,
          total: true,
          ingresoEn: true,
          salidaEn: true,
          adultosAdentro: true,
          menoresAdentro: true,
          personas: { select: { ingresoEn: true, salidaEn: true } },
          pagos: { select: { importe: true } },
        },
      },
      contactos: { orderBy: { creadoEn: "desc" }, take: 30, select: { id: true, tipo: true, plantilla: true, por: true, creadoEn: true, reserva: { select: { codigo: true } } } },
    },
  })
}
