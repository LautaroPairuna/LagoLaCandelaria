import { describe, expect, it } from "vitest"

import { cajaEnCsv } from "@/lib/panel/caja"
import { renglonesDeMovimiento, type Renglon } from "@/lib/panel/libro-caja"

const cobro: Renglon = {
  origen: "cobro",
  clave: "c1",
  fecha: "2026-10-05",
  hora: new Date(),
  cajon: "EFECTIVO",
  sentido: "ingreso",
  monto: 90_000,
  concepto: 'Escuela "N.º 5"; turno tarde',
  registradoPor: "Puerta",
  reservaId: 12,
  codigo: "LC-ABC123",
  forma: "EFECTIVO",
  descuento: 10_000,
}

describe("cajaEnCsv", () => {
  it("lista los renglones y cierra con el resumen de cada cajón", () => {
    const pase = renglonesDeMovimiento({ id: 3, tipo: "TRANSFERENCIA", cajon: "EFECTIVO", fecha: "2026-10-06", concepto: "Depósito", monto: 50_000, registradoPor: "Ana", creadoEn: new Date() })
    const resumen = [
      { id: "EFECTIVO" as const, nombre: "Caja · Efectivo", detalle: "", ingreso: 90_000, egreso: 50_000, balance: 40_000 },
      { id: "BANCO" as const, nombre: "Banco · Transferencia", detalle: "", ingreso: 50_000, egreso: 0, balance: 50_000 },
    ]
    const lineas = cajaEnCsv([cobro, ...pase], resumen, "2026-10-07", () => "10:00").replace(/^﻿/, "").trim().split("\r\n")
    expect(lineas[0]).toBe("Fecha;Hora;Cajón;Tipo;Concepto;Reserva;Ingreso;Egreso;Cargó")
    expect(lineas[1]).toBe('05/10/2026;10:00;Efectivo;Cobro de reserva;"Escuela ""N.º 5""; turno tarde";12 (LC-ABC123);90000;;Puerta')
    expect(lineas[2]).toBe("06/10/2026;10:00;Efectivo;Pase entre cajones;Depósito;;;50000;Ana")
    expect(lineas[3]).toBe("06/10/2026;10:00;Banco;Pase entre cajones;Depósito;;50000;;Ana")
    expect(lineas.at(-3)).toBe(";;Cajón;;;;Ingreso;Egreso;Balance al 07/10/2026".replace(/^/, "Resumen"))
    expect(lineas.at(-2)).toBe(";;Caja · Efectivo;;;;90000;50000;40000")
    expect(lineas.at(-1)).toBe(";;Banco · Transferencia;;;;50000;0;50000")
  })
})
