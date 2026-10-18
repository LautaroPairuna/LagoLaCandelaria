import { leerAjustes } from "@/lib/ajustes"
import { estadoDelDia, mapaDeEspeciales, tipoDeDia, type TipoDia } from "@/lib/predio/calendario"
import { aFechaDb, deFechaDb, diaDeLaSemana, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { hayLugarPara } from "@/lib/predio/eleccion"
import { unidadesDelTipo, type TipoUnidad, type UnidadPredio } from "@/lib/predio/inventario"
import type { TipoDeDia } from "@/lib/predio/tarifas"
import { db } from "@/lib/prisma"
import { libreEn, ocupacionPorUnidad } from "@/lib/reservas"

export const categorias = {
  parrilla: ["PARRILLA", "QUINCHO"],
  gazebo: ["GAZEBO"],
  palapa: ["PALAPA"],
  playa: ["GAZEBO", "PALAPA"],
  bungalow: ["BUNGALOW"],
  restaurante: ["MESA_RESTAURANTE"],
  bar: ["MESA_BAR"],
  visita: ["PARRILLA", "GAZEBO", "PALAPA", "BUNGALOW"],
} as const satisfies Record<string, readonly TipoUnidad[]>

export type Categoria = keyof typeof categorias

export type EstadoDeFecha = ({ estado: "libre" | "completo" | "pasado" } | { estado: "cerrado"; motivo: string }) & { dia?: TipoDeDia }

const JUEVES = 4
const SABADO = 6

/// Los bungalows se alquilan por 2 días y 1 noche, entrando jueves o sábado.
export function entradaDeBungalow(fecha: string) {
  const dia = diaDeLaSemana(fecha)
  return dia === JUEVES || dia === SABADO
}

/// Las unidades de la categoría que se pueden reservar por la web. De las palapas, solo
/// las primeras del cupo que fija el panel.
export async function unidadesDeLaWeb(categoria: Categoria) {
  const unidades = unidadesDelTipo(...categorias[categoria])
  if (!(categorias[categoria] as readonly TipoUnidad[]).includes("PALAPA")) return unidades
  const { palapasWeb } = await leerAjustes()
  return unidades.filter((unidad) => unidad.tipo !== "PALAPA" || unidad.numero <= palapasWeb)
}

export async function diasEspeciales(desde: string, hasta: string) {
  const filas = await db().diaEspecial.findMany({ where: { fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) } } })
  return mapaDeEspeciales(filas.map((fila) => ({ fecha: deFechaDb(fila.fecha), tipo: fila.tipo as TipoDia, motivo: fila.motivo })))
}

/// Con `horas` (mesas del restaurante) cuenta solo lo libre en esas horas. Cada día abierto
/// trae qué tarifa le corresponde (fin de semana o semana). En bungalows, solo se puede
/// entrar jueves o sábado, con el día siguiente también abierto.
export async function disponibilidadDelMes(mes: string, categoria: Categoria, personas = 1, horas?: number[], sinReserva?: number) {
  const inicio = `${mes}-01`
  const [anio, numero] = mes.split("-").map(Number)
  const fin = new Date(Date.UTC(anio, numero, 0)).toISOString().slice(0, 10)
  const hoy = hoyEnElPredio()
  const delTipo = await unidadesDeLaWeb(categoria)

  const [especiales, ocupacion] = await Promise.all([
    diasEspeciales(inicio, sumarDiasIso(fin, 1)),
    ocupacionPorUnidad(sumarDiasIso(inicio, -8), sumarDiasIso(fin, 8), sinReserva),
  ])

  const dias: Record<string, EstadoDeFecha> = {}
  for (const fecha of fechasEntre(inicio, fin)) {
    const apertura = estadoDelDia(fecha, especiales)
    const dia = tipoDeDia(fecha, especiales)
    if (fecha < hoy) dias[fecha] = { estado: "pasado" }
    else if (!apertura.abierto) dias[fecha] = { estado: "cerrado", motivo: apertura.motivo }
    else if (categoria === "bungalow") {
      const salida = sumarDiasIso(fecha, 1)
      const siguiente = estadoDelDia(salida, especiales)
      if (!entradaDeBungalow(fecha)) dias[fecha] = { estado: "cerrado", motivo: "Los bungalows se reservan entrando jueves o sábado." }
      else if (!siguiente.abierto) dias[fecha] = { estado: "cerrado", motivo: `El día siguiente el predio está cerrado. ${siguiente.motivo}` }
      else {
        const libre = libreEn(ocupacion, fecha, salida)
        dias[fecha] = { estado: hayLugarPara("bungalow", personas, delTipo.filter((unidad) => libre(unidad.id))) ? "libre" : "completo", dia }
      }
    } else if (categoria === "visita") dias[fecha] = { estado: "libre", dia }
    else {
      const libre = libreEn(ocupacion, fecha, fecha, horas)
      const libres = delTipo.filter((unidad) => libre(unidad.id))
      dias[fecha] = { estado: hayLugarPara(categoria, personas, libres) ? "libre" : "completo", dia }
    }
  }

  return { hoy, dias }
}

export type LugarDisponible = Pick<UnidadPredio, "id" | "tipo" | "numero" | "etiqueta" | "capacidad" | "mesas"> & {
  estado: "libre" | "ocupado" | "deja-huecos"
}

/// Estado de cada lugar de la categoría para un día (o una estadía, en bungalows).
/// No expone de quién es la reserva.
export async function lugaresDisponibles(categoria: Categoria, desde: string, hasta: string, horas?: number[], sinReserva?: number): Promise<LugarDisponible[]> {
  const [ocupacion, unidades] = await Promise.all([ocupacionPorUnidad(desde, hasta, sinReserva), unidadesDeLaWeb(categoria)])
  const libre = libreEn(ocupacion, desde, hasta, horas)
  return unidades.map(({ id, tipo, numero, etiqueta, capacidad, mesas }) => ({ id, tipo, numero, etiqueta, capacidad, mesas, estado: libre(id) ? "libre" : "ocupado" }))
}

/// Feriados y no laborables del próximo año: cobran la tarifa de fin de semana. Para que
/// el panel calcule el precio igual que el servidor.
export async function feriadosDelAnio(hoy: string) {
  const especiales = await diasEspeciales(hoy, sumarDiasIso(hoy, 366))
  return [...especiales.values()].filter((dia) => dia.tipo === "FERIADO" || dia.tipo === "NO_LABORABLE").map((dia) => dia.fecha)
}

/// El id de la reserva que se está modificando, a partir de su token (que solo tiene el
/// cliente): sus lugares cuentan como libres para ella misma.
export async function reservaDelToken(token: string | null) {
  if (!token || !/^[a-z0-9]{20,40}$/i.test(token)) return undefined
  const reserva = await db().reserva.findUnique({ where: { token }, select: { id: true } })
  return reserva?.id
}
