import type { EstadoReserva, Modulo } from "@/generated/prisma/client"
import { aFechaDb, deFechaDb, sumarDiasIso } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

export const lineas = [
  { id: "familia", nombre: "Finde en familia", modulos: ["FINDE_FAMILIA", "BUNGALOW", "RESTAURANTE"] },
  { id: "estudiantil", nombre: "Estudiantil", modulos: ["CAMPAMENTO", "SALIDA_EDUCATIVA", "VIAJE_EGRESADOS"] },
  { id: "aventura", nombre: "Aventura", modulos: ["ACTIVIDAD_AVENTURA"] },
] as const satisfies readonly { id: string; nombre: string; modulos: readonly Modulo[] }[]

export type LineaId = (typeof lineas)[number]["id"]

export const nombreDelModulo: Record<Modulo, string> = {
  FINDE_FAMILIA: "Finde en familia",
  BUNGALOW: "Bungalow",
  RESTAURANTE: "Restaurante",
  CAMPAMENTO: "Campamento",
  SALIDA_EDUCATIVA: "Salida educativa",
  VIAJE_EGRESADOS: "Viaje de egresados",
  ACTIVIDAD_AVENTURA: "Aventura",
}

export const nombreDeUnidad = {
  PARRILLA: "Parrilla",
  QUINCHO: "Quincho",
  GAZEBO: "Gazebo",
  PALAPA: "Palapa",
  BUNGALOW: "Bungalow",
  MESA_RESTAURANTE: "Mesa restaurante",
  MESA_BAR: "Mesa bar",
} as const

export function esLinea(valor: string | undefined): valor is LineaId {
  return lineas.some((linea) => linea.id === valor)
}

export function lineaDelModulo(modulo: Modulo) {
  return lineas.find((linea) => (linea.modulos as readonly Modulo[]).includes(modulo))!
}

export type ReservaDelMes = {
  id: number
  codigo: string
  modulo: Modulo
  estado: EstadoReserva
  desde: string
  hasta: string
  personas: number
  titular: string
}

export async function reservasDelMes(mes: string, linea?: LineaId): Promise<ReservaDelMes[]> {
  const inicio = `${mes}-01`
  const fin = sumarDiasIso(`${sumarMes(mes, 1)}-01`, -1)
  const filas = await db().reserva.findMany({
    where: {
      estado: { not: "CANCELADA" },
      desde: { lte: aFechaDb(fin) },
      hasta: { gte: aFechaDb(inicio) },
      ...(linea ? { modulo: { in: [...lineas.find((item) => item.id === linea)!.modulos] } } : {}),
    },
    orderBy: [{ desde: "asc" }, { id: "asc" }],
    select: {
      id: true,
      codigo: true,
      modulo: true,
      estado: true,
      desde: true,
      hasta: true,
      adultos: true,
      menores: true,
      sinCargo: true,
      institucion: true,
      cliente: { select: { nombre: true, apellido: true } },
    },
  })
  return filas.map((fila) => ({
    id: fila.id,
    codigo: fila.codigo,
    modulo: fila.modulo,
    estado: fila.estado,
    desde: deFechaDb(fila.desde),
    hasta: deFechaDb(fila.hasta),
    personas: fila.adultos + fila.menores + fila.sinCargo,
    titular: fila.institucion ?? `${fila.cliente.nombre} ${fila.cliente.apellido}`,
  }))
}

export async function reservaParaPanel(id: number) {
  return db().reserva.findUnique({
    where: { id },
    include: {
      cliente: true,
      personas: { orderBy: [{ familia: "asc" }, { id: "asc" }] },
      ocupaciones: { distinct: ["unidadId"], select: { unidad: { select: { id: true, tipo: true, etiqueta: true } } } },
      pagos: { orderBy: { fecha: "asc" } },
    },
  })
}

export function sumarMes(mes: string, meses: number) {
  const [anio, numero] = mes.split("-").map(Number)
  const fecha = new Date(Date.UTC(anio, numero - 1 + meses, 1))
  return fecha.toISOString().slice(0, 7)
}

export function esMes(valor: string | undefined): valor is string {
  return !!valor && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor)
}
