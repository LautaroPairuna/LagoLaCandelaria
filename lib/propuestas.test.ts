import { describe, expect, it } from "vitest"

import { buscarPropuestaEstudiantil } from "@/lib/propuestas"

describe("propuestas estudiantiles", () => {
  it("saben cuántas noches dura cada una, para marcar el egreso solo", () => {
    expect(buscarPropuestaEstudiantil("jornada-1")?.noches).toBe(0)
    expect(buscarPropuestaEstudiantil("campamento-5")?.noches).toBe(1)
    expect(buscarPropuestaEstudiantil("dormitorios-8")?.noches).toBe(1)
    expect(buscarPropuestaEstudiantil("campamento-11")?.noches).toBe(2)
    expect(buscarPropuestaEstudiantil("dormitorios-12")?.noches).toBe(2)
  })
})
