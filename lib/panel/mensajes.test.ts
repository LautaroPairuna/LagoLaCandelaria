import { describe, expect, it } from "vitest"

import { mensajeDeConfirmada } from "@/lib/panel/mensajes"

const reserva = { nombre: "Tobías", codigo: "LC-6WNTWH", desde: "2027-02-19", token: "abc123" }

describe("mensaje de reserva confirmada", () => {
  it("avisa en negrita que el ticket trae los horarios y el reglamento", () => {
    const mensaje = mensajeDeConfirmada({ ...reserva, modulo: "FINDE_FAMILIA" })
    expect(mensaje).toContain("LC-6WNTWH")
    expect(mensaje).toContain("/reserva/t/abc123")
    expect(mensaje).toContain("📌 *En este link también vas a encontrar los horarios y el reglamento del predio.*")
  })

  it("en el nado no hay horario de actividades, y en los estudiantiles el ticket no trae reglamento", () => {
    expect(mensajeDeConfirmada({ ...reserva, modulo: "NADO" })).toContain("*En este link también vas a encontrar el reglamento del predio.*")
    expect(mensajeDeConfirmada({ ...reserva, modulo: "CAMPAMENTO" })).not.toContain("📌")
  })
})
