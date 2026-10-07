import { describe, expect, it } from "vitest"

import { estadoVisible, estilosDeEstado, ordenDeEstados } from "@/lib/panel/estados"

describe("estadoVisible", () => {
  it("junta la confirmación con el ingreso", () => {
    expect(estadoVisible("PENDIENTE", "por-llegar")).toBe("a-confirmar")
    expect(estadoVisible("CONFIRMADA", "por-llegar")).toBe("confirmada")
    expect(estadoVisible("CONFIRMADA", "parcial")).toBe("parcial")
    expect(estadoVisible("CONFIRMADA", "adentro")).toBe("ingresada")
    expect(estadoVisible("CONFIRMADA", "finalizada")).toBe("finalizada")
    expect(estadoVisible("CONFIRMADA", "no-vino")).toBe("no-vino")
  })

  it("lo cancelado manda sobre todo lo demás", () => {
    expect(estadoVisible("CANCELADA", "adentro")).toBe("cancelada")
  })

  it("una reserva sin confirmar a la que ya entró gente muestra el ingreso", () => {
    expect(estadoVisible("PENDIENTE", "adentro")).toBe("ingresada")
  })
})

describe("estilosDeEstado", () => {
  it("cada estado tiene su color y su texto, sin repetir", () => {
    expect(Object.keys(estilosDeEstado).sort()).toEqual([...ordenDeEstados].sort())
    expect(new Set(ordenDeEstados.map((estado) => estilosDeEstado[estado].insignia)).size).toBe(ordenDeEstados.length)
    expect(new Set(ordenDeEstados.map((estado) => estilosDeEstado[estado].nombre)).size).toBe(ordenDeEstados.length)
  })
})
