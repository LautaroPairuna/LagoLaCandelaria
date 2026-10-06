import { describe, expect, it } from "vitest"

import { armarSemanas } from "@/lib/panel/semanas"

const reserva = (id: number, desde: string, hasta = desde) => ({ id, desde, hasta })

describe("armarSemanas", () => {
  it("arma filas de lunes a domingo con huecos al principio y al final", () => {
    const semanas = armarSemanas("2026-10", [], 3)
    expect(semanas).toHaveLength(5)
    expect(semanas[0].dias).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"])
    expect(semanas[4].dias.slice(-2)).toEqual(["2026-10-31", null])
  })

  it("dibuja una estadía como una sola barra dentro de la semana", () => {
    const [primera] = armarSemanas("2026-10", [reserva(1, "2026-10-02", "2026-10-04")], 3)
    expect(primera.barras).toEqual([{ reserva: reserva(1, "2026-10-02", "2026-10-04"), columna: 4, largo: 3, carril: 0, empiezaAca: true, terminaAca: true }])
  })

  it("corta la barra en el domingo y la continúa la semana siguiente", () => {
    const semanas = armarSemanas("2026-10", [reserva(1, "2026-10-03", "2026-10-06")], 3)
    expect(semanas[0].barras[0]).toMatchObject({ columna: 5, largo: 2, empiezaAca: true, terminaAca: false })
    expect(semanas[1].barras[0]).toMatchObject({ columna: 0, largo: 2, empiezaAca: false, terminaAca: true })
  })

  it("recorta lo que empieza antes del mes o termina después", () => {
    const semanas = armarSemanas("2026-10", [reserva(1, "2026-09-29", "2026-10-02"), reserva(2, "2026-10-30", "2026-11-03")], 3)
    expect(semanas[0].barras[0]).toMatchObject({ columna: 3, largo: 2, empiezaAca: false })
    expect(semanas[4].barras[0]).toMatchObject({ columna: 4, largo: 2, terminaAca: false })
  })

  it("reparte las que se pisan en carriles distintos y reutiliza los libres", () => {
    const [primera] = armarSemanas("2026-10", [reserva(1, "2026-10-01", "2026-10-03"), reserva(2, "2026-10-02"), reserva(3, "2026-10-04")], 3)
    expect(primera.barras.map((barra) => [barra.reserva.id, barra.carril])).toEqual([
      [1, 0],
      [2, 1],
      [3, 0],
    ])
  })

  it("cuenta aparte las que no entran en los carriles visibles", () => {
    const muchas = [1, 2, 3, 4, 5].map((id) => reserva(id, "2026-10-03"))
    const [primera] = armarSemanas("2026-10", muchas, 3)
    expect(primera.barras).toHaveLength(3)
    expect(primera.masPorColumna[5]).toBe(2)
    expect(primera.masPorColumna[4]).toBe(0)
  })
})
