"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { categorias, diasEspeciales } from "@/lib/disponibilidad"
import { accion, ErrorHumano, exigir, mensajesDelSitio, type Resultado } from "@/lib/errores"
import { limiteAlcanzado, registrarUso } from "@/lib/limite"
import { estadoDelBungalow } from "@/lib/predio/bungalows"
import { estadoDelDia } from "@/lib/predio/calendario"
import { cotizacionAConfirmar, cotizacionDeConsumo, cotizarBungalows, cotizarDia } from "@/lib/predio/cotizacion"
import { grupoPorEdades, revisarEleccion, type TipoDeLugar } from "@/lib/predio/eleccion"
import { esFechaIso, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { esFranja, horasDe, textoDeHora } from "@/lib/predio/horario"
import { inventario, MAX_PERSONAS_RESTAURANTE, type UnidadPredio } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { contacto, email, familias, nombre, personasDe, telefono, type FamiliaValida } from "@/lib/reserva-familia"
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
        cotizacion: restaurante ? cotizacionDeConsumo : cotizarDia(grupo),
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

const pedidoDeBungalow = z.object({ desde: z.string(), hasta: z.string(), ...grupoFamiliar })

export async function reservarBungalow(pedido: z.input<typeof pedidoDeBungalow>): Promise<ResultadoReserva> {
  return reservar("reservarBungalow", async () => {
    const datos = pedidoDeBungalow.parse(pedido)
    exigir(
      fechaReservable(datos.desde) && fechaReservable(datos.hasta) && datos.hasta > datos.desde,
      "Elegí el día de llegada y el de salida en el calendario: la salida tiene que ser al menos un día después.",
    )
    const noches = fechasEntre(datos.desde, datos.hasta).length - 1
    exigir(noches <= MAX_NOCHES, `Por la web se pueden reservar hasta ${MAX_NOCHES} noches. Para estadías más largas escribinos por WhatsApp.`)
    const personas = personasDe(datos.familias)
    exigir(personas.length <= 16, "Para más de 16 personas armamos la estadía a medida: escribinos por WhatsApp.")
    await exigirAbierto(datos.desde, datos.hasta, "Alguno de esos días")
    const elegidas = lugaresElegidos("bungalow", datos.unidades, personas.length)
    const grupo = grupoPorEdades(personas.map((persona) => persona.edad))
    let tomados: UnidadPredio[] = []
    let dejaHuecos = false

    return guardar(
      {
        modulo: "BUNGALOW",
        desde: datos.desde,
        hasta: datos.hasta,
        ...HORARIO,
        cliente: clienteDe(datos.familias, datos.contacto),
        grupo,
        cotizacion: cotizarBungalows(personas.length, noches, elegidas.length),
        personas: personasParaGuardar(datos.familias),
        asignar: (ocupacion) => {
          const hoy = hoyEnElPredio()
          const estados = elegidas.map((unidad) => ({ unidad, estado: estadoDelBungalow(ocupacion.get(unidad.id) ?? new Set(), datos.desde, datos.hasta, hoy) }))
          tomados = estados.filter((item) => item.estado !== "libre").map((item) => item.unidad)
          dejaHuecos = estados.every((item) => item.estado !== "ocupado")
          return tomados.length ? null : elegidas.map((unidad) => unidad.id)
        },
      },
      () =>
        dejaHuecos
          ? "Con esas fechas quedaría una noche suelta en ese bungalow que nadie más podría reservar. Probá con otro bungalow o corriendo la estadía un día."
          : tomadosRecien(tomados),
    )
  })
}

const dietas = z.object({ celiacos: cantidad, vegetarianos: cantidad, veganos: cantidad })

const pedidoDeGrupo = z.object({
  tipo: z.enum(["CAMPAMENTO", "SALIDA_EDUCATIVA", "VIAJE_EGRESADOS", "ACTIVIDAD_AVENTURA"]),
  modalidad: z.string().trim().max(40, "Elegí una de las modalidades."),
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
        propuesta: datos.modalidad || null,
        notas: datos.observaciones || null,
        grupo: { adultos: datos.acompanantes, menores: datos.participantes, sinCargo: 0 },
        cotizacion: cotizacionAConfirmar,
        extra: { direccion: datos.direccion, dietas: datos.dietas },
      },
      () => mensajesDelSitio.inesperado,
    )
  })
}
