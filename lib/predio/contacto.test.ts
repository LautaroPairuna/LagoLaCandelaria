import { describe, expect, it } from "vitest"

import { dniValido, limpiarDni, normalizarTelefono } from "@/lib/predio/contacto"

describe("teléfono", () => {
  it("acepta característica más número y le agrega el +54", () => {
    expect(normalizarTelefono("11 3009-1020")).toEqual({
      nacional: "1130091020",
      e164: "+541130091020",
      whatsapp: "5491130091020",
    })
  })

  it("acepta el número con 0, con 9 o con +54 ya escrito", () => {
    for (const entrada of ["011 3009 1020", "+54 9 11 3009 1020", "+54 11 3009 1020", "5491130091020"]) {
      expect(normalizarTelefono(entrada)?.nacional).toBe("1130091020")
    }
  })

  it("rechaza números cortos o largos", () => {
    expect(normalizarTelefono("3009-1020")).toBeNull()
    expect(normalizarTelefono("11 3009 10200")).toBeNull()
  })
})

describe("DNI", () => {
  it("solo números, de 7 u 8 cifras", () => {
    expect(limpiarDni("30.111.222")).toBe("30111222")
    expect(dniValido("30111222")).toBe(true)
    expect(dniValido("123456")).toBe(false)
    expect(dniValido("123456789")).toBe(false)
  })
})
