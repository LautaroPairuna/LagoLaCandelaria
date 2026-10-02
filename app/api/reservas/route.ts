import { NextResponse } from "next/server"

import { leerBorrador, leerJsonAcotado } from "@/lib/borrador-entrada"
import { ipDe, superaLimite } from "@/lib/limite"
import { reservaMessages } from "@/lib/reserva"
import { baseCaida, guardarReserva, ocupadosEntre } from "@/lib/reservas"
import {
  compilar,
  crearCodigo,
  prepararBorrador,
  unidadesDeSolicitud,
  validarPaso,
  type Borrador,
} from "@/lib/solicitud"

const SOLICITUDES_POR_IP = 5
const VENTANA_MS = 10 * 60 * 1000
const lugarTomado = "Un lugar se ocupó mientras armabas la solicitud. Volvé a elegirlo."

function pasosDeGuardado(borrador: Borrador) {
  if (borrador.tipo === "estudiantil") return ["grupo", "institucion", "tiempo", "confirmar"]
  return ["grupo", "personas", "tiempo", "lugar", "mesa", "confirmar"]
}

function respuestaDeFallo(error: unknown) {
  const codigo = error instanceof Error ? error.name : "unknown"
  const detalle = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 160) : ""
  console.error(`Reserva no guardada: ${codigo}${detalle ? ` ${detalle}` : ""}`)
  if (baseCaida(error)) {
    return NextResponse.json({ ok: false, message: reservaMessages.unavailable }, { status: 503 })
  }
  return NextResponse.json({ ok: false, message: reservaMessages.saveFailed }, { status: 500 })
}

export async function POST(request: Request) {
  if (superaLimite(`reservas:${ipDe(request)}`, SOLICITUDES_POR_IP, VENTANA_MS)) {
    return NextResponse.json({ ok: false, message: reservaMessages.tooMany }, { status: 429 })
  }

  const cuerpo = await leerJsonAcotado(request)
  if (cuerpo === "grande") {
    return NextResponse.json({ ok: false, message: reservaMessages.invalid }, { status: 413 })
  }
  if (cuerpo === "ilegible") {
    return NextResponse.json({ ok: false, message: reservaMessages.unreadable }, { status: 400 })
  }

  const entrada = leerBorrador(cuerpo.json)
  if ("campos" in entrada) {
    return NextResponse.json(
      { ok: false, message: reservaMessages.invalid, fields: entrada.campos },
      { status: 400 },
    )
  }

  const borrador = prepararBorrador(entrada.borrador)
  const ocupados = new Set<string>()
  if (borrador.tipo === "familiar" && borrador.desde && borrador.hasta) {
    try {
      for (const id of await ocupadosEntre(borrador.desde, borrador.hasta)) ocupados.add(id)
    } catch (error) {
      return respuestaDeFallo(error)
    }
  }

  const errores: Record<string, string> = {}
  for (const paso of pasosDeGuardado(borrador)) {
    Object.assign(errores, validarPaso(paso, borrador, [...ocupados]))
  }
  if (Object.keys(errores).length > 0) {
    return NextResponse.json(
      { ok: false, message: reservaMessages.invalid, fields: errores },
      { status: 400 },
    )
  }

  const solicitud = compilar(borrador, crearCodigo())
  if (!solicitud) {
    return NextResponse.json({ ok: false, message: reservaMessages.invalid }, { status: 400 })
  }

  const tomados = unidadesDeSolicitud(solicitud).filter((id) => ocupados.has(id))
  if (tomados.length > 0) {
    return NextResponse.json({ ok: false, message: lugarTomado, ocupados: tomados }, { status: 409 })
  }

  try {
    const guardada = await guardarReserva(solicitud)
    if ("conflicto" in guardada) {
      return NextResponse.json({ ok: false, message: lugarTomado, ocupados: guardada.conflicto }, { status: 409 })
    }
    return NextResponse.json({ ok: true, id: guardada.token, solicitud: { ...solicitud, codigo: guardada.codigo } })
  } catch (error) {
    return respuestaDeFallo(error)
  }
}
