import { estadoDelDia, mapaDeEspeciales, type TipoDia } from "@/lib/predio/calendario"
import { aFechaDb, deFechaDb, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { unidadesDelTipo, type TipoUnidad } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"
import { ocupacionPorUnidad } from "@/lib/reservas"

export const categorias = {
  parrilla: ["PARRILLA", "QUINCHO"],
  playa: ["GAZEBO", "PALAPA"],
  bungalow: ["BUNGALOW"],
} as const satisfies Record<string, readonly TipoUnidad[]>

export type Categoria = keyof typeof categorias

export type EstadoDeFecha = { estado: "libre" | "completo" | "pasado" } | { estado: "cerrado"; motivo: string }

export async function diasEspeciales(desde: string, hasta: string) {
  const filas = await db().diaEspecial.findMany({ where: { fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) } } })
  return mapaDeEspeciales(filas.map((fila) => ({ fecha: deFechaDb(fila.fecha), tipo: fila.tipo as TipoDia, motivo: fila.motivo })))
}

export async function disponibilidadDelMes(mes: string, categoria: Categoria) {
  const inicio = `${mes}-01`
  const [anio, numero] = mes.split("-").map(Number)
  const fin = new Date(Date.UTC(anio, numero, 0)).toISOString().slice(0, 10)
  const hoy = hoyEnElPredio()
  const unidades = unidadesDelTipo(...categorias[categoria]).map((unidad) => unidad.id)

  const [especiales, ocupacion] = await Promise.all([
    diasEspeciales(inicio, fin),
    ocupacionPorUnidad(sumarDiasIso(inicio, -8), sumarDiasIso(fin, 8)),
  ])

  const dias: Record<string, EstadoDeFecha> = {}
  for (const fecha of fechasEntre(inicio, fin)) {
    const apertura = estadoDelDia(fecha, especiales)
    if (fecha < hoy) dias[fecha] = { estado: "pasado" }
    else if (!apertura.abierto) dias[fecha] = { estado: "cerrado", motivo: apertura.motivo }
    else dias[fecha] = { estado: unidades.every((id) => ocupacion.get(id)?.has(fecha)) ? "completo" : "libre" }
  }

  const bungalows =
    categoria === "bungalow"
      ? Object.fromEntries(unidades.map((id) => [id, [...(ocupacion.get(id) ?? [])]]))
      : undefined

  return { hoy, dias, bungalows }
}
