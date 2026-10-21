import { celda } from "@/lib/panel/caja"
import { paraConfirmar } from "@/lib/panel/confirmaciones"

/// La planilla con la que la puerta recibe las reservas de la web del día (finde en
/// familia, bungalows y nado), con las columnas que pidió el predio.

export const columnasDePlanilla = ["N.º de reserva", "Nombre y apellido", "Teléfono", "Adultos", "Menores", "Menores de 5", "Lugar asignado", "Forma de pago", "Confirmó"]

const nombreDeForma = { EFECTIVO: "Efectivo", DEBITO: "Débito", TRANSFERENCIA: "Transferencia" } as const

export async function planillaDelDia(fecha: string) {
  const reservas = await paraConfirmar(fecha)
  return reservas
    .filter((reserva) => reserva.estado !== "CANCELADA")
    .map((reserva) => ({
      id: reserva.id,
      codigo: reserva.codigo,
      titular: reserva.titular,
      telefono: reserva.telefono,
      adultos: reserva.adultos,
      menores: reserva.menores,
      sinCargo: reserva.sinCargo,
      lugar: reserva.modulo === "NADO" ? `NADO (${reserva.horario} hs)` : reserva.lugares.join(", ") || "Sin asignar",
      formaPago: reserva.formaPago ? nombreDeForma[reserva.formaPago] : "",
      confirmo: reserva.confirmacion === "CONFIRMO",
    }))
}

export type FilaDePlanilla = Awaited<ReturnType<typeof planillaDelDia>>[number]

/// En CSV con punto y coma y BOM, como la caja, para que Excel lo abra con acentos.
export function planillaEnCsv(filas: FilaDePlanilla[]) {
  const tabla: (string | number)[][] = [
    columnasDePlanilla,
    ...filas.map((fila) => [
      `${fila.id} (${fila.codigo})`,
      fila.titular,
      fila.telefono,
      fila.adultos,
      fila.menores,
      fila.sinCargo,
      fila.lugar,
      fila.formaPago,
      fila.confirmo ? "Sí" : "Pendiente",
    ]),
  ]
  return `﻿${tabla.map((fila) => fila.map(celda).join(";")).join("\r\n")}\r\n`
}
