import {
  EDAD_MAXIMA_MENOR,
  EDAD_MINIMA_CON_CARGO,
  conDescuentoEfectivo,
  pesos,
  precioBungalowPorNoche,
  repartirEnBungalows,
  tarifas,
} from "@/lib/predio/tarifas"

export type LineaCotizacion = { concepto: string; detalle: string; importe: number }

export type Cotizacion = {
  total: number
  totalEfectivo?: number
  aConfirmar?: boolean
  /// Reserva de mesa en el restaurante: no se cobra la reserva, se paga lo que consumen.
  consumo?: boolean
  lineas: LineaCotizacion[]
}

export type Grupo = { adultos: number; menores: number; sinCargo: number }

function veces(cantidad: number, uno: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? uno : varios}`
}

function cerrar(lineas: LineaCotizacion[]): Cotizacion {
  const total = lineas.reduce((suma, linea) => suma + linea.importe, 0)
  return { total, totalEfectivo: conDescuentoEfectivo(total), lineas }
}

export function cotizarDia({ adultos, menores, sinCargo }: Grupo): Cotizacion {
  const lineas: LineaCotizacion[] = []
  if (adultos > 0) {
    lineas.push({ concepto: "Adultos", detalle: `${adultos} × más de ${EDAD_MAXIMA_MENOR} años`, importe: adultos * tarifas.adulto })
  }
  if (menores > 0) {
    lineas.push({
      concepto: "Menores",
      detalle: `${menores} × de ${EDAD_MINIMA_CON_CARGO} a ${EDAD_MAXIMA_MENOR} años`,
      importe: menores * tarifas.menor,
    })
  }
  if (sinCargo > 0) {
    lineas.push({ concepto: "Sin cargo", detalle: `${veces(sinCargo, "menor", "menores")} de ${EDAD_MINIMA_CON_CARGO} años`, importe: 0 })
  }
  return cerrar(lineas)
}

export function cotizarBungalows(personas: number, noches: number, bungalows: number): Cotizacion {
  const reparto = repartirEnBungalows(personas, bungalows)
  return cerrar(
    reparto.map((ocupantes, indice) => ({
      concepto: bungalows === 1 ? "Bungalow" : `Bungalow ${indice + 1}`,
      detalle: `${veces(ocupantes, "persona", "personas")} × ${veces(noches, "noche", "noches")} · incluye la entrada`,
      importe: precioBungalowPorNoche(ocupantes) * noches,
    })),
  )
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
  return `Pagando en efectivo: ${pesos(cotizacion.totalEfectivo)} (${tarifas.descuentoEfectivo * 100} % menos).`
}
