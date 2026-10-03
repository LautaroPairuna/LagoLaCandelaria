import type { Modulo } from "@/generated/prisma/client"
import type { Cotizacion } from "@/lib/predio/cotizacion"
import { dniValido, limpiarDni, normalizarTelefono } from "@/lib/predio/contacto"
import { bandaDeEdad } from "@/lib/predio/tarifas"
import type { NuevaReserva } from "@/lib/reservas"

// Formato de la solicitud que guardaba la web anterior dentro de reservation_inquiries.
type PersonaLegado = { nombre: string; apellido: string; dni: string; edad: number; notas: string; cud: boolean }

export type SolicitudLegado = {
  version: 1
  codigo: string
  tipo: "familiar" | "estudiantil"
  contacto: { nombre: string; apellido: string; email: string; telefono: string }
  desde: string
  hasta: string
  ingreso: string
  salida: string
  familias: { responsable: PersonaLegado; integrantes: PersonaLegado[] }[]
  institucion: {
    nombre: string
    cargo: string
    estudiantes: number
    adultos: number
    cud: number
    edades: string
    notas: string
    responsable: PersonaLegado
  } | null
  lugares: { id: string; tipo: string; nombre: string }[]
  mesas: { id: string }[]
  cotizacion: Cotizacion
}

const MARCA = "---SOLICITUD---"

export function leerSolicitudLegado(mensaje: string) {
  const indice = mensaje.indexOf(MARCA)
  if (indice < 0) return null
  try {
    const datos = JSON.parse(mensaje.slice(indice + MARCA.length).trim()) as SolicitudLegado
    return datos?.version === 1 && typeof datos.codigo === "string" ? datos : null
  } catch {
    return null
  }
}

export function unidadesLegado(solicitud: SolicitudLegado) {
  return [...solicitud.lugares.map((lugar) => lugar.id), ...solicitud.mesas.map((mesa) => mesa.id)]
}

function moduloLegado(solicitud: SolicitudLegado): Modulo {
  if (solicitud.tipo === "estudiantil") return "CAMPAMENTO"
  return solicitud.lugares.some((lugar) => lugar.tipo === "bungalow") ? "BUNGALOW" : "FINDE_FAMILIA"
}

export function reservaDesdeLegado(solicitud: SolicitudLegado): Omit<NuevaReserva, "origen" | "token" | "creadaEn" | "asignar"> {
  const gente = solicitud.institucion
    ? [solicitud.institucion.responsable]
    : solicitud.familias.flatMap((familia) => [familia.responsable, ...familia.integrantes])
  const { nombre, apellido, email, telefono } = solicitud.contacto
  const mismo = (persona: PersonaLegado) =>
    persona.nombre.toLowerCase() === nombre.toLowerCase() && persona.apellido.toLowerCase() === apellido.toLowerCase()
  const dni = limpiarDni(gente.find(mismo)?.dni ?? "")

  const bandas = solicitud.familias
    .flatMap((familia) => [familia.responsable, ...familia.integrantes])
    .map((persona) => bandaDeEdad(persona.edad, persona.cud))
  const grupo = solicitud.institucion
    ? {
        adultos: solicitud.institucion.adultos,
        menores: Math.max(solicitud.institucion.estudiantes - solicitud.institucion.cud, 0),
        sinCargo: solicitud.institucion.cud,
      }
    : {
        adultos: bandas.filter((banda) => banda === "adulto").length,
        menores: bandas.filter((banda) => banda === "menor").length,
        sinCargo: bandas.filter((banda) => banda === "sin-cargo").length,
      }

  return {
    codigo: solicitud.codigo,
    modulo: moduloLegado(solicitud),
    desde: solicitud.desde,
    hasta: solicitud.hasta,
    ingreso: solicitud.ingreso,
    salida: solicitud.salida,
    cliente: {
      nombre: nombre.slice(0, 80),
      apellido: apellido.slice(0, 80),
      dni: dniValido(dni) ? dni : null,
      email: email.slice(0, 120) || null,
      telefono: (normalizarTelefono(telefono)?.e164 ?? telefono).slice(0, 40) || null,
    },
    grupo,
    cotizacion: solicitud.cotizacion,
    institucion: solicitud.institucion?.nombre,
    cargo: solicitud.institucion?.cargo,
    edadesGrupo: solicitud.institucion?.edades,
    notas: solicitud.institucion?.notas,
    personas: solicitud.familias.flatMap((familia, indice) =>
      [familia.responsable, ...familia.integrantes].map((persona, posicion) => ({
        familia: indice + 1,
        responsable: posicion === 0,
        nombre: persona.nombre.slice(0, 80),
        apellido: persona.apellido.slice(0, 80),
        dni: dniValido(persona.dni) ? persona.dni : null,
        edad: persona.edad,
        cud: persona.cud,
        notas: persona.notas.slice(0, 400) || null,
      })),
    ),
    detalle: { version: 1, lugares: solicitud.lugares.map(({ id, nombre }) => ({ id, nombre })) },
  }
}
