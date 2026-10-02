export type TipoLugar = "parrilla" | "gazebo" | "quincho" | "palapa" | "bungalow"
export type ZonaMesa = "restaurante" | "bar"

export type Unidad = {
  id: string
  tipo: TipoLugar
  nombre: string
  capacidad: number
  detalle: string
}

export type Mesa = {
  id: string
  zona: ZonaMesa
  nombre: string
  capacidad: number
}

export type TipoLugarInfo = {
  id: TipoLugar
  nombre: string
  singular: string
  plural: string
  explica: string
  genero: "f" | "m"
  capacidad: number
  por: "día" | "noche"
  soloHospedaje: boolean
}

export const tiposLugar: TipoLugarInfo[] = [
  {
    id: "parrilla",
    nombre: "Parrillas",
    singular: "parrilla",
    plural: "parrillas",
    explica: "Puesto de fuego del día. Cada parrilla alcanza para 6 personas.",
    genero: "f",
    capacidad: 6,
    por: "día",
    soloHospedaje: false,
  },
  {
    id: "gazebo",
    nombre: "Gazebos",
    singular: "gazebo",
    plural: "gazebos",
    explica: "Techo en el campo, con sombra y mesa. Cada gazebo es para 8 personas.",
    genero: "m",
    capacidad: 8,
    por: "día",
    soloHospedaje: false,
  },
  {
    id: "quincho",
    nombre: "Quincho",
    singular: "quincho",
    plural: "quinchos",
    explica: "Techo con cocina para el grupo. El quincho es para 20 personas.",
    genero: "m",
    capacidad: 20,
    por: "día",
    soloHospedaje: false,
  },
  {
    id: "palapa",
    nombre: "Palapas",
    singular: "palapa",
    plural: "palapas",
    explica: "La sombrilla de la playa artificial. Cada palapa es para 6 personas.",
    genero: "f",
    capacidad: 6,
    por: "día",
    soloHospedaje: false,
  },
  {
    id: "bungalow",
    nombre: "Bungalows",
    singular: "bungalow",
    plural: "bungalows",
    explica: "Casa para 4 personas, con baño privado, parrilla propia y vista al lago. Se reserva por noche.",
    genero: "m",
    capacidad: 4,
    por: "noche",
    soloHospedaje: true,
  },
]

function serie(tipo: TipoLugar, cantidad: number, capacidad: number, detalle: string): Unidad[] {
  return Array.from({ length: cantidad }, (_, index) => ({
    id: `${tipo}-${index + 1}`,
    tipo,
    nombre: `${tiposLugar.find((item) => item.id === tipo)?.singular ?? tipo} ${index + 1}`,
    capacidad,
    detalle,
  }))
}

export const unidades: Unidad[] = [
  ...serie("parrilla", 8, 6, "Fuego para el grupo que pasa el día."),
  ...serie("gazebo", 6, 8, "Sombra y mesa en el campo."),
  ...serie("quincho", 1, 20, "Cocina y techo, compartido por turno."),
  ...serie("palapa", 10, 6, "Sombrilla en la playa artificial."),
  ...serie("bungalow", 4, 4, "Casa con parrilla propia. Incluye desayuno."),
]

export const mesas: Mesa[] = [
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `restaurante-${index + 1}`,
    zona: "restaurante" as const,
    nombre: `Mesa ${index + 1}`,
    capacidad: index < 4 ? 4 : 6,
  })),
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `bar-${index + 1}`,
    zona: "bar" as const,
    nombre: `Mesa ${index + 1}`,
    capacidad: 4,
  })),
]

const unidadPorId = new Map(unidades.map((unidad) => [unidad.id, unidad]))
const mesaPorId = new Map(mesas.map((mesa) => [mesa.id, mesa]))

export function unidadDe(id: string) {
  return unidadPorId.get(id)
}

export function mesaDe(id: string) {
  return mesaPorId.get(id)
}

export function unidadesDe(tipo: TipoLugar) {
  return unidades.filter((unidad) => unidad.tipo === tipo)
}

export function mesasDe(zona: ZonaMesa) {
  return mesas.filter((mesa) => mesa.zona === zona)
}

export function infoLugar(tipo: TipoLugar) {
  const info = tiposLugar.find((item) => item.id === tipo)
  if (!info) throw new Error(`Lugar desconocido: ${tipo}`)
  return info
}

export const horas = Array.from({ length: 27 }, (_, index) => {
  const total = 8 * 60 + index * 30
  const horasReloj = Math.floor(total / 60)
  const minutos = total % 60
  return `${String(horasReloj).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`
})
