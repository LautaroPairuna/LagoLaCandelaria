import { describe, expect, it } from "vitest"

import { armarMensaje, plantillasIniciales } from "@/lib/panel/plantillas"

describe("armarMensaje", () => {
  it("reemplaza las marcas con los datos de la reserva", () => {
    const ticket = plantillasIniciales.find((plantilla) => plantilla.tipo === "ticket")!
    const texto = armarMensaje(ticket.texto, { nombre: "Ana", codigo: "LC-AB12", fecha: "sábado 7 de noviembre", ticket: "https://x/t/1", reglamento: "📌 *Reglamento*" })
    expect(texto).toContain("¡Hola Ana! Tu reserva LC-AB12")
    expect(texto).toContain("para el sábado 7 de noviembre")
    expect(texto).toContain("https://x/t/1")
    expect(texto.endsWith("📌 *Reglamento*")).toBe(true)
  })

  it("sin reglamento no deja renglones vacíos al final", () => {
    const texto = armarMensaje("Hola {nombre}\n\n{ticket}\n\n{reglamento}", { nombre: "Ana", ticket: "https://x" })
    expect(texto).toBe("Hola Ana\n\nhttps://x")
  })

  it("deja como están las llaves que no son marcas", () => {
    expect(armarMensaje("Hola {nombre} {otra}", { nombre: "Ana" })).toBe("Hola Ana {otra}")
  })
})
