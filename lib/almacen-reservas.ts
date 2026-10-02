import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises"
import net from "node:net"
import path from "node:path"

import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export type ConsultaNueva = {
  name: string
  contact: string
  groupType: string
  date: string
  message: string
  desde: string
  hasta: string
}

type Fila = {
  id: string
  name: string
  contact: string
  groupType: string
  date: string | null
  message: string
  createdAt: string
}

const archivo = path.join(process.cwd(), "data", "reservas.json")
const candado = `${archivo}.lock`

function esFila(valor: unknown): valor is Fila {
  if (!valor || typeof valor !== "object") return false
  const fila = valor as Fila
  return typeof fila.id === "string" && typeof fila.message === "string"
}

function enVentana(fila: Fila, desde: string, hasta: string) {
  if (!fila.date) return false
  const dia = fila.date.slice(0, 10)
  return dia >= desde && dia <= hasta
}

async function leerArchivo() {
  try {
    const texto = await readFile(archivo, "utf8")
    const datos = JSON.parse(texto) as unknown
    return Array.isArray(datos) ? datos.filter(esFila) : []
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return []
    throw error
  }
}

async function escribirArchivo(filas: Fila[]) {
  await mkdir(path.dirname(archivo), { recursive: true })
  const temporal = `${archivo}.${process.pid}.tmp`
  await writeFile(temporal, JSON.stringify(filas, null, 2), "utf8")
  await unlink(archivo).catch(() => undefined)
  await rename(temporal, archivo)
}

async function conCandado<T>(tarea: () => Promise<T>) {
  await mkdir(path.dirname(archivo), { recursive: true })
  for (let intento = 0; intento < 40; intento += 1) {
    try {
      const asa = await open(candado, "wx")
      try {
        return await tarea()
      } finally {
        await asa.close()
        await unlink(candado).catch(() => undefined)
      }
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error
      await new Promise((resolver) => setTimeout(resolver, 25))
    }
  }
  throw new Error("No se pudo guardar la reserva")
}

function puertoAbierto(host: string, puerto: number) {
  return new Promise<boolean>((resolver) => {
    const socket = net.connect({ host, port: puerto })
    const cerrar = (abierto: boolean) => {
      socket.destroy()
      resolver(abierto)
    }
    socket.setTimeout(400)
    socket.once("connect", () => cerrar(true))
    socket.once("timeout", () => cerrar(false))
    socket.once("error", () => cerrar(false))
  })
}

async function mysqlDisponible() {
  const url = process.env.DATABASE_URL
  if (!url) return false
  try {
    const destino = new URL(url)
    return puertoAbierto(destino.hostname, Number(destino.port || 3306))
  } catch {
    return false
  }
}

function baseCaida(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1000", "P1001", "P1002", "P1017", "P2021", "P2022"].includes(error.code)
  }
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true
  }
  const texto = error instanceof Error ? `${error.name} ${error.message}` : ""
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connect|pool timeout|database server/i.test(texto)
}

async function mensajesMysql(desde: string, hasta: string) {
  const consultas = await prisma.reservationInquiry.findMany({
    where: {
      date: {
        gte: new Date(`${desde}T00:00:00.000Z`),
        lte: new Date(`${hasta}T00:00:00.000Z`),
      },
    },
    select: { message: true },
  })
  return consultas.map((consulta) => consulta.message)
}

export async function mensajesEntre(desde: string, hasta: string) {
  const locales = (await leerArchivo()).filter((fila) => enVentana(fila, desde, hasta)).map((fila) => fila.message)
  if (!(await mysqlDisponible())) return locales
  try {
    const remotas = await mensajesMysql(desde, hasta)
    return [...locales, ...remotas]
  } catch (error) {
    if (!baseCaida(error)) throw error
    return locales
  }
}

export async function mensajePorId(id: string) {
  const local = (await leerArchivo()).find((fila) => fila.id === id)
  if (local) return local.message
  if (!(await mysqlDisponible())) return null
  try {
    const fila = await prisma.reservationInquiry.findUnique({
      where: { id },
      select: { message: true },
    })
    return fila?.message ?? null
  } catch (error) {
    if (!baseCaida(error)) throw error
    return null
  }
}

export async function guardarConsulta(
  consulta: ConsultaNueva,
  conflictoDe: (mensajes: string[]) => string[],
): Promise<{ id: string } | { conflicto: string[] }> {
  if (await mysqlDisponible()) {
    try {
      return await guardarEnMysql(consulta, conflictoDe)
    } catch (error) {
      if (!baseCaida(error)) throw error
    }
  }
  return guardarEnArchivo(consulta, conflictoDe)
}

async function guardarEnArchivo(consulta: ConsultaNueva, conflictoDe: (mensajes: string[]) => string[]) {
  return conCandado(async () => {
    const filas = await leerArchivo()
    const mensajes = filas.filter((fila) => enVentana(fila, consulta.desde, consulta.hasta)).map((fila) => fila.message)
    const conflicto = conflictoDe(mensajes)
    if (conflicto.length > 0) return { conflicto }
    const fila: Fila = {
      id: crypto.randomUUID(),
      name: consulta.name.slice(0, 160),
      contact: consulta.contact.slice(0, 255),
      groupType: consulta.groupType.slice(0, 120),
      date: consulta.date,
      message: consulta.message,
      createdAt: new Date().toISOString(),
    }
    filas.push(fila)
    await escribirArchivo(filas)
    return { id: fila.id }
  })
}

async function guardarEnMysql(consulta: ConsultaNueva, conflictoDe: (mensajes: string[]) => string[]) {
  const locales = (await leerArchivo())
    .filter((fila) => enVentana(fila, consulta.desde, consulta.hasta))
    .map((fila) => fila.message)

  return prisma.$transaction(async (tx) => {
    const remotas = await tx.reservationInquiry.findMany({
      where: {
        date: {
          gte: new Date(`${consulta.desde}T00:00:00.000Z`),
          lte: new Date(`${consulta.hasta}T00:00:00.000Z`),
        },
      },
      select: { message: true },
    })
    const conflicto = conflictoDe([...locales, ...remotas.map((fila) => fila.message)])
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
  })
}
