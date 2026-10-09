import { describe, expect, it } from "vitest"

import { claveDeHora, esFranja, horasDe, leerFranja, textoDeHora } from "@/lib/predio/horario"
import { libreEn } from "@/lib/reservas"

describe("franjas del restaurante", () => {
  it("lee la franja de la URL solo si está dentro del horario", () => {
    expect(leerFranja("12-14")).toEqual({ desde: 12, hasta: 14 })
    expect(leerFranja("9-12")).toBeNull()
    expect(leerFranja("18-20")).toBeNull()
    expect(leerFranja("14-14")).toBeNull()
    expect(leerFranja("abc")).toBeNull()
    expect(esFranja({ desde: 10, hasta: 19 })).toBe(true)
  })

  it("ocupa las horas enteras sin incluir la de salida", () => {
    expect(horasDe({ desde: 12, hasta: 15 })).toEqual([12, 13, 14])
    expect(textoDeHora(9)).toBe("09:00")
  })
})

describe("libreEn con horas", () => {
  const dia = "2026-10-12"
  const ocupacion = new Map([
    ["restaurante-2", new Set([claveDeHora(dia, 12), claveDeHora(dia, 13)])],
    ["parrilla-4", new Set([dia])],
  ])

  it("una mesa tomada de 12 a 14 queda libre antes y después", () => {
    expect(libreEn(ocupacion, dia, dia, [10, 11])("restaurante-2")).toBe(true)
    expect(libreEn(ocupacion, dia, dia, [14, 15, 16])("restaurante-2")).toBe(true)
    expect(libreEn(ocupacion, dia, dia, [13, 14])("restaurante-2")).toBe(false)
  })

  it("sin horas, el lugar tiene que estar libre todo el día", () => {
    expect(libreEn(ocupacion, dia, dia)("restaurante-2")).toBe(false)
    expect(libreEn(ocupacion, dia, dia)("parrilla-4")).toBe(false)
    expect(libreEn(ocupacion, dia, dia, [10])("parrilla-4")).toBe(false)
    expect(libreEn(ocupacion, "2026-10-13", "2026-10-13")("restaurante-2")).toBe(true)
  })
})
