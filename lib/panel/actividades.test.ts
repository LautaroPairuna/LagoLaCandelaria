import { describe, expect, it } from "vitest"

import { actividadesConProfesor, esActividadConProfesor, nombreDeActividad, rankingDeActividades } from "@/lib/panel/actividades"

describe("actividades con profesor", () => {
  it("salen del catálogo con su nombre", () => {
    expect(actividadesConProfesor.map((actividad) => actividad.nombre)).toEqual(["Canotaje", "Tirolesa", "Parque aéreo", "Palestra", "Péndulo", "Circuito de caminata"])
    expect(esActividadConProfesor("canotaje")).toBe(true)
    expect(esActividadConProfesor("fogon")).toBe(false)
    expect(nombreDeActividad("tirolesa")).toBe("Tirolesa")
  })

  it("ordena el ranking de más a menos e incluye las que no se hicieron", () => {
    const ranking = rankingDeActividades(
      [
        { actividad: "tirolesa", cantidad: 30 },
        { actividad: "canotaje", cantidad: 12 },
        { actividad: "tirolesa", cantidad: 10 },
      ],
      80,
    )
    expect(ranking.slice(0, 2).map((fila) => [fila.slug, fila.cantidad, fila.porcentaje])).toEqual([
      ["tirolesa", 40, 50],
      ["canotaje", 12, 15],
    ])
    expect(ranking).toHaveLength(6)
    expect(ranking.at(-1)?.cantidad).toBe(0)
  })
})

describe("tramos del gráfico", async () => {
  const { porTramos } = await import("@/lib/panel/estadisticas-actividades")
  it("muestra día por día en períodos cortos y por semana en los largos", () => {
    const cantidades = new Map([["2026-10-02", 4]])
    expect(porTramos(["2026-10-01", "2026-10-02"], cantidades)).toEqual([
      { desde: "2026-10-01", hasta: "2026-10-01", cantidad: 0 },
      { desde: "2026-10-02", hasta: "2026-10-02", cantidad: 4 },
    ])
    const dias = Array.from({ length: 70 }, (_, indice) => new Date(Date.UTC(2026, 0, 1 + indice)).toISOString().slice(0, 10))
    const semanas = porTramos(dias, new Map([["2026-01-08", 3], ["2026-01-09", 2]]))
    expect(semanas).toHaveLength(10)
    expect(semanas[1]).toEqual({ desde: "2026-01-08", hasta: "2026-01-14", cantidad: 5 })
  })
})
