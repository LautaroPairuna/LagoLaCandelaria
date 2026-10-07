import { describe, expect, it } from "vitest"

import { cajonDe, cobroPropuesto, deudaDe, renglonesDeMovimiento, totalesPorCajon } from "@/lib/panel/libro-caja"

const movimiento = { id: 1, fecha: "2026-10-07", concepto: "Depósito", monto: 50_000, registradoPor: "Ana", creadoEn: new Date() }

describe("cajones", () => {
  it("el efectivo va al mostrador y el resto al banco", () => {
    expect(cajonDe("EFECTIVO")).toBe("EFECTIVO")
    expect(cajonDe("TRANSFERENCIA")).toBe("BANCO")
    expect(cajonDe("DEBITO")).toBe("BANCO")
  })

  it("una transferencia sale de un cajón y entra al otro", () => {
    const renglones = renglonesDeMovimiento({ ...movimiento, tipo: "TRANSFERENCIA", cajon: "EFECTIVO" })
    expect(renglones.map((renglon) => [renglon.cajon, renglon.sentido])).toEqual([
      ["EFECTIVO", "egreso"],
      ["BANCO", "ingreso"],
    ])
    expect(totalesPorCajon(renglones)).toEqual({ EFECTIVO: { ingreso: 0, egreso: 50_000 }, BANCO: { ingreso: 50_000, egreso: 0 } })
  })

  it("ingresos y egresos manuales quedan en su cajón", () => {
    const renglones = [
      ...renglonesDeMovimiento({ ...movimiento, tipo: "EGRESO", cajon: "EFECTIVO", monto: 8_000 }),
      ...renglonesDeMovimiento({ ...movimiento, id: 2, tipo: "INGRESO", cajon: "BANCO", monto: 3_000 }),
    ]
    expect(totalesPorCajon(renglones)).toEqual({ EFECTIVO: { ingreso: 0, egreso: 8_000 }, BANCO: { ingreso: 3_000, egreso: 0 } })
  })
})

describe("regla del descuento", () => {
  it("sin pagos: en efectivo con 10 % menos, por banco a precio de lista", () => {
    expect(deudaDe(100_000, [])).toEqual({ saldo: 100_000, efectivo: 90_000, pierdeDescuento: false })
    expect(cobroPropuesto(100_000, [], "EFECTIVO")).toEqual({ importe: 90_000, descuento: 10_000 })
    expect(cobroPropuesto(100_000, [], "TRANSFERENCIA")).toEqual({ importe: 100_000, descuento: 0 })
  })

  it("una seña en efectivo mantiene el descuento sobre el total", () => {
    const pagos = [{ importe: 40_000, descuento: 0, forma: "EFECTIVO" as const }]
    expect(deudaDe(100_000, pagos)).toEqual({ saldo: 60_000, efectivo: 50_000, pierdeDescuento: false })
    expect(cobroPropuesto(100_000, pagos, "EFECTIVO")).toEqual({ importe: 50_000, descuento: 10_000 })
  })

  it("si una parte entró por banco, se pierde el descuento", () => {
    const pagos = [{ importe: 30_000, descuento: 0, forma: "TRANSFERENCIA" as const }]
    expect(deudaDe(100_000, pagos)).toEqual({ saldo: 70_000, efectivo: 70_000, pierdeDescuento: true })
    expect(cobroPropuesto(100_000, pagos, "EFECTIVO")).toEqual({ importe: 70_000, descuento: 0 })
  })

  it("pagada en efectivo con descuento, no debe nada", () => {
    const pagos = [{ importe: 90_000, descuento: 10_000, forma: "EFECTIVO" as const }]
    expect(deudaDe(100_000, pagos)).toEqual({ saldo: 0, efectivo: 0, pierdeDescuento: false })
  })
})
