import { describe, expect, it } from "vitest"

import { seccionesDe, zonas } from "@/lib/panel/lugares"
import { inventario } from "@/lib/predio/inventario"

describe("seccionesDe", () => {
  it("agrupa las parrillas por capacidad sin perder ni repetir ninguna", () => {
    const secciones = seccionesDe("parrillas")
    expect(secciones.map((seccion) => seccion.titulo)).toEqual(["Para 6 personas · 1 mesa", "Para 12 personas · 2 mesas", "Para 18 personas · 3 mesas"])
    const ids = secciones.flatMap((seccion) => seccion.unidades.map((unidad) => unidad.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(inventario.filter((unidad) => unidad.tipo === "PARRILLA").length)
  })

  it("cubre todos los lugares reservables del predio", () => {
    const enPantalla = zonas.flatMap((zona) => seccionesDe(zona.id).flatMap((seccion) => seccion.unidades.map((unidad) => unidad.tipo)))
    expect(new Set(enPantalla)).toEqual(new Set(["PARRILLA", "QUINCHO", "GAZEBO", "PALAPA", "BUNGALOW"]))
  })
})
