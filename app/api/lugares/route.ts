import { NextResponse } from "next/server"

import { categorias, lugaresDisponibles, type Categoria } from "@/lib/disponibilidad"
import { ipDe, superaLimite } from "@/lib/limite"
import { horasDe, leerFranja } from "@/lib/predio/horario"
import { esFechaIso, sumarDiasIso } from "@/lib/predio/fechas"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (superaLimite(`lugares:${ipDe(request)}`, 90, 60_000)) {
    return NextResponse.json({ ok: false, error: "Estás consultando muy seguido. Esperá un minuto y seguimos." }, { status: 429 })
  }
  const url = new URL(request.url)
  const categoria = url.searchParams.get("tipo") ?? ""
  const desde = url.searchParams.get("desde") ?? ""
  const hasta = url.searchParams.get("hasta") ?? desde
  if (!(categoria in categorias) || !esFechaIso(desde) || !esFechaIso(hasta) || hasta < desde || hasta > sumarDiasIso(desde, 31)) {
    return NextResponse.json({ ok: false, error: "No entendimos qué fecha querés ver. Volvé a elegirla en el calendario." }, { status: 400 })
  }
  const franja = leerFranja(url.searchParams.get("horas"))
  try {
    return NextResponse.json({ ok: true, lugares: await lugaresDisponibles(categoria as Categoria, desde, hasta, franja ? horasDe(franja) : undefined) })
  } catch (error) {
    console.error("Lugares no leídos", error instanceof Error ? error.name : "unknown")
    return NextResponse.json({ ok: false, error: "No pudimos leer los lugares del predio. Probá de nuevo en un rato o escribinos por WhatsApp." }, { status: 503 })
  }
}
