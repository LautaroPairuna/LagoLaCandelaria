import { NextResponse } from "next/server"

import { mensajesEntre } from "@/lib/almacen-reservas"
import { reservaMessages } from "@/lib/reserva"
import { esFecha, ocupadosEnMensajes, sumarDias } from "@/lib/solicitud"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const desde = url.searchParams.get("desde") ?? ""
  const hasta = url.searchParams.get("hasta") ?? desde
  if (!esFecha(desde) || !esFecha(hasta) || hasta < desde) {
    return NextResponse.json({ ok: false, ocupados: [] }, { status: 400 })
  }

  try {
    const mensajes = await mensajesEntre(sumarDias(desde, -40), hasta)
    return NextResponse.json({ ok: true, ocupados: [...ocupadosEnMensajes(mensajes, desde, hasta)] })
  } catch (error) {
    console.error("Disponibilidad no leída", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { ok: false, ocupados: [], message: reservaMessages.unavailable },
      { status: 503 },
    )
  }
}
