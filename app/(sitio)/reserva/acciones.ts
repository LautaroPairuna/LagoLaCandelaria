"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { diasEspeciales } from "@/lib/disponibilidad"
import { limiteAlcanzado, registrarUso } from "@/lib/limite"
import { asignarParrilla, asignarPlaya } from "@/lib/predio/asignacion"
import { asignarBungalows, bungalowsPara } from "@/lib/predio/bungalows"
import { estadoDelDia } from "@/lib/predio/calendario"
import { dniValido, limpiarDni, normalizarTelefono } from "@/lib/predio/contacto"
import { cotizacionAConfirmar, cotizarBungalows, cotizarDia } from "@/lib/predio/cotizacion"
import { esFechaIso, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { baseCaida, crearReserva, libreEn, type NuevaReserva } from "@/lib/reservas"

export type ResultadoReserva = { ok: true; token: string } | { ok: false; error: string; campos?: Record<string, string> }

const HORARIO = { ingreso: "10:00", salida: "19:00" }
const MAX_NOCHES = 14
const sinRespuesta = "El sistema de reservas no responde. Probá en un rato o escribinos por WhatsApp."

const nombre = z
  .string()
  .trim()
  .min(2, "Escribí el nombre.")
  .max(40, "Es demasiado largo.")
  .regex(/^[\p{L}' -]+$/u, "Solo letras.")
const telefono = z
  .string()
  .transform((valor, contexto) => {
    const normalizado = normalizarTelefono(valor)
    if (!normalizado) {
      contexto.addIssue({ code: "custom", message: "Característica y número, 10 dígitos en total (por ejemplo 11 3009 1020)." })
      return z.NEVER
    }
    return normalizado.e164
  })
const email = z.string().trim().max(120).email("Ese correo no parece completo.").or(z.literal("")).optional()
const dni = z
  .string()
  .transform(limpiarDni)
  .refine(dniValido, "El DNI tiene 7 u 8 números.")
const cantidad = (minimo: number) => z.number().int().min(minimo).max(99)

const responsable = z.object({
  nombre,
  apellido: nombre,
  dni,
  edad: z.number().int().min(18, "Quien reserva tiene que ser mayor de edad.").max(120),
  telefono,
  email,
})

const grupoFamiliar = {
  responsable,
  adultos: cantidad(1),
  menores: cantidad(0),
  sinCargo: cantidad(0),
  formaPago: z.enum(["EFECTIVO", "DEBITO"]),
}

function camposDe(error: z.ZodError) {
  const campos: Record<string, string> = {}
  for (const problema of error.issues) campos[problema.path.join(".")] ??= problema.message
  return campos
}

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

function clienteDe(datos: z.infer<typeof responsable>): NuevaReserva["cliente"] {
  return { nombre: datos.nombre, apellido: datos.apellido, dni: datos.dni, email: datos.email || null, telefono: datos.telefono }
}

async function guardar(nueva: NuevaReserva, sinLugar: () => string): Promise<ResultadoReserva> {
  try {
    const creada = await crearReserva(nueva)
    if ("sinLugar" in creada) return { ok: false, error: sinLugar() }
    registrarUso(await claveDeLimite(), VENTANA_MS)
    return { ok: true, token: creada.token }
  } catch (error) {
    console.error("Reserva no guardada", error instanceof Error ? `${error.name} ${error.message.slice(0, 160)}` : "unknown")
    return { ok: false, error: baseCaida(error) ? sinRespuesta : "No pudimos guardar la reserva. Probá de nuevo en un momento." }
  }
}

const pedidoDeDia = z.object({ fecha: z.string(), lugar: z.enum(["parrilla", "playa"]), ...grupoFamiliar })

export async function reservarDia(pedido: z.input<typeof pedidoDeDia>): Promise<ResultadoReserva> {
  if (await limitar()) return { ok: false, error: "Recibimos muchas reservas desde tu conexión. Esperá unos minutos." }
  const entrada = pedidoDeDia.safeParse(pedido)
  if (!entrada.success) return { ok: false, error: "Revisá los datos marcados.", campos: camposDe(entrada.error) }
  const datos = entrada.data
  if (!fechaReservable(datos.fecha)) return { ok: false, error: "Elegí una fecha de hoy en adelante." }

  try {
    const cerrado = await fechasAbiertas(datos.fecha, datos.fecha)
    if (cerrado) return { ok: false, error: `Ese día el predio está cerrado. ${cerrado}` }
  } catch {
    return { ok: false, error: sinRespuesta }
  }

  const grupo = { adultos: datos.adultos, menores: datos.menores, sinCargo: datos.sinCargo }
  const personas = grupo.adultos + grupo.menores + grupo.sinCargo
  const asignador = datos.lugar === "parrilla" ? asignarParrilla : asignarPlaya

  return guardar(
    {
      modulo: "FINDE_FAMILIA",
      desde: datos.fecha,
      hasta: datos.fecha,
      ...HORARIO,
      cliente: clienteDe(datos.responsable),
      grupo,
      cotizacion: cotizarDia(grupo),
      formaPago: datos.formaPago,
      propuesta: datos.lugar === "parrilla" ? "Parrilla" : "Gazebo o palapa",
      personas: [responsableComoPersona(datos.responsable)],
      asignar: (ocupacion) => {
        const resultado = asignador(personas, libreEn(ocupacion, datos.fecha, datos.fecha))
        return "unidades" in resultado ? resultado.unidades.map((unidad) => unidad.id) : null
      },
    },
    () =>
      datos.lugar === "parrilla"
        ? `Ese día ya no queda parrilla para ${personas} personas. Probá con otra fecha o con un lugar en la playa.`
        : "Ese día ya no quedan gazebos ni palapas libres. Probá con otra fecha o con una parrilla.",
  )
}

const pedidoDeBungalow = z.object({ desde: z.string(), hasta: z.string(), ...grupoFamiliar })

export async function reservarBungalow(pedido: z.input<typeof pedidoDeBungalow>): Promise<ResultadoReserva> {
  if (await limitar()) return { ok: false, error: "Recibimos muchas reservas desde tu conexión. Esperá unos minutos." }
  const entrada = pedidoDeBungalow.safeParse(pedido)
  if (!entrada.success) return { ok: false, error: "Revisá los datos marcados.", campos: camposDe(entrada.error) }
  const datos = entrada.data
  if (!fechaReservable(datos.desde) || !fechaReservable(datos.hasta) || datos.hasta <= datos.desde) {
    return { ok: false, error: "Elegí la fecha de llegada y la de salida, al menos un día después." }
  }
  const noches = fechasEntre(datos.desde, datos.hasta).length - 1
  if (noches > MAX_NOCHES) return { ok: false, error: `Se pueden reservar hasta ${MAX_NOCHES} noches por la web.` }

  const grupo = { adultos: datos.adultos, menores: datos.menores, sinCargo: datos.sinCargo }
  const personas = grupo.adultos + grupo.menores + grupo.sinCargo
  if (personas > 16) return { ok: false, error: "Para más de 16 personas escribinos por WhatsApp." }

  try {
    const cerrado = await fechasAbiertas(datos.desde, datos.hasta)
    if (cerrado) return { ok: false, error: `Alguno de esos días el predio está cerrado. ${cerrado}` }
  } catch {
    return { ok: false, error: sinRespuesta }
  }

  let motivo: "ocupado" | "deja-huecos" = "ocupado"
  const cantidadDeBungalows = bungalowsPara(personas)
  return guardar(
    {
      modulo: "BUNGALOW",
      desde: datos.desde,
      hasta: datos.hasta,
      ...HORARIO,
      cliente: clienteDe(datos.responsable),
      grupo,
      cotizacion: cotizarBungalows(personas, noches, cantidadDeBungalows),
      formaPago: datos.formaPago,
      personas: [responsableComoPersona(datos.responsable)],
      asignar: (ocupacion) => {
        const resultado = asignarBungalows(personas, datos.desde, datos.hasta, hoyEnElPredio(), ocupacion)
        if ("unidades" in resultado) return resultado.unidades.map((unidad) => unidad.id)
        motivo = resultado.motivo
        return null
      },
    },
    () =>
      motivo === "deja-huecos"
        ? "Esas fechas dejarían un día suelto que nadie puede reservar. Probá corriendo la estadía un día."
        : "No hay bungalows libres para esas fechas. Probá con otras.",
  )
}

const dietas = z.object({ celiacos: cantidad(0), vegetarianos: cantidad(0), veganos: cantidad(0) })

const pedidoDeGrupo = z.object({
  tipo: z.enum(["CAMPAMENTO", "SALIDA_EDUCATIVA", "VIAJE_EGRESADOS", "ACTIVIDAD_AVENTURA"]),
  modalidad: z.string().trim().max(40),
  institucion: z.string().trim().min(2, "Escribí el nombre de la institución.").max(120),
  direccion: z.string().trim().max(160),
  responsable: z.object({ nombre, apellido: nombre, cargo: z.string().trim().min(2, "Indicá el cargo.").max(80), telefono, email }),
  participantes: z.number().int().min(1).max(999),
  edades: z.string().trim().min(1, "Contanos la edad del grupo.").max(60),
  acompanantes: cantidad(0),
  desde: z.string(),
  hasta: z.string(),
  dietas: z.object({ participantes: dietas, acompanantes: dietas }),
  observaciones: z.string().trim().max(1000),
})

export async function enviarPedidoDeGrupo(pedido: z.input<typeof pedidoDeGrupo>): Promise<ResultadoReserva> {
  if (await limitar()) return { ok: false, error: "Recibimos muchos pedidos desde tu conexión. Esperá unos minutos." }
  const entrada = pedidoDeGrupo.safeParse(pedido)
  if (!entrada.success) return { ok: false, error: "Revisá los datos marcados.", campos: camposDe(entrada.error) }
  const datos = entrada.data
  if (!fechaReservable(datos.desde) || !fechaReservable(datos.hasta) || datos.hasta < datos.desde) {
    return { ok: false, error: "Revisá las fechas de ingreso y egreso." }
  }
  if (fechasEntre(datos.desde, datos.hasta).length - 1 > MAX_NOCHES) {
    return { ok: false, error: `La estadía puede pedirse hasta ${MAX_NOCHES} noches.` }
  }

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
    () => "No pudimos guardar el pedido.",
  )
}

function responsableComoPersona(datos: z.infer<typeof responsable>) {
  return {
    familia: 1,
    responsable: true,
    nombre: datos.nombre,
    apellido: datos.apellido,
    dni: datos.dni,
    edad: datos.edad,
    cud: false,
    notas: null,
  }
}
