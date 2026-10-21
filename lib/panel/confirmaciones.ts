import type { Modulo } from "@/generated/prisma/enums"
import { totalSegunForma } from "@/lib/predio/cotizacion"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { aFechaDb } from "@/lib/predio/fechas"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"
import { urlSitio } from "@/lib/url-sitio"

export const modulosQueConfirman: Modulo[] = ["FINDE_FAMILIA", "BUNGALOW", "NADO"]

export const MENSAJE_DE_CONFIRMACION = "¡Hola! Te escribimos de Lago La Candelaria para que nos confirmes tu presencia el día de mañana, saludos."

/// El mensaje de WhatsApp del día anterior, con el enlace para cancelar si no vienen.
export function mensajeDeConfirmacion(token: string) {
  return `${MENSAJE_DE_CONFIRMACION}\n\nSi no pueden venir, pueden cancelar la reserva desde acá: ${urlSitio}/reserva/t/${token}`
}

export type RespuestaDeConfirmacion = "CONFIRMO" | "CANCELO" | null

/// Las reservas que llegan un día (finde en familia, bungalows y nado), con lo necesario
/// para mandarles el mensaje y anotar qué respondieron.
export async function paraConfirmar(fecha: string) {
  const filas = await db().reserva.findMany({
    where: { desde: aFechaDb(fecha), modulo: { in: modulosQueConfirman }, OR: [{ estado: { not: "CANCELADA" } }, { confirmacion: "CANCELO" }] },
    orderBy: [{ estado: "asc" }, { id: "asc" }],
    select: {
      id: true,
      token: true,
      codigo: true,
      modulo: true,
      estado: true,
      ingreso: true,
      salida: true,
      adultos: true,
      menores: true,
      sinCargo: true,
      formaPago: true,
      detalle: true,
      confirmacion: true,
      confirmacionEn: true,
      cliente: { select: { nombre: true, apellido: true, telefono: true } },
      ocupaciones: { distinct: ["unidadId"], select: { unidad: { select: { tipo: true, etiqueta: true, numero: true } } } },
    },
  })
  return filas.map((fila) => {
    const telefono = normalizarTelefono(fila.cliente.telefono ?? "")
    const cotizacion = detalleDe(fila.detalle).cotizacion
    return {
      id: fila.id,
      codigo: fila.codigo,
      modulo: fila.modulo,
      estado: fila.estado,
      horario: `${fila.ingreso} a ${fila.salida}`,
      titular: `${fila.cliente.nombre} ${fila.cliente.apellido}`,
      telefono: telefono?.nacional ?? fila.cliente.telefono ?? "",
      whatsapp: telefono ? `https://wa.me/${telefono.whatsapp}?text=${encodeURIComponent(mensajeDeConfirmacion(fila.token))}` : null,
      personas: fila.adultos + fila.menores + fila.sinCargo,
      adultos: fila.adultos,
      menores: fila.menores,
      sinCargo: fila.sinCargo,
      lugares: fila.ocupaciones
        .map((item) => item.unidad)
        .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.numero - b.numero)
        .map((unidad) => `${nombreDeUnidad[unidad.tipo]} ${unidad.etiqueta}`),
      formaPago: fila.formaPago,
      total: cotizacion ? totalSegunForma(cotizacion, fila.formaPago) : 0,
      confirmacion: (fila.confirmacion === "CONFIRMO" || fila.confirmacion === "CANCELO" ? fila.confirmacion : null) as RespuestaDeConfirmacion,
      confirmacionEn: fila.confirmacionEn,
    }
  })
}

export type ParaConfirmar = Awaited<ReturnType<typeof paraConfirmar>>[number]
