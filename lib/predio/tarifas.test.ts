import { describe, expect, it } from "vitest"

import { bandaDeEdad, conDescuentoEfectivo, conRecargoTransferencia, entradas, presupuestoGrupo } from "@/lib/predio/tarifas"

describe("tarifas", () => {
  it("separa las edades como la especificación: menos de 5 sin cargo, 5 a 12 menor, más de 12 adulto", () => {
    expect(bandaDeEdad(4)).toBe("sin-cargo")
    expect(bandaDeEdad(5)).toBe("menor")
    expect(bandaDeEdad(12)).toBe("menor")
    expect(bandaDeEdad(13)).toBe("adulto")
    expect(bandaDeEdad(40, true)).toBe("sin-cargo")
  })

  it("cobra la entrada en efectivo y suma el 10 % por transferencia", () => {
    expect(entradas(2, 2)).toBe(130_000)
    expect(entradas(2, 2, "semana")).toBe(100_000)
    expect(conRecargoTransferencia(40_000)).toBe(44_000)
    expect(conRecargoTransferencia(25_000)).toBe(27_500)
    expect(conDescuentoEfectivo(44_000)).toBe(40_000)
  })

  it("reproduce el presupuesto de la planilla de campamentos", () => {
    const presupuesto = presupuestoGrupo({
      participantes: 30,
      acompanantes: 5,
      valorParticipante: 88_000,
      bonificadosParticipantes: 5,
      bonificadosAcompanantes: 3,
    })
    expect(presupuesto.lineas.map((linea) => linea.importe)).toEqual([2_200_000, 123_200])
    expect(presupuesto.total).toBe(2_323_200)
    expect(presupuesto.totalEfectivo).toBe(2_112_000)
  })

  it("reproduce el presupuesto de la planilla de viaje de egresados", () => {
    const presupuesto = presupuestoGrupo({
      participantes: 25,
      acompanantes: 10,
      valorParticipante: 44_000,
      bonificadosAcompanantes: 2,
    })
    expect(presupuesto.total).toBe(1_346_400)
  })
})
