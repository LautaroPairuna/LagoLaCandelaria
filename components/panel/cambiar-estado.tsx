"use client"

import { useTransition } from "react"

import { cancelarReserva, confirmarReserva, volverAConfirmar } from "@/app/panel/reservas/acciones"
import { conAviso } from "@/lib/avisos"
import { cn } from "cn"

type Estado = "PENDIENTE" | "CONFIRMADA"

const colores: Record<Estado, string> = {
  PENDIENTE: "border-[#e0b400] bg-[#fff7d6] text-[#3d2f00]",
  CONFIRMADA: "border-[#1f6aa5] bg-[#eaf3fb] text-[#163f63]",
}

/// Cambia el estado desde la lista, sin entrar a la reserva. Cancelar pide confirmación
/// porque libera los lugares.
export function CambiarEstado({ id, codigo, estado, titular }: { id: number; codigo: string; estado: Estado; titular: string }) {
  const [pendiente, iniciar] = useTransition()

  function cambiar(nuevo: string) {
    if (nuevo === estado) return
    if (nuevo === "CANCELADA" && !window.confirm(`¿Cancelar la reserva ${codigo} de ${titular}? Se liberan sus lugares.`)) return
    iniciar(async () => {
      if (nuevo === "CONFIRMADA") await conAviso(() => confirmarReserva(id), `Listo, la reserva ${codigo} quedó confirmada.`)
      else if (nuevo === "PENDIENTE") await conAviso(() => volverAConfirmar(id), `La reserva ${codigo} volvió a «a confirmar».`)
      else await conAviso(() => cancelarReserva(id), `Listo, la reserva ${codigo} quedó cancelada.`)
    })
  }

  return (
    <select
      aria-label={`Estado de la reserva ${codigo}`}
      value={estado}
      disabled={pendiente}
      onChange={(evento) => cambiar(evento.target.value)}
      className={cn("relative z-10 h-9 rounded-full border-2 px-3 text-sm font-bold disabled:opacity-60", colores[estado])}
    >
      <option value="PENDIENTE">A confirmar</option>
      <option value="CONFIRMADA">Confirmada</option>
      <option value="CANCELADA">Cancelar…</option>
    </select>
  )
}
