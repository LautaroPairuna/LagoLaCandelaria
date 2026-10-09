export type FormaDeCobro = "EFECTIVO" | "DEBITO" | "TRANSFERENCIA"

export function saldoDe(total: number, pagos: { importe: number; descuento: number }[]) {
  const cubierto = pagos.reduce((suma, pago) => suma + pago.importe + pago.descuento, 0)
  return Math.max(total - cubierto, 0)
}

export function totalesPorForma(pagos: { forma: FormaDeCobro; importe: number }[]) {
  const totales: Record<FormaDeCobro, number> = { EFECTIVO: 0, DEBITO: 0, TRANSFERENCIA: 0 }
  for (const pago of pagos) totales[pago.forma] += pago.importe
  return totales
}
