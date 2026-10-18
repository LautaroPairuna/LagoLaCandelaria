import { describe, expect, it } from "vitest"

import { lugaresDePlayaPara } from "@/lib/predio/asignacion"
import { gruposDeParrillas, inventario, unidadesDelTipo } from "@/lib/predio/inventario"

describe("inventario", () => {
  it("tiene 46 parrillas, 3 quinchos, 28 gazebos, 84 palapas y ninguna unidad repetida", () => {
    expect(unidadesDelTipo("PARRILLA")).toHaveLength(46)
    expect(unidadesDelTipo("QUINCHO")).toHaveLength(3)
    expect(unidadesDelTipo("GAZEBO").map((gazebo) => gazebo.etiqueta).join("")).toBe("ABCDEFGHIJKLLLMNÑOPQRSTUVWXYZ")
    expect(unidadesDelTipo("PALAPA")).toHaveLength(84)
    expect(unidadesDelTipo("GAZEBO", "PALAPA").every((lugar) => lugar.capacidad === 4)).toBe(true)
    expect(new Set(inventario.map((item) => item.id)).size).toBe(inventario.length)
    const numeros = gruposDeParrillas.flatMap((grupo) => grupo.numeros)
    expect(new Set(numeros).size).toBe(46)
  })
})

describe("playa", () => {
  it("un gazebo o una palapa cada 4 personas", () => {
    expect([1, 4, 5, 8, 9, 20].map(lugaresDePlayaPara)).toEqual([1, 1, 2, 2, 3, 5])
  })
})
