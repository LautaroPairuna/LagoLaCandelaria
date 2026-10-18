import { EDAD_MAXIMA_MENOR, EDAD_MINIMA_CON_CARGO, conDescuentoEfectivo, conRecargoTransferencia, pesos, tarifas, type TipoDeDia } from "@/lib/predio/tarifas"

export type LineaCotizacion = { concepto: string; detalle: string; importe: number }

/// `total` es el precio de lista, el de pagar por transferencia; `totalEfectivo`, el de
/// pagar en efectivo. En las lineas va el importe de transferencia.
export type Cotizacion = {
  total: number
  totalEfectivo?: number
  dia?: TipoDeDia
  aConfirmar?: boolean
  /// Reserva de mesa en el restaurante: no se cobra la reserva, se paga lo que consumen.
  consumo?: boolean
  lineas: LineaCotizacion[]
}

export type Grupo = { adultos: number; menores: number; sinCargo: number }

function veces(cantidad: number, uno: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? uno : varios}`
}

export const nombreDelDia: Record<TipoDeDia, string> = { finde: "Fin de semana o feriado", semana: "Día de semana" }

/// La entrada del día: en efectivo, la tarifa; por transferencia, con el recargo.
export function cotizarDia({ adultos, menores, sinCargo }: Grupo, dia: TipoDeDia = "finde"): Cotizacion {
  const precio = tarifas.entrada[dia]
  const lineas: LineaCotizacion[] = []
  if (adultos > 0) {
    lineas.push({ concepto: "Adultos", detalle: `${adultos} × más de ${EDAD_MAXIMA_MENOR} años`, importe: adultos * conRecargoTransferencia(precio.adulto) })
  }
  if (menores > 0) {
    lineas.push({
      concepto: "Menores",
      detalle: `${menores} × de ${EDAD_MINIMA_CON_CARGO} a ${EDAD_MAXIMA_MENOR} años`,
      importe: menores * conRecargoTransferencia(precio.menor),
    })
  }
  if (sinCargo > 0) {
    lineas.push({ concepto: "Sin cargo", detalle: `${veces(sinCargo, "menor", "menores")} de ${EDAD_MINIMA_CON_CARGO} años`, importe: 0 })
  }
  const total = lineas.reduce((suma, linea) => suma + linea.importe, 0)
  return { total, totalEfectivo: adultos * precio.adulto + menores * precio.menor, dia, lineas }
}

/// Nado en aguas abiertas: precio único por nadador, solo el nado.
export function cotizarNado(nadadores: number, dia: TipoDeDia): Cotizacion {
  const total = nadadores * tarifas.nado[dia]
  return {
    total,
    totalEfectivo: total,
    dia,
    lineas: [{ concepto: "Nadadores", detalle: `${veces(nadadores, "nadador", "nadadores")} · solo el nado en aguas abiertas`, importe: total }],
  }
}

/// Bungalows: precio único por estadía de 2 días y 1 noche, con la entrada incluida. Se
/// paga por adelantado por transferencia, sin recargo aparte.
export function cotizarBungalows(bungalows: number): Cotizacion {
  const total = bungalows * tarifas.bungalow
  return {
    total,
    totalEfectivo: total,
    lineas: Array.from({ length: bungalows }, (_, indice) => ({
      concepto: bungalows === 1 ? "Bungalow" : `Bungalow ${indice + 1}`,
      detalle: "2 días y 1 noche · incluye la entrada",
      importe: tarifas.bungalow,
    })),
  }
}

export const cotizacionAConfirmar: Cotizacion = {
  total: 0,
  aConfirmar: true,
  lineas: [
    {
      concepto: "Presupuesto del grupo",
      detalle: "Lo arma el predio según la propuesta, la cantidad de participantes y las bonificaciones.",
      importe: 0,
    },
  ],
}

export const cotizacionDeConsumo: Cotizacion = {
  total: 0,
  consumo: true,
  lineas: [
    {
      concepto: "Mesa en el restaurante",
      detalle: "La reserva no tiene costo: se paga lo que consumen, en el restaurante.",
      importe: 0,
    },
  ],
}

export function textoDelTotal(cotizacion: Cotizacion) {
  if (cotizacion.consumo) return "Consumo aparte"
  return cotizacion.aConfirmar ? "A confirmar" : pesos(cotizacion.total)
}

export function textoDelEfectivo(cotizacion: Cotizacion) {
  if (cotizacion.aConfirmar || !cotizacion.totalEfectivo || cotizacion.totalEfectivo === cotizacion.total) return null
  return `En efectivo: ${pesos(cotizacion.totalEfectivo)}. Por transferencia: ${pesos(cotizacion.total)}.`
}

/// Lo que se paga según la forma elegida: en efectivo, sin el recargo de transferencia.
export function totalSegunForma(cotizacion: Cotizacion, forma: string | null | undefined) {
  return forma === "EFECTIVO" && cotizacion.totalEfectivo !== undefined ? cotizacion.totalEfectivo : cotizacion.total
}

/// Las líneas con el importe de la forma elegida (en las de entrada, sin el recargo).
export function lineasSegunForma(cotizacion: Cotizacion, forma: string | null | undefined) {
  const conRecargo = cotizacion.totalEfectivo !== undefined && cotizacion.totalEfectivo !== cotizacion.total
  if (forma !== "EFECTIVO" || !conRecargo) return cotizacion.lineas
  return cotizacion.lineas.map((linea) => ({ ...linea, importe: conDescuentoEfectivo(linea.importe) }))
}

export const nombreDeFormaWeb: Record<string, string> = { EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia" }
