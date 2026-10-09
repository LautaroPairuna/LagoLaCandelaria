import { describe, expect, it } from "vitest"

import { familias, personasDe } from "@/lib/reserva-familia"

const adulto = (edad: number | null, dni = "30111222") => ({ nombre: "Ana", apellido: "Gómez", edad, dni, notas: "" })
const nino = (edad: number | null) => ({ nombre: "Tomi", apellido: "Gómez", edad, notas: "Alergia al tomate" })

describe("familias", () => {
  it("acepta adultos con DNI y niños sin documento", () => {
    expect(familias.safeParse([{ adultos: [adulto(40)], ninos: [nino(7)] }]).success).toBe(true)
  })

  it("pide DNI a los mayores de edad y no a los adolescentes", () => {
    const sinDni = familias.safeParse([{ adultos: [adulto(40), adulto(16, "")], ninos: [] }])
    expect(sinDni.success).toBe(true)
    const faltaDni = familias.safeParse([{ adultos: [adulto(40, "")], ninos: [] }])
    expect(faltaDni.error?.issues[0]).toMatchObject({ path: [0, "adultos", 0, "dni"] })
  })

  it("cada familia necesita un mayor de 18", () => {
    const resultado = familias.safeParse([{ adultos: [adulto(16)], ninos: [nino(3)] }])
    expect(resultado.error?.issues.map((problema) => problema.message)).toContain("En cada familia tiene que venir al menos una persona de 18 años o más.")
  })

  it("marca la edad vacía y la franja equivocada", () => {
    const resultado = familias.safeParse([{ adultos: [adulto(null)], ninos: [nino(14)] }])
    const mensajes = resultado.error?.issues.map((problema) => problema.message)
    expect(mensajes).toContain("Escribí la edad.")
    expect(mensajes).toContain("Desde los 13 años va como adulto.")
  })
})

describe("personasDe", () => {
  it("numera las familias y marca al responsable de cada una", () => {
    const datos = familias.parse([
      { adultos: [adulto(15, ""), adulto(40)], ninos: [nino(7)] },
      { adultos: [adulto(35, "28999888")], ninos: [] },
    ])
    expect(personasDe(datos).map((persona) => [persona.familia, persona.edad, persona.responsable])).toEqual([
      [1, 15, false],
      [1, 40, true],
      [1, 7, false],
      [2, 35, true],
    ])
  })
})
