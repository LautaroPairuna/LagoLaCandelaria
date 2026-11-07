import { describe, expect, it } from "vitest"

import { filtrarYOrdenar, leerFiltros, sinFiltros } from "@/lib/panel/filtros-puerta"

const reservas = [
  { titular: "Zárate", visible: "confirmada" as const, modulo: "FINDE_FAMILIA" as const, unidades: [{ tipo: "PARRILLA" as const, numero: 12 }] },
  { titular: "álvarez", visible: "a-confirmar" as const, modulo: "FINDE_FAMILIA" as const, unidades: [{ tipo: "PALAPA" as const, numero: 3 }, { tipo: "PARRILLA" as const, numero: 4 }] },
  { titular: "Colegio Belgrano", visible: "ingresada" as const, modulo: "CAMPAMENTO" as const, unidades: [] },
  { titular: "Martínez", visible: "finalizada" as const, modulo: "BUNGALOW" as const, unidades: [{ tipo: "BUNGALOW" as const, numero: 2 }] },
]
const titulares = (lista: { titular: string }[]) => lista.map((reserva) => reserva.titular)

describe("filtros de Puerta", () => {
  it("filtra por estado, propuesta y lugar", () => {
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, estado: "por-llegar" }))).toEqual(["Zárate", "álvarez"])
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, tipo: "grupos" }))).toEqual(["Colegio Belgrano"])
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, lugar: "parrilla" }))).toEqual(["Zárate", "álvarez"])
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, lugar: "sin-lugar" }))).toEqual(["Colegio Belgrano"])
  })

  it("ordena sin importar mayúsculas ni tildes, y por número de lugar con los que no tienen al final", () => {
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, orden: "az" }))).toEqual(["álvarez", "Colegio Belgrano", "Martínez", "Zárate"])
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, orden: "za" }))[0]).toBe("Zárate")
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, orden: "parrilla-asc" })).slice(0, 2)).toEqual(["álvarez", "Zárate"])
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, orden: "parrilla-desc" })).slice(0, 2)).toEqual(["Zárate", "álvarez"])
    expect(titulares(filtrarYOrdenar(reservas, { ...sinFiltros, orden: "palapa-asc" }))[0]).toBe("álvarez")
  })

  it("ignora valores inventados en la dirección", () => {
    expect(leerFiltros({ estado: "cualquiera", orden: ["za", "az"], lugar: "gazebo" })).toEqual({ ...sinFiltros, orden: "za", lugar: "gazebo" })
  })
})
