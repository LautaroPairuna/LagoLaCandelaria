import { describe, expect, it } from "vitest"

import { asignarParrilla, asignarPlaya, lugaresDePlayaPara } from "@/lib/predio/asignacion"
import { gruposDeParrillas, inventario, unidadesDelTipo } from "@/lib/predio/inventario"

const todoLibre = () => true
const ids = (resultado: ReturnType<typeof asignarParrilla>) => ("unidades" in resultado ? resultado.unidades.map((item) => item.id) : null)

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

describe("asignación de parrilla", () => {
  it("un grupo chico va a la primera parrilla de 1 mesa", () => {
    expect(ids(asignarParrilla(4, todoLibre))).toEqual(["parrilla-4"])
  })

  it("cuando se llenan las de 1 mesa pasa a las de 2 y después a las de 3", () => {
    const unaMesa = new Set(gruposDeParrillas[0].numeros.map((numero) => `parrilla-${numero}`))
    expect(ids(asignarParrilla(5, (id) => !unaMesa.has(id)))).toEqual(["parrilla-1"])
    const dosMesas = new Set(gruposDeParrillas[1].numeros.map((numero) => `parrilla-${numero}`))
    expect(ids(asignarParrilla(5, (id) => !unaMesa.has(id) && !dosMesas.has(id)))).toEqual(["parrilla-44"])
  })

  it("de 7 a 12 personas arranca por las de 2 mesas y de 13 a 18 por las de 3", () => {
    expect(ids(asignarParrilla(12, todoLibre))).toEqual(["parrilla-1"])
    expect(ids(asignarParrilla(13, todoLibre))).toEqual(["parrilla-44"])
  })

  it("más de 18 personas va a un quincho", () => {
    expect(ids(asignarParrilla(19, todoLibre))).toEqual(["quincho-1"])
    expect(ids(asignarParrilla(30, (id) => id !== "quincho-1"))).toEqual(["quincho-2"])
  })

  it("sin lugar cuando no queda nada que alcance", () => {
    expect(asignarParrilla(13, (id) => !/^parrilla-4[4-9]$/.test(id))).toEqual({ sinLugar: true })
  })
})

describe("asignación de playa", () => {
  it("da 1, 2 o 3 lugares según el tamaño del grupo", () => {
    expect([1, 3, 4, 8, 9, 20].map(lugaresDePlayaPara)).toEqual([1, 1, 2, 2, 3, 3])
  })

  it("intenta que todo el grupo quede en el mismo tipo de lugar", () => {
    const resultado = asignarPlaya(6, todoLibre)
    expect("unidades" in resultado && resultado.unidades.map((item) => item.id)).toEqual(["palapa-1", "palapa-2"])
  })
})
