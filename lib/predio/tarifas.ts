/// Fin de semana o feriado, o día de semana (en verano el predio abre de miércoles a viernes).
export type TipoDeDia = "finde" | "semana"

/// Los precios son los de pagar en efectivo. Por transferencia se suma el recargo: 40.000
/// en efectivo quedan en 44.000. El "precio de lista" que se guarda en la reserva es el
/// de transferencia; el de efectivo sale de sacarle el recargo.
export const tarifas = {
  entrada: {
    finde: { adulto: 40_000, menor: 25_000 },
    semana: { adulto: 30_000, menor: 20_000 },
  },
  /// Nado en aguas abiertas, por nadador. Es un precio único: ya incluye el recargo.
  nado: { finde: 25_000, semana: 20_000 },
  /// Bungalow por estadía (2 días y 1 noche), con la entrada incluida. Se paga por
  /// adelantado, por transferencia.
  bungalow: 370_000,
  recargoTransferencia: 0.1,
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

/// Lo que se paga en efectivo por las entradas.
export function entradas(adultos: number, menores: number, dia: TipoDeDia = "finde") {
  const precio = tarifas.entrada[dia]
  return adultos * precio.adulto + menores * precio.menor
}

export function conRecargoTransferencia(efectivo: number) {
  return Math.round(efectivo * (1 + tarifas.recargoTransferencia))
}

/// El precio en efectivo de un total de lista (el de transferencia): 44.000 → 40.000.
export function conDescuentoEfectivo(total: number) {
  return Math.round(total / (1 + tarifas.recargoTransferencia))
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
