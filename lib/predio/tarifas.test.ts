import { describe, expect, it } from "vitest"

import {
  bandaDeEdad,
  conDescuentoEfectivo,
  entradas,
  precioBungalowPorNoche,
  presupuestoGrupo,
  repartirEnBungalows,
} from "@/lib/predio/tarifas"

describe("tarifas", () => {
  it("separa las edades como la especificación: menos de 5 sin cargo, 5 a 12 menor, más de 12 adulto", () => {
    expect(bandaDeEdad(4)).toBe("sin-cargo")
    expect(bandaDeEdad(5)).toBe("menor")
    expect(bandaDeEdad(12)).toBe("menor")
    expect(bandaDeEdad(13)).toBe("adulto")
    expect(bandaDeEdad(40, true)).toBe("sin-cargo")
  })

  it("cobra la planilla de finde en familia: 2 adultos y 2 menores", () => {
    const total = entradas(2, 2)
    expect(total).toBe(130_000)
    expect(conDescuentoEfectivo(total)).toBe(117_000)
  })

  it("cobra el bungalow según cuántas personas duermen", () => {
    expect(precioBungalowPorNoche(1)).toBe(300_000)
    expect(precioBungalowPorNoche(2)).toBe(300_000)
    expect(precioBungalowPorNoche(3)).toBe(370_000)
    expect(precioBungalowPorNoche(4)).toBe(440_000)
  })

  it("reparte a las personas entre los bungalows de forma pareja", () => {
    expect(repartirEnBungalows(7, 2)).toEqual([4, 3])
    expect(repartirEnBungalows(4, 1)).toEqual([4])
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
    expect(presupuesto.totalEfectivo).toBe(2_090_880)
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
