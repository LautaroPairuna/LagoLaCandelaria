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

/// Gazebos y palapas: hasta 4 personas cada uno. De 5 a 8 personas van 2, y así.
export const CAPACIDAD_DE_PLAYA = 4

// Gazebos de la A a la Z, con la LL y la Ñ: 28. La letra la asigna el predio, el
// cliente no la elige.
export const LETRAS_DE_GAZEBOS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "LL", "M", "N", "Ñ", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"] as const

// 54 palapas en el predio y 30 más cargadas para cuando se sumen. Por la web se ofrece
// solo un cupo (las primeras, 10 salvo que el panel diga otra cosa): el resto se usa por
// orden de llegada.
export const PALAPAS_EN_EL_PREDIO = 54
export const PALAPAS_CARGADAS = PALAPAS_EN_EL_PREDIO + 30
export const PALAPAS_WEB_POR_DEFECTO = 10

const quinchos = rango(1, 3).map((numero) => unidad("QUINCHO", numero, null))
const gazebos = LETRAS_DE_GAZEBOS.map((letra, indice) => unidad("GAZEBO", indice + 1, CAPACIDAD_DE_PLAYA, 0, letra))
const palapas = rango(1, PALAPAS_CARGADAS).map((numero) => unidad("PALAPA", numero, CAPACIDAD_DE_PLAYA))

const parrillas = gruposDeParrillas
  .flatMap((grupo) => grupo.numeros.map((numero) => unidad("PARRILLA", numero, grupo.capacidad, grupo.mesas)))
  .sort((a, b) => a.numero - b.numero)

const bungalows = rango(1, 4).map((numero) => unidad("BUNGALOW", numero, 4))

// Las mesas del restaurante según la planilla del predio (PASO 1, hoja Restaurante).
export const gruposDeMesas = [
  { capacidad: 2, numeros: [1, 5, 7] },
  { capacidad: 4, numeros: [2, 6, 8] },
  { capacidad: 6, numeros: [3, 4, 9] },
] as const

const mesasRestaurante = gruposDeMesas
  .flatMap((grupo) => grupo.numeros.map((numero) => unidad("MESA_RESTAURANTE", numero, grupo.capacidad, 1)))
  .sort((a, b) => a.numero - b.numero)

export const MAX_PERSONAS_RESTAURANTE = mesasRestaurante.reduce((suma, mesa) => suma + (mesa.capacidad ?? 0), 0)

// El bar es otro local: sus mesas no se comparten con las del restaurante.
export const gruposDeMesasBar = [
  { capacidad: 4, numeros: [1, 2, 3, 4] },
  { capacidad: 6, numeros: [5, 6] },
] as const

const mesasBar = gruposDeMesasBar
  .flatMap((grupo) => grupo.numeros.map((numero) => unidad("MESA_BAR", numero, grupo.capacidad, 1)))
  .sort((a, b) => a.numero - b.numero)

export const MAX_PERSONAS_BAR = mesasBar.reduce((suma, mesa) => suma + (mesa.capacidad ?? 0), 0)

export const inventario: UnidadPredio[] = [
  ...parrillas,
  ...quinchos,
  ...gazebos,
  ...palapas,
  ...bungalows,
  ...mesasRestaurante,
  ...mesasBar,
]

export function unidadesDelTipo(...tipos: TipoUnidad[]) {
  return inventario.filter((item) => tipos.includes(item.tipo))
}

// Personas que pueden estar en el predio en un mismo día. Hasta que el predio confirme
// el número real, es lo que entra en parrillas, playa y bungalows (solo las palapas que
// ya existen).
export const AFORO_DEL_PREDIO = unidadesDelTipo("PARRILLA", "GAZEBO", "PALAPA", "BUNGALOW")
  .filter((unidad) => unidad.tipo !== "PALAPA" || unidad.numero <= PALAPAS_EN_EL_PREDIO)
  .reduce(
  (suma, unidad) => suma + (unidad.capacidad ?? 0),
  0,
)
