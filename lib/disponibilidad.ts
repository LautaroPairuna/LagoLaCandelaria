import { estadoDelDia, mapaDeEspeciales, type TipoDia } from "@/lib/predio/calendario"
import { aFechaDb, deFechaDb, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { estadoDelBungalow } from "@/lib/predio/bungalows"
import { hayLugarPara } from "@/lib/predio/eleccion"
import { unidadesDelTipo, type TipoUnidad, type UnidadPredio } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"
import { ocupacionPorUnidad } from "@/lib/reservas"

export const categorias = {
  parrilla: ["PARRILLA", "QUINCHO"],
  playa: ["GAZEBO", "PALAPA"],
  bungalow: ["BUNGALOW"],
  restaurante: ["MESA_RESTAURANTE"],
} as const satisfies Record<string, readonly TipoUnidad[]>

export type Categoria = keyof typeof categorias

export type EstadoDeFecha = { estado: "libre" | "completo" | "pasado" } | { estado: "cerrado"; motivo: string }

export async function diasEspeciales(desde: string, hasta: string) {
  const filas = await db().diaEspecial.findMany({ where: { fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) } } })
  return mapaDeEspeciales(filas.map((fila) => ({ fecha: deFechaDb(fila.fecha), tipo: fila.tipo as TipoDia, motivo: fila.motivo })))
}

export async function disponibilidadDelMes(mes: string, categoria: Categoria, personas = 1) {
  const inicio = `${mes}-01`
  const [anio, numero] = mes.split("-").map(Number)
  const fin = new Date(Date.UTC(anio, numero, 0)).toISOString().slice(0, 10)
  const hoy = hoyEnElPredio()
  const delTipo = unidadesDelTipo(...categorias[categoria])
  const unidades = delTipo.map((unidad) => unidad.id)

  const [especiales, ocupacion] = await Promise.all([
    diasEspeciales(inicio, fin),
    ocupacionPorUnidad(sumarDiasIso(inicio, -8), sumarDiasIso(fin, 8)),
  ])

  const dias: Record<string, EstadoDeFecha> = {}
  for (const fecha of fechasEntre(inicio, fin)) {
    const apertura = estadoDelDia(fecha, especiales)
    if (fecha < hoy) dias[fecha] = { estado: "pasado" }
    else if (!apertura.abierto) dias[fecha] = { estado: "cerrado", motivo: apertura.motivo }
    else {
      const libres = delTipo.filter((unidad) => !ocupacion.get(unidad.id)?.has(fecha))
      const alcanza = categoria === "bungalow" ? libres.length > 0 : hayLugarPara(categoria, personas, libres)
      dias[fecha] = { estado: alcanza ? "libre" : "completo" }
    }
  }

  const bungalows =
    categoria === "bungalow"
      ? Object.fromEntries(unidades.map((id) => [id, [...(ocupacion.get(id) ?? [])]]))
      : undefined

  return { hoy, dias, bungalows }
}

export type LugarDisponible = Pick<UnidadPredio, "id" | "tipo" | "numero" | "etiqueta" | "capacidad" | "mesas"> & {
  estado: "libre" | "ocupado" | "deja-huecos"
}

/// Estado de cada lugar de la categoría para un día (o una estadía, en bungalows).
/// No expone de quién es la reserva.
export async function lugaresDisponibles(categoria: Categoria, desde: string, hasta: string): Promise<LugarDisponible[]> {
  const ocupacion = await ocupacionPorUnidad(sumarDiasIso(desde, -8), sumarDiasIso(hasta, 8))
  const hoy = hoyEnElPredio()
  const vacio = new Set<string>()
  return unidadesDelTipo(...categorias[categoria]).map(({ id, tipo, numero, etiqueta, capacidad, mesas }) => {
    const ocupadas = ocupacion.get(id) ?? vacio
    const estado =
      categoria === "bungalow"
        ? estadoDelBungalow(ocupadas, desde, hasta, hoy)
        : fechasEntre(desde, hasta).some((fecha) => ocupadas.has(fecha))
          ? "ocupado"
          : "libre"
    return { id, tipo, numero, etiqueta, capacidad, mesas, estado }
  })
}
