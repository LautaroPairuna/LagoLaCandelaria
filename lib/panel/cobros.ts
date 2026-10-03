import { conDescuentoEfectivo } from "@/lib/predio/tarifas"

export type FormaDeCobro = "EFECTIVO" | "DEBITO" | "TRANSFERENCIA"

export function saldoDe(total: number, pagos: { importe: number; descuento: number }[]) {
  const cubierto = pagos.reduce((suma, pago) => suma + pago.importe + pago.descuento, 0)
  return Math.max(total - cubierto, 0)
}

// Cobrar el saldo completo en efectivo lleva el 10 % de descuento. Un importe parcial
// se cobra tal cual: el descuento solo aplica cuando se cancela todo de una vez.
export function cobroDelSaldo(saldo: number, forma: FormaDeCobro) {
  if (forma !== "EFECTIVO") return { importe: saldo, descuento: 0 }
  const importe = conDescuentoEfectivo(saldo)
  return { importe, descuento: saldo - importe }
}

export function totalesPorForma(pagos: { forma: FormaDeCobro; importe: number }[]) {
  const totales: Record<FormaDeCobro, number> = { EFECTIVO: 0, DEBITO: 0, TRANSFERENCIA: 0 }
  for (const pago of pagos) totales[pago.forma] += pago.importe
  return totales
}
