import { NextResponse } from "next/server"

import { categorias, disponibilidadDelMes, type Categoria } from "@/lib/disponibilidad"
import { ipDe, superaLimite } from "@/lib/limite"
import { horasDe, leerFranja } from "@/lib/predio/horario"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (superaLimite(`calendario:${ipDe(request)}`, 90, 60_000)) {
    return NextResponse.json({ ok: false, error: "Estás consultando el calendario muy seguido. Esperá un minuto y seguimos." }, { status: 429 })
  }
  const url = new URL(request.url)
  const mes = url.searchParams.get("mes") ?? ""
  const categoria = url.searchParams.get("tipo") ?? ""
  const personas = Math.min(Math.max(Number(url.searchParams.get("personas")) || 1, 1), 99)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes) || !(categoria in categorias)) {
    return NextResponse.json({ ok: false, error: "No entendimos qué mes querés ver. Recargá la página." }, { status: 400 })
  }
  const franja = leerFranja(url.searchParams.get("horas"))
  try {
    return NextResponse.json({ ok: true, ...(await disponibilidadDelMes(mes, categoria as Categoria, personas, franja ? horasDe(franja) : undefined)) })
  } catch (error) {
    console.error("Calendario no leído", error instanceof Error ? error.name : "unknown")
    return NextResponse.json({ ok: false, error: "No pudimos leer el calendario del predio. Probá de nuevo en un rato o escribinos por WhatsApp." }, { status: 503 })
  }
}
