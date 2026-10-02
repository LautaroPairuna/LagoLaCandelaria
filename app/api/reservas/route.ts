import { NextResponse } from "next/server"

import { Prisma } from "@/generated/prisma/client"
import { guardarConsulta, mensajesEntre } from "@/lib/almacen-reservas"
import { reservaMessages, visitorMessage } from "@/lib/reserva"
import {
  borradorInicial,
  compilar,
  crearCodigo,
  empaquetar,
  ocupadosEnMensajes,
  prepararBorrador,
  sumarDias,
  unidadesDeSolicitud,
  validarPaso,
  type Borrador,
  type PersonaBorrador,
} from "@/lib/solicitud"

function texto(valor: unknown) {
  return typeof valor === "string" ? valor : ""
}

function persona(valor: unknown): PersonaBorrador {
  const vacia = borradorInicial().responsableInstitucion
  if (!valor || typeof valor !== "object") return { ...vacia, id: vacia.id }
  const record = valor as Record<string, unknown>
  return {
    id: texto(record.id) || vacia.id,
    nombre: texto(record.nombre),
    apellido: texto(record.apellido),
    dni: texto(record.dni),
    edad: texto(record.edad),
    notas: texto(record.notas),
    cud: record.cud === true,
  }
}

function leerBorrador(body: unknown): Borrador {
  const base = borradorInicial()
  if (!body || typeof body !== "object") return base
  const record = body as Record<string, unknown>
  const contacto = record.contacto
  const contactoRecord =
    contacto && typeof contacto === "object" ? (contacto as Record<string, unknown>) : {}
  const familias = Array.isArray(record.familias) ? record.familias : base.familias

  return {
    ...base,
    tipo: record.tipo === "familiar" || record.tipo === "estudiantil" ? record.tipo : "",
    contacto: {
      nombre: texto(contactoRecord.nombre),
      apellido: texto(contactoRecord.apellido),
      email: texto(contactoRecord.email),
      telefono: texto(contactoRecord.telefono),
    },
    estadia: record.estadia === "dia" || record.estadia === "noche" ? record.estadia : "",
    desde: texto(record.desde),
    hasta: texto(record.hasta),
    ingreso: texto(record.ingreso) || base.ingreso,
    salida: texto(record.salida) || base.salida,
    familias: familias.map((familia) => {
      const item = familia && typeof familia === "object" ? (familia as Record<string, unknown>) : {}
      const integrantes = Array.isArray(item.integrantes) ? item.integrantes : []
      return {
        id: texto(item.id) || persona(null).id,
        responsable: persona(item.responsable),
        integrantes: integrantes.map((integrante) => persona(integrante)),
      }
    }),
    lugares: Array.isArray(record.lugares) ? record.lugares.filter((id): id is string => typeof id === "string") : [],
    restaurante: record.restaurante === "si" || record.restaurante === "no" ? record.restaurante : "",
    mesasRestaurante: Array.isArray(record.mesasRestaurante)
      ? record.mesasRestaurante.filter((id): id is string => typeof id === "string")
      : [],
    bar: record.bar === "si" || record.bar === "no" ? record.bar : "",
    mesasBar: Array.isArray(record.mesasBar)
      ? record.mesasBar.filter((id): id is string => typeof id === "string")
      : [],
    institucion: texto(record.institucion),
    cargo: texto(record.cargo),
    estudiantes: texto(record.estudiantes),
    adultos: texto(record.adultos),
    cudEstudiantes: texto(record.cudEstudiantes) || "0",
    edadesGrupo: texto(record.edadesGrupo),
    notasGrupo: texto(record.notasGrupo),
    responsableInstitucion: persona(record.responsableInstitucion),
  }
}

function pasosDeGuardado(borrador: Borrador) {
  if (borrador.tipo === "estudiantil") return ["grupo", "institucion", "tiempo", "confirmar"]
  return ["grupo", "personas", "tiempo", "lugar", "mesa", "confirmar"]
}

function failureStatus(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { status: 409, message: reservaMessages.duplicate }
    if (["P1000", "P1001", "P1002", "P1017", "P2021", "P2022"].includes(error.code)) {
      return { status: 503, message: reservaMessages.unavailable }
    }
  }
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return { status: 503, message: reservaMessages.unavailable }
  }
  const texto = error instanceof Error ? `${error.name} ${error.message}` : ""
  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connect|pool timeout|database server/i.test(texto)) {
    return { status: 503, message: reservaMessages.unavailable }
  }
  return { status: 500, message: reservaMessages.saveFailed }
}

async function ocupadosEntre(desde: string, hasta: string) {
  const mensajes = await mensajesEntre(sumarDias(desde, -40), hasta)
  return ocupadosEnMensajes(mensajes, desde, hasta)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: reservaMessages.unreadable }, { status: 400 })
  }

  const borrador = prepararBorrador(leerBorrador(body))
  const ocupados = new Set<string>()
  if (borrador.tipo === "familiar" && borrador.desde && borrador.hasta) {
    try {
      for (const id of await ocupadosEntre(borrador.desde, borrador.hasta)) ocupados.add(id)
    } catch (error) {
      const failure = failureStatus(error)
      return NextResponse.json({ ok: false, message: failure.message }, { status: failure.status })
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
    return NextResponse.json(
      {
        ok: false,
        message: "Un lugar se ocupó mientras armabas la solicitud. Volvé a elegirlo.",
        ocupados: tomados,
      },
      { status: 409 },
    )
  }

  try {
    const saved = await guardarConsulta(
      {
        name: `${solicitud.contacto.nombre} ${solicitud.contacto.apellido}`,
        contact: `${solicitud.contacto.email} · ${solicitud.contacto.telefono}`,
        groupType: solicitud.tipo === "familiar" ? "Grupo familiar" : "Grupo estudiantil",
        date: solicitud.desde,
        message: empaquetar(solicitud),
        desde: sumarDias(solicitud.desde, -40),
        hasta: solicitud.hasta,
      },
      (mensajes) => {
        const cruzados = ocupadosEnMensajes(mensajes, solicitud.desde, solicitud.hasta)
        return unidadesDeSolicitud(solicitud).filter((id) => cruzados.has(id))
      },
    )

    if ("conflicto" in saved) {
      return NextResponse.json(
        {
          ok: false,
          message: "Un lugar se ocupó mientras armabas la solicitud. Volvé a elegirlo.",
          ocupados: saved.conflicto,
        },
        { status: 409 },
      )
    }

    return NextResponse.json({ ok: true, id: saved.id, solicitud })
  } catch (error) {
    const code =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : error instanceof Error
          ? error.name
          : "unknown"
    const detalle = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 160) : ""
    console.error(`Reserva no guardada: ${code}${detalle ? ` ${detalle}` : ""}`)
    const failure = failureStatus(error)
    return NextResponse.json(
      { ok: false, message: visitorMessage(failure.message, failure.status) },
      { status: failure.status },
    )
  }
}
