import type { Cajon, FormaPago, TipoMovimiento } from "@/generated/prisma/enums"
import { saldoDe } from "@/lib/panel/cobros"
import { conDescuentoEfectivo } from "@/lib/predio/tarifas"

export type { Cajon }

export const cajones: { id: Cajon; nombre: string; detalle: string }[] = [
  { id: "EFECTIVO", nombre: "Caja · Efectivo", detalle: "Lo que está en el mostrador" },
  { id: "BANCO", nombre: "Banco · Transferencia", detalle: "Transferencias, tarjeta y otros medios" },
]

export const nombreDelCajon: Record<Cajon, string> = { EFECTIVO: "Efectivo", BANCO: "Banco" }

/// El efectivo va al cajón del mostrador; todo lo demás (transferencia, débito) al banco.
export function cajonDe(forma: FormaPago): Cajon {
  return forma === "EFECTIVO" ? "EFECTIVO" : "BANCO"
}

const otro = (cajon: Cajon): Cajon => (cajon === "EFECTIVO" ? "BANCO" : "EFECTIVO")

/// Un renglón de la caja. Los cobros vienen de las reservas y no se borran desde acá;
/// los movimientos manuales sí.
export type Renglon = {
  clave: string
  fecha: string
  hora: Date
  cajon: Cajon
  sentido: "ingreso" | "egreso"
  monto: number
  concepto: string
  registradoPor: string | null
} & ({ origen: "cobro"; reservaId: number; codigo: string; forma: FormaPago; descuento: number } | { origen: "movimiento"; movimientoId: number; tipo: TipoMovimiento })

export type MovimientoLeido = {
  id: number
  tipo: TipoMovimiento
  cajon: Cajon
  fecha: string
  concepto: string
  monto: number
  registradoPor: string | null
  creadoEn: Date
}

/// Un movimiento manual en renglones: una transferencia entre cajones son dos, la
/// salida de un cajón y la entrada al otro.
export function renglonesDeMovimiento(movimiento: MovimientoLeido): Renglon[] {
  const base = {
    origen: "movimiento" as const,
    movimientoId: movimiento.id,
    tipo: movimiento.tipo,
    fecha: movimiento.fecha,
    hora: movimiento.creadoEn,
    monto: movimiento.monto,
    concepto: movimiento.concepto,
    registradoPor: movimiento.registradoPor,
  }
  if (movimiento.tipo === "TRANSFERENCIA") {
    return [
      { ...base, clave: `m${movimiento.id}-sale`, cajon: movimiento.cajon, sentido: "egreso" },
      { ...base, clave: `m${movimiento.id}-entra`, cajon: otro(movimiento.cajon), sentido: "ingreso" },
    ]
  }
  return [{ ...base, clave: `m${movimiento.id}`, cajon: movimiento.cajon, sentido: movimiento.tipo === "INGRESO" ? "ingreso" : "egreso" }]
}

export type TotalesDelCajon = { ingreso: number; egreso: number }

export function totalesPorCajon(renglones: Pick<Renglon, "cajon" | "sentido" | "monto">[]): Record<Cajon, TotalesDelCajon> {
  const totales: Record<Cajon, TotalesDelCajon> = { EFECTIVO: { ingreso: 0, egreso: 0 }, BANCO: { ingreso: 0, egreso: 0 } }
  for (const renglon of renglones) totales[renglon.cajon][renglon.sentido] += renglon.monto
  return totales
}

type PagoParaDeuda = { importe: number; descuento: number; forma: FormaPago }

/// Lo que falta cobrar de una reserva. Regla del descuento: si todo se paga en efectivo
/// se cobra el precio con descuento; si alguna parte entró por banco, se pierde el
/// descuento y se cobra el precio de lista.
export function deudaDe(total: number, pagos: PagoParaDeuda[]) {
  const saldo = saldoDe(total, pagos)
  const conBanco = pagos.some((pago) => cajonDe(pago.forma) === "BANCO")
  const pagado = pagos.reduce((suma, pago) => suma + pago.importe, 0)
  const efectivo = conBanco ? saldo : Math.min(Math.max(conDescuentoEfectivo(total) - pagado, 0), saldo)
  return { saldo, efectivo, pierdeDescuento: conBanco }
}

/// Lo que se propone cobrar del saldo con una forma de pago. El descuento se guarda
/// aparte para que el saldo quede en cero.
export function cobroPropuesto(total: number, pagos: PagoParaDeuda[], forma: FormaPago) {
  const deuda = deudaDe(total, pagos)
  if (forma !== "EFECTIVO") return { importe: deuda.saldo, descuento: 0 }
  return { importe: deuda.efectivo, descuento: deuda.saldo - deuda.efectivo }
}
