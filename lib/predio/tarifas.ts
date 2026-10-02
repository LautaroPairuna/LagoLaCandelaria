export const tarifas = {
  adulto: 40_000,
  menor: 25_000,
  bungalowPorNoche: { 2: 300_000, 3: 370_000, 4: 440_000 } as Readonly<Record<number, number>>,
  descuentoEfectivo: 0.1,
  acompananteSobreParticipante: 0.7,
} as const

export const EDAD_MINIMA_CON_CARGO = 5
export const EDAD_MAXIMA_MENOR = 12

export type BandaDeEdad = "adulto" | "menor" | "sin-cargo"

export function bandaDeEdad(edad: number, cud = false): BandaDeEdad {
  if (cud || edad < EDAD_MINIMA_CON_CARGO) return "sin-cargo"
  if (edad <= EDAD_MAXIMA_MENOR) return "menor"
  return "adulto"
}

export function entradas(adultos: number, menores: number) {
  return adultos * tarifas.adulto + menores * tarifas.menor
}

export function precioBungalowPorNoche(personas: number) {
  const ocupacion = Math.min(Math.max(personas, 2), 4)
  return tarifas.bungalowPorNoche[ocupacion]
}

export function repartirEnBungalows(personas: number, bungalows: number) {
  if (bungalows < 1) return []
  const base = Math.floor(personas / bungalows)
  const resto = personas % bungalows
  return Array.from({ length: bungalows }, (_, indice) => base + (indice < resto ? 1 : 0))
}

export function conDescuentoEfectivo(total: number) {
  return Math.round(total * (1 - tarifas.descuentoEfectivo))
}

export type LineaPresupuesto = {
  concepto: string
  cantidad: number
  bonificados: number
  valorUnitario: number
  importe: number
}

export function presupuestoGrupo({
  participantes,
  acompanantes,
  valorParticipante,
  bonificadosParticipantes = 0,
  bonificadosAcompanantes = 0,
}: {
  participantes: number
  acompanantes: number
  valorParticipante: number
  bonificadosParticipantes?: number
  bonificadosAcompanantes?: number
}) {
  const valorAcompanante = Math.round(valorParticipante * tarifas.acompananteSobreParticipante)
  const linea = (concepto: string, cantidad: number, bonificados: number, valorUnitario: number): LineaPresupuesto => {
    const pagan = Math.max(cantidad - bonificados, 0)
    return { concepto, cantidad, bonificados, valorUnitario, importe: pagan * valorUnitario }
  }
  const lineas = [
    linea("Participantes", participantes, bonificadosParticipantes, valorParticipante),
    linea("Acompañantes", acompanantes, bonificadosAcompanantes, valorAcompanante),
  ]
  const total = lineas.reduce((suma, item) => suma + item.importe, 0)
  return { lineas, total, totalEfectivo: conDescuentoEfectivo(total) }
}

export function pesos(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor)
}
