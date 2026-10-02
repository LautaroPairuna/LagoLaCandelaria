import { describe, expect, it } from "vitest"

import { estadoDelDia, mapaDeEspeciales } from "@/lib/predio/calendario"
import { feriados2026 } from "@/lib/predio/feriados"

const especiales = mapaDeEspeciales(feriados2026)
const abierto = (fecha: string) => estadoDelDia(fecha, especiales).abierto

describe("calendario de apertura", () => {
  it("en enero y febrero abre de miércoles a domingo", () => {
    expect(abierto("2026-01-05")).toBe(false)
    expect(abierto("2026-01-06")).toBe(false)
    expect(abierto("2026-01-07")).toBe(true)
    expect(abierto("2026-01-11")).toBe(true)
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
