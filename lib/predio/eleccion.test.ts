import { describe, expect, it } from "vitest"

import { grupoPorEdades, hayLugarPara, revisarEleccion, sugerir } from "@/lib/predio/eleccion"
import { idDeUnidad, inventario, type TipoUnidad } from "@/lib/predio/inventario"

const u = (tipo: TipoUnidad, numero: number) => inventario.find((item) => item.id === idDeUnidad(tipo, numero))!
const P6 = u("PARRILLA", 4)
const P6b = u("PARRILLA", 5)
const P12 = u("PARRILLA", 1)
const P18 = u("PARRILLA", 44)

describe("revisarEleccion en parrillas", () => {
  it("acepta una parrilla que alcanza", () => {
    expect(revisarEleccion("parrilla", 5, [P6])).toEqual({ ok: true })
  })

  it("pide sumar otra si no entran", () => {
    expect(revisarEleccion("parrilla", 9, [P6])).toMatchObject({ ok: false, faltan: true, mensaje: expect.stringContaining("sumá otra parrilla") })
  })

  it("acepta dos parrillas que juntas alcanzan", () => {
    expect(revisarEleccion("parrilla", 10, [P6, P6b])).toEqual({ ok: true })
  })

  it("no deja quedarse con una parrilla de más", () => {
    expect(revisarEleccion("parrilla", 5, [P6, P12])).toMatchObject({ ok: false, faltan: false, mensaje: expect.stringContaining("parrilla 4") })
  })

  it("con más de 18 personas pide un quincho", () => {
    expect(revisarEleccion("parrilla", 20, [P18])).toMatchObject({ ok: false })
    expect(revisarEleccion("parrilla", 20, [u("QUINCHO", 1)])).toEqual({ ok: true })
  })
})

describe("revisarEleccion en playa y bungalows", () => {
  it("pide la cantidad de lugares según el grupo", () => {
    expect(revisarEleccion("playa", 6, [u("PALAPA", 1)])).toMatchObject({ ok: false, faltan: true, mensaje: expect.stringContaining("van 2 lugares") })
    expect(revisarEleccion("playa", 6, [u("PALAPA", 1), u("GAZEBO", 1)])).toEqual({ ok: true })
    expect(revisarEleccion("playa", 3, [u("PALAPA", 1), u("PALAPA", 2)])).toMatchObject({ ok: false, faltan: false })
  })

  it("un bungalow cada 4 personas", () => {
    expect(revisarEleccion("bungalow", 5, [u("BUNGALOW", 1)])).toMatchObject({ ok: false, faltan: true })
    expect(revisarEleccion("bungalow", 5, [u("BUNGALOW", 1), u("BUNGALOW", 2)])).toEqual({ ok: true })
  })
})

describe("hayLugarPara y sugerir", () => {
  it("un día sirve si los libres suman lo necesario", () => {
    expect(hayLugarPara("parrilla", 10, [P6, P6b])).toBe(true)
    expect(hayLugarPara("parrilla", 13, [P6, P6b])).toBe(false)
    expect(hayLugarPara("playa", 9, [u("PALAPA", 1), u("PALAPA", 2)])).toBe(false)
  })

  it("sugiere la parrilla más chica que alcanza, o las que sumen", () => {
    expect(sugerir("parrilla", 5, [P18, P12, P6])).toEqual([P6])
    expect(sugerir("parrilla", 10, [P6, P6b])).toEqual([P6, P6b])
    expect(sugerir("parrilla", 20, [P18])).toBeNull()
  })

  it("en la playa prefiere lugares del mismo tipo", () => {
    expect(sugerir("playa", 6, [u("GAZEBO", 1), u("PALAPA", 3), u("PALAPA", 7)])?.map((item) => item.id)).toEqual(["palapa-3", "palapa-7"])
  })
})

describe("grupoPorEdades", () => {
  it("reparte en las franjas de la tarifa", () => {
    expect(grupoPorEdades([40, 38, 12, 5, 4, 13])).toEqual({ adultos: 3, menores: 2, sinCargo: 1 })
  })
})
