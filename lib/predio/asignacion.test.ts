import { describe, expect, it } from "vitest"

import { lugaresDePlayaPara } from "@/lib/predio/asignacion"
import { gruposDeParrillas, inventario, unidadesDelTipo } from "@/lib/predio/inventario"

describe("inventario", () => {
  it("tiene 46 parrillas, 3 quinchos, 60 lugares de playa y ninguna unidad repetida", () => {
    expect(unidadesDelTipo("PARRILLA")).toHaveLength(46)
    expect(unidadesDelTipo("QUINCHO")).toHaveLength(3)
    expect(unidadesDelTipo("GAZEBO", "PALAPA")).toHaveLength(60)
    expect(new Set(inventario.map((item) => item.id)).size).toBe(inventario.length)
    const numeros = gruposDeParrillas.flatMap((grupo) => grupo.numeros)
    expect(new Set(numeros).size).toBe(46)
  })
})

describe("playa", () => {
  it("da 1, 2 o 3 lugares según el tamaño del grupo", () => {
    expect([1, 3, 4, 8, 9, 20].map(lugaresDePlayaPara)).toEqual([1, 1, 2, 2, 3, 3])
  })
})
