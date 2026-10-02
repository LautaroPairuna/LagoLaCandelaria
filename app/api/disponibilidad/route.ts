import { NextResponse } from "next/server"

import { ipDe, superaLimite } from "@/lib/limite"
import { reservaMessages } from "@/lib/reserva"
import { ocupadosEntre } from "@/lib/reservas"
import { MAX_NOCHES, diasDelRango, esFecha } from "@/lib/solicitud"

export const dynamic = "force-dynamic"

const CONSULTAS_POR_IP = 60
const VENTANA_MS = 60 * 1000

export async function GET(request: Request) {
  if (superaLimite(`disponibilidad:${ipDe(request)}`, CONSULTAS_POR_IP, VENTANA_MS)) {
    return NextResponse.json({ ok: false, ocupados: [], message: reservaMessages.tooMany }, { status: 429 })
  }

  const url = new URL(request.url)
  const desde = url.searchParams.get("desde") ?? ""
  const hasta = url.searchParams.get("hasta") ?? desde
  if (!esFecha(desde) || !esFecha(hasta) || hasta < desde || diasDelRango(desde, hasta).length > MAX_NOCHES + 1) {
    return NextResponse.json({ ok: false, ocupados: [] }, { status: 400 })
  }

  try {
    return NextResponse.json({ ok: true, ocupados: [...(await ocupadosEntre(desde, hasta))] })
  } catch (error) {
    console.error("Disponibilidad no leída", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { ok: false, ocupados: [], message: reservaMessages.unavailable },
      { status: 503 },
    )
  }
}
