import { describe, expect, it } from "vitest"

import { cobrosEnCsv, porForma, type Cobro } from "@/lib/panel/caja"

const cobro = (id: number, forma: Cobro["forma"], importe: number, descuento = 0): Cobro => ({
  id,
  fecha: "2026-10-07",
  hora: new Date("2026-10-07T13:00:00Z"),
  forma,
  importe,
  descuento,
  reservaId: id * 10,
  titular: `Titular ${id}`,
  detalle: "Saldo en puerta",
  registradoPor: "Puerta",
})

describe("porForma", () => {
  it("suma cada forma de pago por separado", () => {
    const grupos = porForma([cobro(1, "EFECTIVO", 70_000, 7_778), cobro(2, "TRANSFERENCIA", 80_000), cobro(3, "EFECTIVO", 120_000)])
    expect(grupos.map((grupo) => [grupo.id, grupo.total, grupo.cobros.length, grupo.descuentos])).toEqual([
      ["EFECTIVO", 190_000, 2, 7_778],
      ["TRANSFERENCIA", 80_000, 1, 0],
      ["DEBITO", 0, 0, 0],
    ])
  })
})

describe("cobrosEnCsv", () => {
  it("arma un CSV para Excel en español y escapa lo que hace falta", () => {
    const csv = cobrosEnCsv([{ ...cobro(1, "EFECTIVO", 70_000), titular: 'Escuela "N.º 5"; turno tarde' }], () => "10:00")
    const [encabezado, fila] = csv.replace("﻿", "").trim().split("\r\n")
    expect(encabezado).toBe("Fecha;Hora;Forma;Importe;Descuento;Reserva;Titular;Detalle;Cargó")
    expect(fila).toBe('07/10/2026;10:00;Efectivo;70000;0;10;"Escuela ""N.º 5""; turno tarde";Saldo en puerta;Puerta')
  })
})
