import type { Modulo, TipoUnidad } from "@/generated/prisma/enums"
import type { EstadoVisible } from "@/lib/panel/estados"

/// Los filtros y el orden de las reservas del día en Puerta. Viajan en la dirección
/// (?estado=…&lugar=…&tipo=…&orden=…) para que se puedan compartir y sobrevivan a recargar.

const opciones = <T extends string>(lista: readonly { id: T; nombre: string }[]) => lista

export const filtrosDeEstado = opciones([
  { id: "todas", nombre: "Todas" },
  { id: "por-llegar", nombre: "Por llegar" },
  { id: "a-confirmar", nombre: "A confirmar" },
  { id: "confirmada", nombre: "Confirmadas" },
  { id: "adentro", nombre: "Adentro" },
  { id: "se-fueron", nombre: "Ya se fueron" },
  { id: "no-vino", nombre: "No vinieron" },
] as const)

export const filtrosDeLugar = opciones([
  { id: "todos", nombre: "Todos" },
  { id: "parrilla", nombre: "Parrilla" },
  { id: "gazebo", nombre: "Gazebo" },
  { id: "palapa", nombre: "Palapa" },
  { id: "bungalow", nombre: "Bungalow" },
  { id: "sin-lugar", nombre: "Sin lugar" },
] as const)

export const filtrosDeTipo = opciones([
  { id: "todas", nombre: "Todas" },
  { id: "finde", nombre: "Finde en familia" },
  { id: "bungalow", nombre: "Bungalows" },
  { id: "grupos", nombre: "Grupos" },
  { id: "deportes", nombre: "Deportes" },
  { id: "restaurante", nombre: "Restaurante" },
] as const)

export const ordenes = opciones([
  { id: "llegada", nombre: "Horario de llegada" },
  { id: "az", nombre: "A-Z" },
  { id: "za", nombre: "Z-A" },
  { id: "parrilla-asc", nombre: "N.º de parrilla ↑" },
  { id: "parrilla-desc", nombre: "N.º de parrilla ↓" },
  { id: "palapa-asc", nombre: "N.º de palapa ↑" },
  { id: "palapa-desc", nombre: "N.º de palapa ↓" },
  { id: "gazebo-asc", nombre: "N.º de gazebo ↑" },
  { id: "gazebo-desc", nombre: "N.º de gazebo ↓" },
] as const)

type Id<T extends readonly { id: string }[]> = T[number]["id"]
export type FiltrosDePuerta = { estado: Id<typeof filtrosDeEstado>; lugar: Id<typeof filtrosDeLugar>; tipo: Id<typeof filtrosDeTipo>; orden: Id<typeof ordenes> }

export const sinFiltros: FiltrosDePuerta = { estado: "todas", lugar: "todos", tipo: "todas", orden: "llegada" }

function elegir<T extends readonly { id: string }[]>(lista: T, valor: unknown, porDefecto: Id<T>): Id<T> {
  return lista.some((opcion) => opcion.id === valor) ? (valor as Id<T>) : porDefecto
}

export function leerFiltros(params: Record<string, string | string[] | undefined>): FiltrosDePuerta {
  const valor = (clave: string) => (Array.isArray(params[clave]) ? params[clave]?.[0] : params[clave])
  return {
    estado: elegir(filtrosDeEstado, valor("estado"), "todas"),
    lugar: elegir(filtrosDeLugar, valor("lugar"), "todos"),
    tipo: elegir(filtrosDeTipo, valor("tipo"), "todas"),
    orden: elegir(ordenes, valor("orden"), "llegada"),
  }
}

export const estadosDe: Record<Exclude<FiltrosDePuerta["estado"], "todas">, EstadoVisible[]> = {
  "por-llegar": ["a-confirmar", "confirmada"],
  "a-confirmar": ["a-confirmar"],
  confirmada: ["confirmada"],
  adentro: ["parcial", "ingresada"],
  "se-fueron": ["finalizada"],
  "no-vino": ["no-vino"],
}

const tiposDeLugar: Record<Exclude<FiltrosDePuerta["lugar"], "todos" | "sin-lugar">, TipoUnidad[]> = {
  parrilla: ["PARRILLA", "QUINCHO"],
  gazebo: ["GAZEBO"],
  palapa: ["PALAPA"],
  bungalow: ["BUNGALOW"],
}

export const modulosDe: Record<Exclude<FiltrosDePuerta["tipo"], "todas">, Modulo[]> = {
  finde: ["FINDE_FAMILIA"],
  bungalow: ["BUNGALOW"],
  grupos: ["CAMPAMENTO", "SALIDA_EDUCATIVA", "VIAJE_EGRESADOS"],
  deportes: ["ACTIVIDAD_AVENTURA", "NADO"],
  restaurante: ["RESTAURANTE"],
}

type ParaFiltrar = { visible: EstadoVisible; modulo: Modulo; titular: string; unidades: { tipo: TipoUnidad; numero: number }[] }

/// El menor número de ese tipo de lugar que tiene la reserva (las que no tienen van al final).
function numeroDe(reserva: ParaFiltrar, tipos: TipoUnidad[]) {
  const numeros = reserva.unidades.filter((unidad) => tipos.includes(unidad.tipo)).map((unidad) => unidad.numero)
  return numeros.length ? Math.min(...numeros) : null
}

const alfabetico = new Intl.Collator("es-AR", { sensitivity: "base" })

export function filtrarYOrdenar<T extends ParaFiltrar>(reservas: T[], filtros: FiltrosDePuerta): T[] {
  const filtradas = reservas.filter(
    (reserva) =>
      (filtros.estado === "todas" || estadosDe[filtros.estado].includes(reserva.visible)) &&
      (filtros.tipo === "todas" || modulosDe[filtros.tipo].includes(reserva.modulo)) &&
      (filtros.lugar === "todos" ||
        (filtros.lugar === "sin-lugar" ? reserva.unidades.length === 0 : reserva.unidades.some((unidad) => tiposDeLugar[filtros.lugar as keyof typeof tiposDeLugar].includes(unidad.tipo)))),
  )
  if (filtros.orden === "llegada") return filtradas
  if (filtros.orden === "az" || filtros.orden === "za") {
    const signo = filtros.orden === "az" ? 1 : -1
    return [...filtradas].sort((a, b) => signo * alfabetico.compare(a.titular, b.titular))
  }
  const [lugar, sentido] = filtros.orden.split("-") as [keyof typeof tiposDeLugar, "asc" | "desc"]
  const signo = sentido === "asc" ? 1 : -1
  return [...filtradas].sort((a, b) => {
    const [na, nb] = [numeroDe(a, tiposDeLugar[lugar]), numeroDe(b, tiposDeLugar[lugar])]
    if (na === null || nb === null) return na === nb ? 0 : na === null ? 1 : -1
    return signo * (na - nb)
  })
}
