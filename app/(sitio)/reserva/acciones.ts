"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { diasEspeciales } from "@/lib/disponibilidad"
import { accion, ErrorHumano, exigir, mensajesDelSitio, type Resultado } from "@/lib/errores"
import { limiteAlcanzado, registrarUso } from "@/lib/limite"
import { asignarParrilla, asignarPlaya } from "@/lib/predio/asignacion"
import { asignarBungalows, bungalowsPara } from "@/lib/predio/bungalows"
import { estadoDelDia } from "@/lib/predio/calendario"
import { dniValido, limpiarDni, normalizarTelefono } from "@/lib/predio/contacto"
import { cotizacionAConfirmar, cotizarBungalows, cotizarDia } from "@/lib/predio/cotizacion"
import { esFechaIso, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { crearReserva, libreEn, type NuevaReserva } from "@/lib/reservas"

export type ResultadoReserva = Resultado<{ token: string }>

const HORARIO = { ingreso: "10:00", salida: "19:00" }
const MAX_NOCHES = 14

const nombre = z
  .string()
  .trim()
  .min(2, "Escribilo completo, con al menos 2 letras.")
  .max(40, "Es muy largo: dejalo en 40 letras o menos.")
  .regex(/^[\p{L}' -]+$/u, "Escribilo solo con letras, sin números ni símbolos.")
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
const email = z.string().trim().max(120, "Ese correo es muy largo.").email("Ese correo no parece completo: revisá que tenga @ y el dominio.").or(z.literal("")).optional()
const dni = z
  .string()
  .transform(limpiarDni)
  .refine(dniValido, "El DNI tiene 7 u 8 números, sin puntos.")
const cantidad = (minimo: number) =>
  z
    .number()
    .int()
    .min(minimo, minimo ? "Tiene que venir al menos un adulto." : "Revisá la cantidad.")
    .max(99, "Para más de 99 personas escribinos por WhatsApp.")

const responsable = z.object({
  nombre,
  apellido: nombre,
  dni,
  edad: z.number().int().min(1, "Escribí la edad de quien reserva.").min(18, "Quien reserva tiene que ser mayor de edad.").max(110, "Revisá la edad."),
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

const pedidoDeDia = z.object({ fecha: z.string(), lugar: z.enum(["parrilla", "playa"]), ...grupoFamiliar })

export async function reservarDia(pedido: z.input<typeof pedidoDeDia>): Promise<ResultadoReserva> {
  return reservar("reservarDia", async () => {
    const datos = pedidoDeDia.parse(pedido)
    exigir(fechaReservable(datos.fecha), "Elegí un día de hoy en adelante, dentro del próximo año.")
    await exigirAbierto(datos.fecha, datos.fecha, "Ese día")

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

    const grupo = { adultos: datos.adultos, menores: datos.menores, sinCargo: datos.sinCargo }
    const personas = grupo.adultos + grupo.menores + grupo.sinCargo
    exigir(personas <= 16, "Para más de 16 personas armamos la estadía a medida: escribinos por WhatsApp.")
    await exigirAbierto(datos.desde, datos.hasta, "Alguno de esos días")

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
          ? "Con esas fechas quedaría una noche suelta que nadie más podría reservar. Probá corriendo la estadía un día antes o después."
          : "Justo se ocuparon los bungalows para esas fechas. Probá con otras o escribinos por WhatsApp.",
    )
  })
}

const dietas = z.object({ celiacos: cantidad(0), vegetarianos: cantidad(0), veganos: cantidad(0) })

const pedidoDeGrupo = z.object({
  tipo: z.enum(["CAMPAMENTO", "SALIDA_EDUCATIVA", "VIAJE_EGRESADOS", "ACTIVIDAD_AVENTURA"]),
  modalidad: z.string().trim().max(40, "Elegí una de las modalidades."),
  institucion: z.string().trim().min(2, "Escribí el nombre de la institución.").max(120, "Es muy largo: dejalo en 120 letras o menos."),
  direccion: z.string().trim().max(160, "Es muy larga: dejala en 160 letras o menos."),
  responsable: z.object({ nombre, apellido: nombre, cargo: z.string().trim().min(2, "Contanos qué rol tenés en el grupo.").max(80, "Es muy largo: dejalo en 80 letras o menos."), telefono, email }),
  participantes: z.number().int().min(1, "Contanos cuántos vienen.").max(999, "Para más de 999 personas escribinos por WhatsApp."),
  edades: z.string().trim().min(1, "Contanos la edad del grupo.").max(60, "Es muy largo: resumilo en pocas palabras."),
  acompanantes: cantidad(0),
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
