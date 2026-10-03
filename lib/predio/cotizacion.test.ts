import { describe, expect, it } from "vitest"

import { cotizarBungalows, cotizarDia } from "@/lib/predio/cotizacion"

describe("cotización de la reserva", () => {
  it("cobra el día por persona como la planilla de finde en familia", () => {
    const cotizacion = cotizarDia({ adultos: 2, menores: 2, sinCargo: 1 })
    expect(cotizacion.total).toBe(130_000)
    expect(cotizacion.totalEfectivo).toBe(117_000)
    expect(cotizacion.lineas.map((linea) => linea.concepto)).toEqual(["Adultos", "Menores", "Sin cargo"])
  })

  it("cobra el bungalow por noche según cuántos duermen", () => {
    expect(cotizarBungalows(4, 1, 1).total).toBe(440_000)
    expect(cotizarBungalows(3, 2, 1).total).toBe(740_000)
    expect(cotizarBungalows(6, 1, 2).total).toBe(740_000)
  })
})
