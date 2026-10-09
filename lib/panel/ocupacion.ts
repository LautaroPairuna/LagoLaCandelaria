import type { EstadoReserva, Modulo } from "@/generated/prisma/enums"
import { fechasEntre } from "@/lib/predio/fechas"
import { lineas, type LineaId } from "@/lib/predio/nombres"

export type DiaOcupado = {
  personas: number
  reservas: number
  pendientes: number
  porLinea: Record<LineaId, number>
}

type ReservaParaOcupacion = { modulo: Modulo; estado: EstadoReserva; desde: string; hasta: string; personas: number }

function lineaDe(modulo: Modulo) {
  return lineas.find((linea) => (linea.modulos as readonly Modulo[]).includes(modulo))?.id
}

/// Suma, para cada día entre `inicio` y `fin`, las personas y reservas que ocupan el predio.
/// Una estadía de varias noches cuenta en cada uno de sus días.
export function ocupacionPorDia(reservas: ReservaParaOcupacion[], inicio: string, fin: string) {
  const dias = new Map<string, DiaOcupado>()
  for (const reserva of reservas) {
    if (reserva.estado === "CANCELADA") continue
    const linea = lineaDe(reserva.modulo)
    const desde = reserva.desde < inicio ? inicio : reserva.desde
    const hasta = reserva.hasta > fin ? fin : reserva.hasta
    if (desde > hasta) continue
    for (const fecha of fechasEntre(desde, hasta)) {
      const dia = dias.get(fecha) ?? { personas: 0, reservas: 0, pendientes: 0, porLinea: { familia: 0, estudiantil: 0, aventura: 0 } }
      dia.personas += reserva.personas
      dia.reservas += 1
      if (reserva.estado === "PENDIENTE") dia.pendientes += 1
      if (linea) dia.porLinea[linea] += 1
      dias.set(fecha, dia)
    }
  }
  return dias
}

export function porcentaje(personas: number, aforo: number) {
  return aforo > 0 ? Math.round((personas / aforo) * 100) : 0
}

export function textoDelPorcentaje(personas: number, aforo: number) {
  const valor = porcentaje(personas, aforo)
  return personas > 0 && valor === 0 ? "<1 %" : `${valor} %`
}
