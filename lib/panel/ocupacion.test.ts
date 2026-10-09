import { describe, expect, it } from "vitest"

import { ocupacionPorDia, porcentaje, textoDelPorcentaje } from "@/lib/panel/ocupacion"

const reserva = (modulo: "FINDE_FAMILIA" | "BUNGALOW" | "CAMPAMENTO" | "ACTIVIDAD_AVENTURA", desde: string, hasta: string, personas: number, estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" = "CONFIRMADA") => ({
  modulo,
  estado,
  desde,
  hasta,
  personas,
})

describe("ocupacionPorDia", () => {
  it("suma personas y cuenta reservas por línea", () => {
    const dias = ocupacionPorDia(
      [
        reserva("FINDE_FAMILIA", "2026-10-10", "2026-10-10", 6),
        reserva("FINDE_FAMILIA", "2026-10-10", "2026-10-10", 4, "PENDIENTE"),
        reserva("CAMPAMENTO", "2026-10-10", "2026-10-10", 40),
        reserva("ACTIVIDAD_AVENTURA", "2026-10-10", "2026-10-10", 20),
      ],
      "2026-10-01",
      "2026-10-31",
    )
    expect(dias.get("2026-10-10")).toEqual({ personas: 70, reservas: 4, pendientes: 1, porLinea: { familia: 2, estudiantil: 1, aventura: 1 } })
  })

  it("cuenta una estadía en cada uno de sus días y recorta al mes", () => {
    const dias = ocupacionPorDia([reserva("BUNGALOW", "2026-10-30", "2026-11-02", 4)], "2026-10-01", "2026-10-31")
    expect([...dias.keys()]).toEqual(["2026-10-30", "2026-10-31"])
    expect(dias.get("2026-10-31")?.porLinea.familia).toBe(1)
  })

  it("ignora las canceladas", () => {
    expect(ocupacionPorDia([reserva("FINDE_FAMILIA", "2026-10-10", "2026-10-10", 6, "CANCELADA")], "2026-10-01", "2026-10-31").size).toBe(0)
  })
})

describe("porcentaje", () => {
  it("redondea y no divide por cero", () => {
    expect(porcentaje(190, 576)).toBe(33)
    expect(porcentaje(5, 0)).toBe(0)
  })
})

describe("textoDelPorcentaje", () => {
  it("no muestra 0 % cuando hay alguien", () => {
    expect(textoDelPorcentaje(1, 892)).toBe("<1 %")
    expect(textoDelPorcentaje(0, 892)).toBe("0 %")
    expect(textoDelPorcentaje(190, 576)).toBe("33 %")
  })
})
