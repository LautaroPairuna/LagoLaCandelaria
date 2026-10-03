import type { FormaPago } from "@/generated/prisma/enums"
import { fechaLarga } from "@/lib/predio/fechas"
import { lineas, nombreDeUnidad, nombreDelModulo } from "@/lib/predio/nombres"
import type { TicketDatos } from "@/lib/reservas"

const nombreDeForma: Record<FormaPago, string> = {
  EFECTIVO: "Efectivo (10 % menos)",
  DEBITO: "Débito",
  TRANSFERENCIA: "Transferencia",
}

export function esGrupo(ticket: TicketDatos) {
  return !lineas[0].modulos.some((modulo) => modulo === ticket.modulo)
}

export function filasDelTicket(ticket: TicketDatos) {
  const personas = ticket.grupo.adultos + ticket.grupo.menores + ticket.grupo.sinCargo
  const noches = ticket.modulo === "BUNGALOW" ? Math.round((Date.parse(ticket.hasta) - Date.parse(ticket.desde)) / 86_400_000) : 0
  const grupo = esGrupo(ticket)
  const filas: [string, string][] = [
    ["Propuesta", `${nombreDelModulo[ticket.modulo]}${ticket.propuesta ? ` · ${ticket.propuesta}` : ""}`],
    ["Llegada", `${fechaLarga(ticket.desde)} · ${ticket.ingreso} hs`],
    ["Salida", `${fechaLarga(ticket.hasta)} · ${ticket.salida} hs`],
  ]
  if (noches > 0) filas.push(["Estadía", `${noches} ${noches === 1 ? "noche" : "noches"}`])
  if (grupo) {
    filas.push(["Participantes", String(ticket.grupo.menores + ticket.grupo.sinCargo)], ["Acompañantes", String(ticket.grupo.adultos)])
  } else {
    filas.push([
      "Personas",
      `${personas}: ${ticket.grupo.adultos} ${ticket.grupo.adultos === 1 ? "adulto" : "adultos"}, ${ticket.grupo.menores} de 5 a 12 años, ${ticket.grupo.sinCargo} sin cargo`,
    ])
  }
  filas.push([
    "Lugar",
    ticket.lugares.length
      ? ticket.lugares.map((lugar) => `${nombreDeUnidad[lugar.tipo]} ${lugar.etiqueta}`).join(" · ")
      : grupo
        ? "Lo organiza el predio con la institución"
        : "Lo asigna el predio",
  ])
  if (ticket.formaPago) filas.push(["Forma de pago", nombreDeForma[ticket.formaPago]])
  return filas
}

export function titularDelTicket(ticket: TicketDatos) {
  return `${ticket.titular.nombre} ${ticket.titular.apellido}`
}
