import type { EstadoReserva } from "@/generated/prisma/enums"
import type { Asistencia } from "@/lib/panel/asistencia"

/// Lo que se le muestra al equipo de cada reserva, juntando si el predio la confirmó y
/// cómo viene el ingreso. Cada estado tiene un color propio para reconocerlo de un vistazo.
export type EstadoVisible = "a-confirmar" | "confirmada" | "parcial" | "ingresada" | "finalizada" | "no-vino" | "cancelada"

export const ordenDeEstados: EstadoVisible[] = ["a-confirmar", "confirmada", "parcial", "ingresada", "finalizada", "no-vino", "cancelada"]

export function estadoVisible(estado: EstadoReserva, asistencia: Asistencia): EstadoVisible {
  if (estado === "CANCELADA") return "cancelada"
  if (asistencia === "no-vino") return "no-vino"
  if (asistencia === "parcial") return "parcial"
  if (asistencia === "adentro") return "ingresada"
  if (asistencia === "finalizada") return "finalizada"
  return estado === "PENDIENTE" ? "a-confirmar" : "confirmada"
}

export const estilosDeEstado: Record<EstadoVisible, { nombre: string; explicacion: string; tarjeta: string; borde: string; insignia: string }> = {
  "a-confirmar": {
    nombre: "A confirmar",
    explicacion: "Pidió lugar y el predio todavía no lo confirmó",
    tarjeta: "bg-[#fff7d6] border-[#e8c64a]",
    borde: "border-l-[#e0b400]",
    insignia: "bg-[#f6d03c] text-[#3d2f00]",
  },
  confirmada: {
    nombre: "Confirmada",
    explicacion: "Confirmada, todavía no llegó nadie",
    tarjeta: "bg-[#eaf3fb] border-[#9cc4e4]",
    borde: "border-l-[#1f6aa5]",
    insignia: "bg-[#1f6aa5] text-white",
  },
  parcial: {
    nombre: "Ingreso parcial",
    explicacion: "Llegó una parte del grupo y faltan personas",
    tarjeta: "bg-[#ffeedb] border-[#f0b266]",
    borde: "border-l-[#e8890c]",
    insignia: "bg-[#f5a13a] text-[#2e1900]",
  },
  ingresada: {
    nombre: "Ingresada",
    explicacion: "Ya está todo el grupo en el predio",
    tarjeta: "bg-[#e6f5e4] border-[#8fcf88]",
    borde: "border-l-[#2e7d32]",
    insignia: "bg-[#2e7d32] text-white",
  },
  finalizada: {
    nombre: "Finalizada",
    explicacion: "Ya pasó el día: queda finalizada sola",
    tarjeta: "bg-[#eef0f3] border-[#c5cbd3]",
    borde: "border-l-[#546170]",
    insignia: "bg-[#546170] text-white",
  },
  "no-vino": {
    nombre: "No vino",
    explicacion: "Pasó el día y no ingresó nadie",
    tarjeta: "bg-[#fde9e7] border-[#ee9d96]",
    borde: "border-l-[#c62828]",
    insignia: "bg-[#c62828] text-white",
  },
  cancelada: {
    nombre: "Cancelada",
    explicacion: "El predio la dio de baja",
    tarjeta: "bg-[#f3f1ee] border-[#d6d1ca]",
    borde: "border-l-[#7a7168]",
    insignia: "bg-[#7a7168] text-white",
  },
}
