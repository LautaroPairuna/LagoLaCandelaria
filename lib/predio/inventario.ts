export type TipoUnidad =
  | "PARRILLA"
  | "QUINCHO"
  | "GAZEBO"
  | "PALAPA"
  | "BUNGALOW"
  | "MESA_RESTAURANTE"
  | "MESA_BAR"

export type UnidadPredio = {
  id: string
  tipo: TipoUnidad
  numero: number
  etiqueta: string
  capacidad: number | null
  mesas: number
}

function rango(desde: number, hasta: number) {
  return Array.from({ length: hasta - desde + 1 }, (_, indice) => desde + indice)
}

const prefijo: Record<TipoUnidad, string> = {
  PARRILLA: "parrilla",
  QUINCHO: "quincho",
  GAZEBO: "gazebo",
  PALAPA: "palapa",
  BUNGALOW: "bungalow",
  MESA_RESTAURANTE: "restaurante",
  MESA_BAR: "bar",
}

export function idDeUnidad(tipo: TipoUnidad, numero: number) {
  return `${prefijo[tipo]}-${numero}`
}

function unidad(tipo: TipoUnidad, numero: number, capacidad: number | null, mesas = 0, etiqueta = String(numero)): UnidadPredio {
  return { id: idDeUnidad(tipo, numero), tipo, numero, etiqueta, capacidad, mesas }
}

// La especificación lista la parrilla 33 en los dos grupos ("27 a 33" con 1 mesa y
// "33 a 36" con 2). Queda en el de 1 mesa hasta que el predio lo confirme.
export const gruposDeParrillas = [
  { mesas: 1, capacidad: 6, numeros: [...rango(4, 6), ...rango(27, 33), ...rango(40, 43)] },
  { mesas: 2, capacidad: 12, numeros: [...rango(1, 3), ...rango(7, 26), ...rango(34, 36)] },
  { mesas: 3, capacidad: 18, numeros: rango(44, 49) },
] as const

export const MAX_PERSONAS_PARRILLA = 18
export const MAX_LUGARES_PLAYA = 60

const parrillas = gruposDeParrillas
  .flatMap((grupo) => grupo.numeros.map((numero) => unidad("PARRILLA", numero, grupo.capacidad, grupo.mesas)))
  .sort((a, b) => a.numero - b.numero)

const quinchos = rango(1, 3).map((numero) => unidad("QUINCHO", numero, null))

// La playa tiene 60 lugares entre gazebos y palapas. El reparto exacto está pendiente:
// por ahora 6 gazebos (los que figuran en el sitio) y el resto palapas.
const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const gazebos = rango(1, 6).map((numero) => unidad("GAZEBO", numero, 8, 0, letras[numero - 1]))
const palapas = rango(1, MAX_LUGARES_PLAYA - gazebos.length).map((numero) => unidad("PALAPA", numero, 6))

const bungalows = rango(1, 4).map((numero) => unidad("BUNGALOW", numero, 4))

// Las mesas del restaurante según la planilla del predio (PASO 1, hoja Restaurante).
// El bar no tiene mesas reservables: la planilla no las lista.
export const gruposDeMesas = [
  { capacidad: 2, numeros: [1, 5, 7] },
  { capacidad: 4, numeros: [2, 6, 8] },
  { capacidad: 6, numeros: [3, 4, 9] },
] as const

const mesasRestaurante = gruposDeMesas
  .flatMap((grupo) => grupo.numeros.map((numero) => unidad("MESA_RESTAURANTE", numero, grupo.capacidad, 1)))
  .sort((a, b) => a.numero - b.numero)

export const MAX_PERSONAS_RESTAURANTE = mesasRestaurante.reduce((suma, mesa) => suma + (mesa.capacidad ?? 0), 0)

export const inventario: UnidadPredio[] = [
  ...parrillas,
  ...quinchos,
  ...gazebos,
  ...palapas,
  ...bungalows,
  ...mesasRestaurante,
]

export function unidadesDelTipo(...tipos: TipoUnidad[]) {
  return inventario.filter((item) => tipos.includes(item.tipo))
}

// Personas que pueden estar en el predio en un mismo día. Hasta que el predio confirme
// el número real, es lo que entra en parrillas, playa y bungalows.
export const AFORO_DEL_PREDIO = unidadesDelTipo("PARRILLA", "GAZEBO", "PALAPA", "BUNGALOW").reduce(
  (suma, unidad) => suma + (unidad.capacidad ?? 0),
  0,
)
