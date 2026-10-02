import { describe, expect, it } from "vitest"

import { asignarBungalows, estadoDelBungalow, seleccionPermitida } from "@/lib/predio/bungalows"

const hoy = "2026-10-01"

// Bungalow con 4 días libres entre dos ocupaciones: 10, 11, 12 y 13.
const cuatroLibres = new Set(["2026-10-09", "2026-10-14"])

describe("regla de huecos de bungalows", () => {
  it("con 4 días libres deja tomar el 1–2 y el 3–4 pero no el 2–3", () => {
    expect(estadoDelBungalow(cuatroLibres, "2026-10-10", "2026-10-11", hoy)).toBe("libre")
    expect(estadoDelBungalow(cuatroLibres, "2026-10-12", "2026-10-13", hoy)).toBe("libre")
    expect(estadoDelBungalow(cuatroLibres, "2026-10-11", "2026-10-12", hoy)).toBe("deja-huecos")
  })

  it("con 3 o 5 días libres da igual dónde caiga", () => {
    const tres = new Set(["2026-10-09", "2026-10-13"])
    expect(estadoDelBungalow(tres, "2026-10-10", "2026-10-11", hoy)).toBe("libre")
    expect(estadoDelBungalow(tres, "2026-10-11", "2026-10-12", hoy)).toBe("libre")
    const cinco = new Set(["2026-10-09", "2026-10-15"])
    for (const desde of ["2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"]) {
      const hasta = `2026-10-${String(Number(desde.slice(8)) + 1).padStart(2, "0")}`
      expect(estadoDelBungalow(cinco, desde, hasta, hoy)).toBe("libre")
    }
  })

  it("un tramo largo no cuenta como hueco", () => {
    expect(seleccionPermitida(null, null)).toBe(true)
    expect(seleccionPermitida(null, 1)).toBe(false)
    expect(seleccionPermitida(2, null)).toBe(true)
  })

  it("los días anteriores a hoy cuentan como ocupados", () => {
    expect(estadoDelBungalow(new Set(["2026-10-05"]), "2026-10-02", "2026-10-03", "2026-10-01")).toBe("deja-huecos")
    expect(estadoDelBungalow(new Set(["2026-10-05"]), "2026-10-01", "2026-10-02", "2026-10-01")).toBe("libre")
  })

  it("con más de 6 días libres antes no hay restricción", () => {
    expect(estadoDelBungalow(new Set(), "2026-10-10", "2026-10-11", hoy)).toBe("libre")
    expect(estadoDelBungalow(new Set(["2026-10-01"]), "2026-10-09", "2026-10-10", hoy)).toBe("libre")
  })

  it("no asigna un bungalow con una fecha ya tomada", () => {
    expect(estadoDelBungalow(cuatroLibres, "2026-10-13", "2026-10-14", hoy)).toBe("ocupado")
  })
})

describe("asignación de bungalows", () => {
  it("salta al siguiente bungalow cuando el primero dejaría huecos", () => {
    const ocupacion = new Map([["bungalow-1", cuatroLibres]])
    const resultado = asignarBungalows(4, "2026-10-11", "2026-10-12", hoy, ocupacion)
    expect("unidades" in resultado && resultado.unidades.map((item) => item.id)).toEqual(["bungalow-2"])
  })

  it("un grupo de 6 necesita dos bungalows", () => {
    const resultado = asignarBungalows(6, "2026-10-10", "2026-10-11", hoy, new Map())
    expect("unidades" in resultado && resultado.unidades).toHaveLength(2)
  })

  it("avisa si el único problema es que dejaría huecos", () => {
    const ocupacion = new Map(["bungalow-1", "bungalow-2", "bungalow-3", "bungalow-4"].map((id) => [id, cuatroLibres]))
    expect(asignarBungalows(2, "2026-10-11", "2026-10-12", hoy, ocupacion)).toEqual({ sinLugar: true, motivo: "deja-huecos" })
  })
})
