import { describe, expect, it } from "vitest"

import { cotizarBungalows, cotizarDia, cotizarNado, lineasSegunForma, totalSegunForma } from "@/lib/predio/cotizacion"

describe("cotización de la reserva", () => {
  it("fin de semana: 40.000 y 25.000 en efectivo, con 10 % más por transferencia", () => {
    const cotizacion = cotizarDia({ adultos: 2, menores: 2, sinCargo: 1 }, "finde")
    expect(cotizacion.totalEfectivo).toBe(130_000)
    expect(cotizacion.total).toBe(143_000)
    expect(cotizacion.lineas.map((linea) => linea.importe)).toEqual([88_000, 55_000, 0])
    expect(lineasSegunForma(cotizacion, "EFECTIVO").map((linea) => linea.importe)).toEqual([80_000, 50_000, 0])
    expect(totalSegunForma(cotizacion, "EFECTIVO")).toBe(130_000)
    expect(totalSegunForma(cotizacion, "TRANSFERENCIA")).toBe(143_000)
  })

  it("día de semana: 30.000 y 20.000 en efectivo", () => {
    const cotizacion = cotizarDia({ adultos: 1, menores: 1, sinCargo: 0 }, "semana")
    expect(cotizacion.totalEfectivo).toBe(50_000)
    expect(cotizacion.total).toBe(55_000)
  })

  it("nado: precio único por nadador, 25.000 el finde y 20.000 en semana", () => {
    expect(cotizarNado(3, "finde")).toMatchObject({ total: 75_000, totalEfectivo: 75_000 })
    expect(cotizarNado(3, "semana").total).toBe(60_000)
  })

  it("bungalows: 370.000 por bungalow la estadía", () => {
    expect(cotizarBungalows(1).total).toBe(370_000)
    expect(cotizarBungalows(2)).toMatchObject({ total: 740_000, totalEfectivo: 740_000 })
  })
})
