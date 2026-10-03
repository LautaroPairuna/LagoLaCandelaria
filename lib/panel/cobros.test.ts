import { describe, expect, it } from "vitest"

import { cobroDelSaldo, saldoDe, totalesPorForma } from "@/lib/panel/cobros"

describe("cobro en puerta", () => {
  it("el saldo descuenta lo cobrado y el descuento ya aplicado", () => {
    expect(saldoDe(130_000, [])).toBe(130_000)
    expect(saldoDe(130_000, [{ importe: 50_000, descuento: 0 }])).toBe(80_000)
    expect(saldoDe(130_000, [{ importe: 117_000, descuento: 13_000 }])).toBe(0)
  })

  it("el saldo completo en efectivo tiene 10 % de descuento", () => {
    expect(cobroDelSaldo(130_000, "EFECTIVO")).toEqual({ importe: 117_000, descuento: 13_000 })
    expect(cobroDelSaldo(130_000, "DEBITO")).toEqual({ importe: 130_000, descuento: 0 })
  })

  it("suma la caja del día por forma de pago", () => {
    expect(
      totalesPorForma([
        { forma: "EFECTIVO", importe: 117_000 },
        { forma: "DEBITO", importe: 40_000 },
        { forma: "EFECTIVO", importe: 3_000 },
      ]),
    ).toEqual({ EFECTIVO: 120_000, DEBITO: 40_000, TRANSFERENCIA: 0 })
  })
})
