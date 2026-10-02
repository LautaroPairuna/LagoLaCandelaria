import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/prisma"

export type ConsultaNueva = {
  name: string
  contact: string
  groupType: string
  date: string
  message: string
  desde: string
  hasta: string
}

const INTENTOS_POR_CHOQUE = 3

export function baseCaida(error: unknown) {
  if (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1000", "P1001", "P1002", "P1017", "P2021", "P2022"].includes(error.code)) ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true
  }
  const texto = error instanceof Error ? `${error.name} ${error.message}` : ""
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connect|pool timeout|database server|DATABASE_URL/i.test(texto)
}

function choqueDeTransacciones(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return true
  const texto = error instanceof Error ? error.message : ""
  return /deadlock|lock wait timeout|try restarting transaction/i.test(texto)
}

function entreFechas(desde: string, hasta: string) {
  return {
    gte: new Date(`${desde}T00:00:00.000Z`),
    lte: new Date(`${hasta}T00:00:00.000Z`),
  }
}

export async function mensajesEntre(desde: string, hasta: string) {
  const consultas = await db().reservationInquiry.findMany({
    where: { date: entreFechas(desde, hasta) },
    select: { message: true },
  })
  return consultas.map((consulta) => consulta.message)
}

export async function mensajePorId(id: string) {
  const fila = await db().reservationInquiry.findUnique({
    where: { id },
    select: { message: true },
  })
  return fila?.message ?? null
}

// Serializable hace que MariaDB bloquee el rango de fechas leído: si dos solicitudes
// piden el mismo lugar a la vez, una espera o cae por deadlock y se reintenta,
// en vez de guardarse las dos.
async function guardarUnaVez(consulta: ConsultaNueva, conflictoDe: (mensajes: string[]) => string[]) {
  return db().$transaction(
    async (tx) => {
      const existentes = await tx.reservationInquiry.findMany({
        where: { date: entreFechas(consulta.desde, consulta.hasta) },
        select: { message: true },
      })
      const conflicto = conflictoDe(existentes.map((fila) => fila.message))
      if (conflicto.length > 0) return { conflicto }

      const creada = await tx.reservationInquiry.create({
        data: {
          name: consulta.name.slice(0, 160),
          contact: consulta.contact.slice(0, 255),
          groupType: consulta.groupType.slice(0, 120),
          date: new Date(`${consulta.date}T00:00:00.000Z`),
          message: consulta.message,
        },
      })
      return { id: creada.id }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

export async function guardarConsulta(
  consulta: ConsultaNueva,
  conflictoDe: (mensajes: string[]) => string[],
): Promise<{ id: string } | { conflicto: string[] }> {
  for (let intento = 1; ; intento += 1) {
    try {
      return await guardarUnaVez(consulta, conflictoDe)
    } catch (error) {
      if (intento >= INTENTOS_POR_CHOQUE || !choqueDeTransacciones(error)) throw error
    }
  }
}
