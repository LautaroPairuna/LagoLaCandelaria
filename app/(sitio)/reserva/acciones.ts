"use server"

import { headers } from "next/headers"
import { z } from "zod"

import type { Modulo } from "@/generated/prisma/enums"
import { categorias, diasEspeciales, entradaDeBungalow, unidadesDeLaWeb } from "@/lib/disponibilidad"
import { accion, ErrorHumano, exigir, mensajesDelSitio, type Resultado } from "@/lib/errores"
import { limiteAlcanzado, registrarUso } from "@/lib/limite"
import { anotarDelCliente } from "@/lib/panel/actividad"
import { lugaresDePlayaPara } from "@/lib/predio/asignacion"
import { estadoDelDia, tipoDeDia } from "@/lib/predio/calendario"
import { cotizacionAConfirmar, cotizacionDeConsumo, cotizarBungalows, cotizarDia, cotizarNado } from "@/lib/predio/cotizacion"
import { grupoPorEdades, parrillasOfrecidas, personasQueOcupan, revisarEleccion, type TipoDeLugar } from "@/lib/predio/eleccion"
import { deFechaDb, esFechaIso, fechaLarga, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { esFranja, horasDe, textoDeHora } from "@/lib/predio/horario"
import { inventario, MAX_PERSONAS_PARRILLA, MAX_PERSONAS_RESTAURANTE, type UnidadPredio } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { contacto, email, familias, nombre, personasDe, telefono, type FamiliaValida } from "@/lib/reserva-familia"
import { formaDePagoWeb, franjaDeNado, grupoWeb, MAX_PERSONAS_BUNGALOWS, MAX_PERSONAS_WEB, titularWeb } from "@/lib/reserva-visita"
import { crearReserva, libreEn, type NuevaReserva } from "@/lib/reservas"

export type ResultadoReserva = Resultado<{ token: string }>

const HORARIO = { ingreso: "10:00", salida: "19:00" }
const MAX_NOCHES = 14

const cantidad = z.number().int().min(0, "Revisá la cantidad.").max(99, "Para más de 99 personas escribinos por WhatsApp.")

const grupoFamiliar = {
  familias,
  contacto,
  unidades: z.array(z.string().max(24)).min(1, "Elegí el lugar.").max(10),
}

const MAX_PERSONAS = 99

const RESERVAS_POR_IP = 5
const VENTANA_MS = 10 * 60 * 1000

async function claveDeLimite() {
  const cabeceras = await headers()
  const ip = cabeceras.get("cf-connecting-ip") ?? cabeceras.get("x-real-ip") ?? cabeceras.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "desconocida"
  return `reserva:${ip}`
}

// Solo cuentan las reservas que se guardan: corregir un dato mal cargado no gasta intentos.
async function limitar() {
  return limiteAlcanzado(await claveDeLimite(), RESERVAS_POR_IP, VENTANA_MS)
}

async function fechasAbiertas(desde: string, hasta: string) {
  const especiales = await diasEspeciales(desde, hasta)
  for (const fecha of fechasEntre(desde, hasta)) {
    const estado = estadoDelDia(fecha, especiales)
    if (!estado.abierto) return estado.motivo
  }
  return null
}

function fechaReservable(fecha: string) {
  const hoy = hoyEnElPredio()
  return esFechaIso(fecha) && fecha >= hoy && fecha <= sumarDiasIso(hoy, 365)
}

function clienteDe(grupos: FamiliaValida[], datos: z.infer<typeof contacto>): NuevaReserva["cliente"] {
  const titular = personasDe(grupos).find((persona) => persona.responsable)!
  return { nombre: titular.nombre, apellido: titular.apellido, dni: titular.dni || null, email: datos.email || null, telefono: datos.telefono }
}

function personasParaGuardar(grupos: FamiliaValida[]) {
  return personasDe(grupos).map((persona) => ({
    familia: persona.familia,
    responsable: persona.responsable,
    nombre: persona.nombre,
    apellido: persona.apellido,
    dni: persona.dni || null,
    edad: persona.edad,
    cud: false,
    notas: persona.notas || null,
  }))
}

const nombreDe = (unidad: UnidadPredio) => `${nombreDeUnidad[unidad.tipo].toLowerCase()} ${unidad.etiqueta}`

/// Los lugares que eligió el grupo, comprobados contra el inventario y las reglas.
function lugaresElegidos(tipo: TipoDeLugar, ids: string[], personas: number) {
  const permitidos: readonly string[] = categorias[tipo]
  const elegidas = [...new Set(ids)].map((id) => inventario.find((unidad) => unidad.id === id))
  exigir(
    elegidas.every((unidad) => unidad && permitidos.includes(unidad.tipo)),
    "Hay un lugar elegido que no corresponde. Volvé al paso del lugar y elegilo de nuevo.",
  )
  const unidades = elegidas as UnidadPredio[]
  const revision = revisarEleccion(tipo, personas, unidades)
  exigir(revision.ok, revision.ok ? "" : revision.mensaje)
  return unidades
}

function tomadosRecien(tomados: UnidadPredio[]) {
  const lista = tomados.map(nombreDe).join(", ")
  return `Justo alguien reservó ${tomados.length === 1 ? `la ${lista}` : lista} para esa fecha. Volvé al paso del lugar y elegí otro.`
}

async function guardar(nueva: NuevaReserva, sinLugar: () => string): Promise<ResultadoReserva> {
  const creada = await crearReserva(nueva)
  if ("sinLugar" in creada) throw new ErrorHumano(sinLugar())
  registrarUso(await claveDeLimite(), VENTANA_MS)
  return { ok: true, token: creada.token }
}

async function exigirAbierto(desde: string, hasta: string, cuando: string) {
  const cerrado = await fechasAbiertas(desde, hasta)
  exigir(!cerrado, `${cuando} el predio está cerrado. ${cerrado ?? ""}`.trim())
}

function reservar(nombre: string, tarea: () => Promise<ResultadoReserva>) {
  return accion(
    nombre,
    async () => {
      exigir(!(await limitar()), mensajesDelSitio.demasiados)
      return tarea()
    },
    mensajesDelSitio,
  )
}

const pedidoDeDia = z.object({
  fecha: z.string(),
  lugar: z.enum(["parrilla", "playa", "restaurante"]),
  horario: z.object({ desde: z.number(), hasta: z.number() }).optional(),
  ...grupoFamiliar,
})

const propuestaDelLugar = { parrilla: "Parrilla", playa: "Gazebo o palapa", restaurante: "Restaurante" } as const

export async function reservarDia(pedido: z.input<typeof pedidoDeDia>): Promise<ResultadoReserva> {
  return reservar("reservarDia", async () => {
    const datos = pedidoDeDia.parse(pedido)
    exigir(fechaReservable(datos.fecha), "Elegí un día de hoy en adelante, dentro del próximo año.")
    const personas = personasDe(datos.familias)
    exigir(personas.length <= MAX_PERSONAS, `Para más de ${MAX_PERSONAS} personas escribinos por WhatsApp.`)
    exigir(
      datos.lugar !== "restaurante" || personas.length <= MAX_PERSONAS_RESTAURANTE,
      `En el restaurante entran hasta ${MAX_PERSONAS_RESTAURANTE} personas: para un grupo más grande escribinos por WhatsApp.`,
    )
    const restaurante = datos.lugar === "restaurante"
    const franja = restaurante ? datos.horario : undefined
    exigir(!restaurante || (franja !== undefined && esFranja(franja)), "Elegí a qué hora llegan y a qué hora se van del restaurante.")
    const horas = franja ? horasDe(franja) : undefined
    await exigirAbierto(datos.fecha, datos.fecha, "Ese día")
    const elegidas = lugaresElegidos(datos.lugar, datos.unidades, personas.length)
    const grupo = grupoPorEdades(personas.map((persona) => persona.edad))
    let tomados: UnidadPredio[] = []

    return guardar(
      {
        modulo: restaurante ? "RESTAURANTE" : "FINDE_FAMILIA",
        desde: datos.fecha,
        hasta: datos.fecha,
        ...(franja ? { ingreso: textoDeHora(franja.desde), salida: textoDeHora(franja.hasta) } : HORARIO),
        horas,
        cliente: clienteDe(datos.familias, datos.contacto),
        grupo,
        cotizacion: restaurante ? cotizacionDeConsumo : cotizarDia(grupo, await tipoDelDia(datos.fecha)),
        propuesta: propuestaDelLugar[datos.lugar],
        personas: personasParaGuardar(datos.familias),
        asignar: (ocupacion) => {
          const libre = libreEn(ocupacion, datos.fecha, datos.fecha, horas)
          tomados = elegidas.filter((unidad) => !libre(unidad.id))
          return tomados.length ? null : elegidas.map((unidad) => unidad.id)
        },
      },
      () => tomadosRecien(tomados),
    )
  })
}

const HORARIO_BUNGALOW = { ingreso: "10:00", salida: "18:00" }

async function tipoDelDia(fecha: string) {
  return tipoDeDia(fecha, await diasEspeciales(fecha, fecha))
}

/// Si viene el token, es una modificación: la reserva tiene que ser del mismo tipo, estar
/// viva y no haber empezado.
async function reservaAModificar(token: string | undefined, modulo: Modulo) {
  if (!token) return undefined
  const reserva = await db().reserva.findUnique({ where: { token }, select: { id: true, modulo: true, estado: true, desde: true, ingresoEn: true } })
  exigir(reserva && reserva.modulo === modulo, "No encontramos esa reserva. Abrila de nuevo desde Ver mi reserva.")
  exigir(reserva.estado !== "CANCELADA", "Esta reserva está cancelada: hacé una nueva.")
  exigir(!reserva.ingresoEn && deFechaDb(reserva.desde) >= hoyEnElPredio(), "Esta reserva ya no se puede modificar por la web. Escribinos por WhatsApp.")
  return reserva.id
}

function titularDe(titular: z.infer<typeof titularWeb>, datos: z.infer<typeof contacto>): NuevaReserva["cliente"] {
  return { nombre: titular.nombre, apellido: titular.apellido, dni: titular.dni, email: datos.email || null, telefono: datos.telefono }
}

async function guardarVisita(nueva: NuevaReserva, sinLugar: () => string, resumen: string): Promise<ResultadoReserva> {
  // El celular queda también en la reserva: el cliente se comparte por DNI y su celular
  // puede cambiar en otra reserva, pero "Ver mi reserva" busca con el de esta.
  const resultado = await guardar({ ...nueva, detalle: { ...nueva.detalle, telefono: nueva.cliente.telefono } }, sinLugar)
  if (nueva.reemplaza) await anotarDelCliente({ accion: "modificó", detalle: `Modificó su reserva ${nueva.reemplaza} desde la web: ${resumen}`, reservaId: nueva.reemplaza })
  return resultado
}

const comunDeVisita = { titular: titularWeb, contacto, forma: formaDePagoWeb, token: z.string().max(40).optional() }

const pedidoDeFinde = z.object({
  fecha: z.string(),
  ubicacion: z.enum(["parrilla", "gazebo", "palapa"]),
  /// La parrilla la elige el grupo; gazebos y palapas los asigna el predio.
  parrilla: z.string().max(24).optional(),
  almuerzo: z.boolean().optional(),
  grupo: grupoWeb,
  ...comunDeVisita,
})

const nombresDeUbicacion = { parrilla: "Parrilla", gazebo: "Gazebo", palapa: "Palapa" } as const

export async function reservarFinde(pedido: z.input<typeof pedidoDeFinde>): Promise<ResultadoReserva> {
  return reservar("reservarFinde", async () => {
    const datos = pedidoDeFinde.parse(pedido)
    const reemplaza = await reservaAModificar(datos.token, "FINDE_FAMILIA")
    exigir(fechaReservable(datos.fecha), "Elegí un día de hoy en adelante, dentro del próximo año.")
    await exigirAbierto(datos.fecha, datos.fecha, "Ese día")
    const ocupan = personasQueOcupan(datos.grupo)
    exigir(
      datos.ubicacion !== "parrilla" || ocupan <= MAX_PERSONAS_PARRILLA,
      `Para más de ${MAX_PERSONAS_PARRILLA} personas les asignamos un quincho: escribinos por WhatsApp.`,
    )
    const dia = await tipoDelDia(datos.fecha)
    const playa = datos.ubicacion !== "parrilla"
    const disponibles = await unidadesDeLaWeb(datos.ubicacion)
    let elegida: UnidadPredio | undefined
    if (!playa) {
      elegida = disponibles.find((unidad) => unidad.id === datos.parrilla)
      exigir(elegida, "Elegí la parrilla en el mapa.")
      const revision = revisarEleccion("parrilla", ocupan, [elegida])
      exigir(revision.ok, revision.ok ? "" : revision.mensaje)
    }
    const cantidadPlaya = lugaresDePlayaPara(ocupan)
    let motivo = ""

    return guardarVisita(
      {
        modulo: "FINDE_FAMILIA",
        desde: datos.fecha,
        hasta: datos.fecha,
        ...HORARIO,
        cliente: titularDe(datos.titular, datos.contacto),
        grupo: datos.grupo,
        cotizacion: cotizarDia(datos.grupo, dia),
        propuesta: nombresDeUbicacion[datos.ubicacion],
        notas: datos.titular.notas ? `Algo importante: ${datos.titular.notas}` : null,
        formaPago: datos.forma,
        detalle: { almuerzo: playa ? Boolean(datos.almuerzo) : false },
        reemplaza,
        asignar: (ocupacion) => {
          const libre = libreEn(ocupacion, datos.fecha, datos.fecha)
          const libres = disponibles.filter((unidad) => libre(unidad.id))
          if (elegida) {
            // La parrilla tiene que seguir libre y seguir siendo del tamaño que le toca:
            // si se liberó una del tamaño justo, no se toma una más grande.
            if (!parrillasOfrecidas(ocupan, libres).some((unidad) => unidad.id === elegida.id)) {
              motivo = `Justo alguien reservó la parrilla ${elegida.etiqueta} para ese día. Volvé al paso de la ubicación y elegí otra.`
              return null
            }
            return [elegida.id]
          }
          const asignadas = libres.sort((a, b) => a.numero - b.numero).slice(0, cantidadPlaya)
          if (asignadas.length < cantidadPlaya) {
            motivo =
              datos.ubicacion === "gazebo"
                ? "No tenemos los gazebos necesarios para tu reserva: te recomendamos reservar una palapa."
                : "No quedan palapas para reservar por la web ese día: probá con un gazebo, otro día o escribinos por WhatsApp."
            return null
          }
          return asignadas.map((unidad) => unidad.id)
        },
      },
      () => motivo,
      `${fechaLarga(datos.fecha).toLowerCase()}, ${nombresDeUbicacion[datos.ubicacion].toLowerCase()}, ${datos.grupo.adultos + datos.grupo.menores + datos.grupo.sinCargo} personas`,
    )
  })
}

const pedidoDeBungalow = z.object({
  fecha: z.string(),
  bungalows: z.array(z.string().max(24)).min(1, "Elegí los bungalows.").max(4),
  grupo: grupoWeb,
  ...comunDeVisita,
  forma: z.literal("TRANSFERENCIA").default("TRANSFERENCIA"),
})

export async function reservarBungalow(pedido: z.input<typeof pedidoDeBungalow>): Promise<ResultadoReserva> {
  return reservar("reservarBungalow", async () => {
    const datos = pedidoDeBungalow.parse(pedido)
    const reemplaza = await reservaAModificar(datos.token, "BUNGALOW")
    exigir(fechaReservable(datos.fecha), "Elegí un día de hoy en adelante, dentro del próximo año.")
    exigir(entradaDeBungalow(datos.fecha), "Los bungalows se reservan entrando jueves (hasta el viernes) o sábado (hasta el domingo).")
    const salida = sumarDiasIso(datos.fecha, 1)
    await exigirAbierto(datos.fecha, salida, "Alguno de esos días")
    const ocupan = personasQueOcupan(datos.grupo)
    exigir(ocupan <= MAX_PERSONAS_BUNGALOWS, `Para más de ${MAX_PERSONAS_BUNGALOWS} personas armamos la estadía a medida: escribinos por WhatsApp.`)
    const elegidas = lugaresElegidos("bungalow", datos.bungalows, ocupan)
    let tomados: UnidadPredio[] = []

    return guardarVisita(
      {
        modulo: "BUNGALOW",
        desde: datos.fecha,
        hasta: salida,
        ...HORARIO_BUNGALOW,
        cliente: titularDe(datos.titular, datos.contacto),
        grupo: datos.grupo,
        cotizacion: cotizarBungalows(elegidas.length),
        propuesta: "Bungalow",
        notas: datos.titular.notas ? `Algo importante: ${datos.titular.notas}` : null,
        formaPago: "TRANSFERENCIA",
        detalle: { pagoAnticipado: true },
        reemplaza,
        asignar: (ocupacion) => {
          const libre = libreEn(ocupacion, datos.fecha, salida)
          tomados = elegidas.filter((unidad) => !libre(unidad.id))
          return tomados.length ? null : elegidas.map((unidad) => unidad.id)
        },
      },
      () => tomadosRecien(tomados),
      `estadía desde el ${fechaLarga(datos.fecha).toLowerCase()}, ${elegidas.length} ${elegidas.length === 1 ? "bungalow" : "bungalows"}`,
    )
  })
}

const pedidoDeNado = z.object({
  fecha: z.string(),
  horario: franjaDeNado,
  nadadores: z.number().int().min(1, "Contanos cuántos nadan.").max(MAX_PERSONAS_WEB, `Para más de ${MAX_PERSONAS_WEB} nadadores escribinos por WhatsApp.`),
  club: z.string().trim().max(80, "Es muy largo: dejalo en 80 letras o menos.").optional(),
  ...comunDeVisita,
})

export async function reservarNado(pedido: z.input<typeof pedidoDeNado>): Promise<ResultadoReserva> {
  return reservar("reservarNado", async () => {
    const datos = pedidoDeNado.parse(pedido)
    const reemplaza = await reservaAModificar(datos.token, "NADO")
    exigir(fechaReservable(datos.fecha), "Elegí un día de hoy en adelante, dentro del próximo año.")
    await exigirAbierto(datos.fecha, datos.fecha, "Ese día")
    const dia = await tipoDelDia(datos.fecha)
    const notas = [datos.club ? `Club o natatorio: ${datos.club}` : null, datos.titular.notas ? `Algo importante: ${datos.titular.notas}` : null].filter(Boolean).join("\n")

    return guardarVisita(
      {
        modulo: "NADO",
        desde: datos.fecha,
        hasta: datos.fecha,
        ingreso: textoDeHora(datos.horario.desde),
        salida: textoDeHora(datos.horario.hasta),
        cliente: titularDe(datos.titular, datos.contacto),
        grupo: { adultos: datos.nadadores, menores: 0, sinCargo: 0 },
        cotizacion: cotizarNado(datos.nadadores, dia),
        propuesta: "Nado en aguas abiertas",
        notas: notas || null,
        formaPago: datos.forma,
        detalle: { club: datos.club || null },
        reemplaza,
      },
      () => mensajesDelSitio.inesperado,
      `${fechaLarga(datos.fecha).toLowerCase()}, de ${textoDeHora(datos.horario.desde)} a ${textoDeHora(datos.horario.hasta)}, ${datos.nadadores} nadadores`,
    )
  })
}

/// El cliente cancela desde el ticket: se liberan los lugares y la reserva queda como
/// cancelada (no se borra, para que quede el rastro de lo que pasó).
export async function cancelarMiReserva(token: string): Promise<Resultado> {
  return accion(
    "cancelarMiReserva",
    async () => {
      const reserva = await db().reserva.findUnique({ where: { token: String(token).slice(0, 40) }, select: { id: true, codigo: true, estado: true, desde: true, ingresoEn: true, notas: true } })
      exigir(reserva, "No encontramos esa reserva.")
      if (reserva.estado === "CANCELADA") return { ok: true }
      exigir(!reserva.ingresoEn && deFechaDb(reserva.desde) >= hoyEnElPredio(), "Esta reserva ya no se puede cancelar por la web. Escribinos por WhatsApp.")
      const nota = `Cancelada por el cliente desde la web el ${fechaLarga(hoyEnElPredio()).toLowerCase()}.`
      await db().$transaction([
        db().ocupacion.deleteMany({ where: { reservaId: reserva.id } }),
        db().reserva.update({ where: { id: reserva.id }, data: { estado: "CANCELADA", confirmacion: "CANCELO", confirmacionEn: new Date(), notas: [reserva.notas, nota].filter(Boolean).join("\n") } }),
      ])
      await anotarDelCliente({ accion: "canceló", detalle: `Canceló su reserva ${reserva.id} (${reserva.codigo}) desde la web`, reservaId: reserva.id })
      return { ok: true }
    },
    mensajesDelSitio,
  )
}

const dietas = z.object({ celiacos: cantidad, vegetarianos: cantidad, veganos: cantidad })

const pedidoDeGrupo = z.object({
  tipo: z.enum(["CAMPAMENTO", "SALIDA_EDUCATIVA", "VIAJE_EGRESADOS", "ACTIVIDAD_AVENTURA"]),
  modalidad: z.string().trim().max(80, "Elegí una de las modalidades."),
  institucion: z.string().trim().min(2, "Escribí el nombre de la institución.").max(120, "Es muy largo: dejalo en 120 letras o menos."),
  direccion: z.string().trim().max(160, "Es muy larga: dejala en 160 letras o menos."),
  responsable: z.object({ nombre, apellido: nombre, cargo: z.string().trim().min(2, "Contanos qué rol tenés en el grupo.").max(80, "Es muy largo: dejalo en 80 letras o menos."), telefono, email }),
  participantes: z.number().int().min(1, "Contanos cuántos vienen.").max(999, "Para más de 999 personas escribinos por WhatsApp."),
  edades: z.string().trim().min(1, "Contanos la edad del grupo.").max(60, "Es muy largo: resumilo en pocas palabras."),
  acompanantes: cantidad,
  desde: z.string(),
  hasta: z.string(),
  dietas: z.object({ participantes: dietas, acompanantes: dietas }),
  observaciones: z.string().trim().max(1000, "Es muy largo: dejalo en 1000 letras o menos."),
})

export async function enviarPedidoDeGrupo(pedido: z.input<typeof pedidoDeGrupo>): Promise<ResultadoReserva> {
  return reservar("enviarPedidoDeGrupo", async () => {
    const datos = pedidoDeGrupo.parse(pedido)
    exigir(
      fechaReservable(datos.desde) && fechaReservable(datos.hasta) && datos.hasta >= datos.desde,
      "Revisá las fechas: el ingreso tiene que ser de hoy en adelante y el egreso, el mismo día o después.",
    )
    exigir(
      fechasEntre(datos.desde, datos.hasta).length - 1 <= MAX_NOCHES,
      `Por acá se pueden pedir hasta ${MAX_NOCHES} noches. Para algo más largo escribinos por WhatsApp.`,
    )

    return guardar(
      {
        modulo: datos.tipo,
        desde: datos.desde,
        hasta: datos.hasta,
        ...HORARIO,
        cliente: {
          nombre: datos.responsable.nombre,
          apellido: datos.responsable.apellido,
          dni: null,
          email: datos.responsable.email || null,
          telefono: datos.responsable.telefono,
        },
        institucion: datos.institucion,
        cargo: datos.responsable.cargo,
        edadesGrupo: datos.edades,
        propuesta: datos.modalidad.slice(0, 120) || null,
        notas: datos.observaciones || null,
        grupo: { adultos: datos.acompanantes, menores: datos.participantes, sinCargo: 0 },
        cotizacion: cotizacionAConfirmar,
        extra: { direccion: datos.direccion, dietas: datos.dietas },
      },
      () => mensajesDelSitio.inesperado,
    )
  })
}
