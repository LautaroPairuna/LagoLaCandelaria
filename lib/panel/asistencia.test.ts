import { describe, expect, it } from "vitest"

import { aplicar, asistenciaDe, estadoDe, porPersona, resumenDeAsistencia } from "@/lib/panel/asistencia"

const t = new Date("2026-10-10T13:00:00Z")
const despues = new Date("2026-10-10T18:00:00Z")
const pendiente = { ingresoEn: null, salidaEn: null }
const adentro = { ingresoEn: t, salidaEn: null }
const salio = { ingresoEn: t, salidaEn: despues }

describe("estados", () => {
  it("cada persona está pendiente, adentro o se fue", () => {
    expect([pendiente, adentro, salio].map(estadoDe)).toEqual(["pendiente", "adentro", "salio"])
  })

  it("la reserva sale de sus personas", () => {
    expect(asistenciaDe(["pendiente", "pendiente"], false)).toBe("por-llegar")
    expect(asistenciaDe(["pendiente", "pendiente"], true)).toBe("no-vino")
    expect(asistenciaDe(["adentro", "pendiente"], false)).toBe("parcial")
    expect(asistenciaDe(["adentro", "adentro"], false)).toBe("adentro")
    expect(asistenciaDe(["adentro", "salio"], false)).toBe("adentro")
    expect(asistenciaDe(["salio", "salio"], false)).toBe("finalizada")
    expect(asistenciaDe(["salio", "pendiente"], true)).toBe("finalizada")
  })
})

describe("resumenDeAsistencia", () => {
  it("cuenta persona por persona cuando están todas cargadas", () => {
    const resumen = resumenDeAsistencia({ ...pendiente, adultos: 2, menores: 2, sinCargo: 0, hasta: "2026-10-10", personas: [adentro, adentro, pendiente, pendiente] }, "2026-10-10")
    expect(resumen).toMatchObject({ porPersona: true, asistencia: "parcial", pendientes: 2, adentro: 2, salieron: 0, total: 4 })
  })

  it("sin personas cargadas, la reserva entera cuenta como una", () => {
    expect(porPersona({ adultos: 2, menores: 40, sinCargo: 0, personas: [] })).toBe(false)
    const resumen = resumenDeAsistencia({ ...adentro, adultos: 2, menores: 40, sinCargo: 0, hasta: "2026-10-10", personas: [] }, "2026-10-10")
    expect(resumen).toMatchObject({ porPersona: false, asistencia: "adentro", adentro: 42, pendientes: 0 })
  })
})

describe("aplicar", () => {
  it("registra ingreso y salida, y no repite", () => {
    expect(aplicar("ingreso", pendiente, t)).toEqual(adentro)
    expect(aplicar("ingreso", adentro, t)).toBeNull()
    expect(aplicar("salida", adentro, despues)).toEqual(salio)
    expect(aplicar("salida", pendiente, despues)).toBeNull()
  })

  it("devuelve solo las horas aunque reciba la reserva entera", () => {
    const reserva = { ...adentro, id: 23, adultos: 2, personas: [] }
    expect(Object.keys(aplicar("salida", reserva, despues)!)).toEqual(["ingresoEn", "salidaEn"])
    expect(Object.keys(aplicar("deshacer", { ...reserva, salidaEn: despues }, t)!)).toEqual(["ingresoEn", "salidaEn"])
  })

  it("deshacer vuelve un paso atrás", () => {
    expect(aplicar("deshacer", salio, t)).toEqual(adentro)
    expect(aplicar("deshacer", adentro, t)).toEqual(pendiente)
    expect(aplicar("deshacer", pendiente, t)).toBeNull()
  })
})
