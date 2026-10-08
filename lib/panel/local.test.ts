import { describe, expect, it } from "vitest"

import { localDelSlug, porCategoria, resumenDeCuentas, totalDeCuenta } from "@/lib/panel/local"

describe("cuentas de mesa", () => {
  it("suma precio por cantidad", () => {
    expect(totalDeCuenta([{ precio: 12_000, cantidad: 2 }, { precio: 3_500, cantidad: 3 }])).toBe(34_500)
    expect(totalDeCuenta([])).toBe(0)
  })

  it("separa lo cobrado por forma de lo pendiente", () => {
    const resumen = resumenDeCuentas([
      { estado: "COBRADA", forma: "EFECTIVO", items: [{ precio: 10_000, cantidad: 2 }] },
      { estado: "COBRADA", forma: "TRANSFERENCIA", items: [{ precio: 5_000, cantidad: 1 }] },
      { estado: "ABIERTA", forma: null, items: [{ precio: 8_000, cantidad: 1 }] },
      { estado: "ABIERTA", forma: null, items: [] },
    ])
    expect(resumen).toEqual({ cobrado: { EFECTIVO: 20_000, DEBITO: 0, TRANSFERENCIA: 5_000 }, totalCobrado: 25_000, pendiente: 8_000, abiertas: 2 })
  })
})

describe("menú", () => {
  it("agrupa por categoría respetando el orden", () => {
    const grupos = porCategoria([
      { categoria: "Minutas", nombre: "Milanesa" },
      { categoria: "Bebidas", nombre: "Agua" },
      { categoria: "Minutas", nombre: "Hamburguesa" },
    ])
    expect(grupos.map((grupo) => [grupo.categoria, grupo.items.map((item) => item.nombre)])).toEqual([
      ["Minutas", ["Milanesa", "Hamburguesa"]],
      ["Bebidas", ["Agua"]],
    ])
  })

  it("reconoce los locales por su dirección", () => {
    expect(localDelSlug("bar")?.id).toBe("BAR")
    expect(localDelSlug("cocina")).toBeUndefined()
  })
})
