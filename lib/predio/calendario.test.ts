import { describe, expect, it } from "vitest"

import { estadoDelDia, mapaDeEspeciales, tipoDeDia } from "@/lib/predio/calendario"
import { feriados2026 } from "@/lib/predio/feriados"

const especiales = mapaDeEspeciales(feriados2026)
const abierto = (fecha: string) => estadoDelDia(fecha, especiales).abierto

describe("calendario de apertura", () => {
  it("del 6 de enero al 19 de febrero abre de miércoles a domingo", () => {
    expect(abierto("2027-01-05")).toBe(false)
    expect(abierto("2027-01-06")).toBe(true)
    expect(abierto("2027-01-07")).toBe(true)
    expect(abierto("2027-01-11")).toBe(false)
    expect(abierto("2027-02-19")).toBe(true)
    expect(abierto("2027-02-24")).toBe(false)
    expect(abierto("2026-12-30")).toBe(false)
  })

  it("los sábados, domingos y feriados cobran tarifa de fin de semana", () => {
    expect(tipoDeDia("2027-01-09", especiales)).toBe("finde")
    expect(tipoDeDia("2027-01-07", especiales)).toBe("semana")
    expect(tipoDeDia("2026-10-12", especiales)).toBe("finde")
  })

  it("los feriados de verano abren aunque caigan lunes o martes", () => {
    expect(abierto("2026-02-16")).toBe(true)
    expect(abierto("2026-02-17")).toBe(true)
  })

  it("de marzo a mediados de diciembre abre sábados, domingos y feriados", () => {
    expect(abierto("2026-10-17")).toBe(true)
    expect(abierto("2026-10-18")).toBe(true)
    expect(abierto("2026-10-14")).toBe(false)
    expect(abierto("2026-10-12")).toBe(true)
    expect(abierto("2026-07-10")).toBe(true)
  })

  it("no abre el 24, el 25 ni el 31 de diciembre, aunque sea feriado", () => {
    expect(estadoDelDia("2026-12-24", especiales)).toEqual({ abierto: false, motivo: "Nochebuena" })
    expect(abierto("2026-12-25")).toBe(false)
    expect(abierto("2026-12-31")).toBe(false)
  })

  it("un cierre o una apertura especial manda sobre la regla", () => {
    const conExcepciones = mapaDeEspeciales([
      { fecha: "2026-10-17", tipo: "CERRADO", motivo: "Mantenimiento" },
      { fecha: "2026-10-14", tipo: "ABIERTO", motivo: "Evento" },
    ])
    expect(estadoDelDia("2026-10-17", conExcepciones)).toEqual({ abierto: false, motivo: "Mantenimiento" })
    expect(estadoDelDia("2026-10-14", conExcepciones).abierto).toBe(true)
  })
})
