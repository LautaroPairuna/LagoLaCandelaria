import { describe, expect, it } from "vitest"

import { periodoAnterior, variacion } from "@/lib/panel/tablero"

describe("tablero", () => {
  it("el período anterior tiene la misma cantidad de días y termina justo antes", () => {
    expect(periodoAnterior({ desde: "2026-05-01", hasta: "2026-10-31" })).toEqual({ desde: "2025-10-29", hasta: "2026-04-30" })
    expect(periodoAnterior({ desde: "2026-10-01", hasta: "2026-10-31" })).toEqual({ desde: "2026-08-31", hasta: "2026-09-30" })
  })

  it("la variación es porcentual y no inventa un porcentaje cuando antes no había nada", () => {
    expect(variacion(150, 100)).toBe(50)
    expect(variacion(50, 100)).toBe(-50)
    expect(variacion(0, 0)).toBe(0)
    expect(variacion(10, 0)).toBeNull()
  })
})
