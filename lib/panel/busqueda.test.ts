import { describe, expect, it } from "vitest"

import { condicionDeBusqueda, condicionDeTexto } from "@/lib/panel/busqueda"

describe("condicionDeTexto", () => {
  it("sin texto no filtra", () => {
    expect(condicionDeTexto("   ")).toBeNull()
  })

  it("un número corto busca por número de reserva, DNI y teléfono", () => {
    const condicion = condicionDeTexto("N.º 27")
    expect(condicion?.OR?.[0]).toEqual({ id: 27 })
    expect(condicion?.OR).toHaveLength(4)
  })

  it("un número largo no se toma como número de reserva", () => {
    expect(condicionDeTexto("1130091020")?.OR?.some((item) => "id" in item)).toBe(false)
  })

  it("reconoce el código de la reserva", () => {
    expect(condicionDeTexto("lc-a3dm")).toEqual({ codigo: { contains: "LC-A3DM" } })
  })

  it("cada palabra tiene que aparecer en algún nombre", () => {
    const condicion = condicionDeTexto("lucía gómez")
    expect(condicion?.AND).toHaveLength(2)
  })
})

describe("condicionDeBusqueda", () => {
  const base = { texto: "", estado: "activas" as const, pasadas: false, hoy: "2026-10-06" }

  it("por defecto trae las próximas y sin canceladas", () => {
    const { AND } = condicionDeBusqueda(base) as { AND: object[] }
    expect(AND).toEqual([{ hasta: { gte: new Date("2026-10-06T00:00:00.000Z") } }, { estado: { not: "CANCELADA" } }])
  })

  it("con una fecha busca las que ocupan ese día, aunque ya haya pasado", () => {
    const { AND } = condicionDeBusqueda({ ...base, fecha: "2026-09-01" }) as { AND: object[] }
    expect(AND[0]).toEqual({ desde: { lte: new Date("2026-09-01T00:00:00.000Z") }, hasta: { gte: new Date("2026-09-01T00:00:00.000Z") } })
  })
})
