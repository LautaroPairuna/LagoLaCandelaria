import { describe, expect, it } from "vitest"

import { bloquesPorMesa } from "@/lib/panel/salon"

describe("bloquesPorMesa", () => {
  it("junta las horas seguidas de cada reserva y ordena por horario", () => {
    const bloques = bloquesPorMesa([
      { unidadId: "restaurante-2", reservaId: 8, hora: 16 },
      { unidadId: "restaurante-2", reservaId: 7, hora: 12 },
      { unidadId: "restaurante-2", reservaId: 7, hora: 13 },
      { unidadId: "restaurante-2", reservaId: 8, hora: 15 },
      { unidadId: "restaurante-5", reservaId: 7, hora: 12 },
    ])
    expect(bloques.get("restaurante-2")).toEqual([
      { reservaId: 7, desde: 12, hasta: 14 },
      { reservaId: 8, desde: 15, hasta: 17 },
    ])
    expect(bloques.get("restaurante-5")).toEqual([{ reservaId: 7, desde: 12, hasta: 13 }])
  })

  it("una ocupación de día entero cubre todo el horario", () => {
    expect(bloquesPorMesa([{ unidadId: "restaurante-1", reservaId: 3, hora: 0 }]).get("restaurante-1")).toEqual([{ reservaId: 3, desde: 10, hasta: 19 }])
  })

  it("si una reserva tiene horas salteadas, quedan dos bloques", () => {
    const bloques = bloquesPorMesa([
      { unidadId: "restaurante-3", reservaId: 4, hora: 10 },
      { unidadId: "restaurante-3", reservaId: 4, hora: 12 },
    ])
    expect(bloques.get("restaurante-3")).toEqual([
      { reservaId: 4, desde: 10, hasta: 11 },
      { reservaId: 4, desde: 12, hasta: 13 },
    ])
  })
})
