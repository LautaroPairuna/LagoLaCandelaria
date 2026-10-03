import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { Prisma } from "@/generated/prisma/client"
import { accion, ErrorHumano, humanizar, mensajes, mensajesDelSitio, validar } from "@/lib/errores"

function errorDePrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError("detalle técnico", { code, clientVersion: "7" })
}

describe("humanizar", () => {
  it("deja pasar el mensaje de un error humano", () => {
    expect(humanizar(new ErrorHumano("Ya no queda lugar."))).toEqual({ ok: false, error: "Ya no queda lugar." })
  })

  it("marca cada campo con su primer problema", () => {
    const esquema = z.object({ nombre: z.string().min(2, "Escribí el nombre."), edad: z.number().min(18, "Mayor de edad.") })
    const fallo = humanizar(esquema.safeParse({ nombre: "", edad: 3 }).error)
    expect(fallo).toEqual({ ok: false, error: mensajes.datos, campos: { nombre: "Escribí el nombre.", edad: "Mayor de edad." } })
  })

  it("traduce la base caída y los choques de Prisma", () => {
    expect(humanizar(errorDePrisma("P1001")).error).toBe(mensajes.sinBase)
    expect(humanizar(new Error("connect ECONNREFUSED 127.0.0.1:3306")).error).toBe(mensajes.sinBase)
    expect(humanizar(errorDePrisma("P2002")).error).toBe(mensajes.repetido)
    expect(humanizar(errorDePrisma("P2025")).error).toBe(mensajes.yaNoEsta)
  })

  it("reconoce los errores de Better Auth por el nombre", () => {
    const deAuth = (status: string, message: string) => Object.assign(new Error(message), { name: "APIError", status })
    expect(humanizar(deAuth("TOO_MANY_REQUESTS", "Too many")).error).toBe(mensajes.demasiados)
    expect(humanizar(deAuth("UNPROCESSABLE_ENTITY", "User already exists")).error).toMatch(/ese correo/)
    expect(humanizar(deAuth("FORBIDDEN", "nope")).error).toBe(mensajes.sinPermiso)
  })

  it("nunca muestra el detalle técnico", () => {
    expect(humanizar(new TypeError("Cannot read properties of undefined")).error).toBe(mensajes.inesperado)
    expect(humanizar(new Error("x"), mensajesDelSitio).error).toMatch(/WhatsApp/)
  })
})

describe("accion", () => {
  it("devuelve el resultado cuando sale bien", async () => {
    await expect(accion("prueba", async () => ({ ok: true, id: 3 }))).resolves.toEqual({ ok: true, id: 3 })
  })

  it("anota en el log solo los errores inesperados", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    await accion("prueba", async () => {
      throw new ErrorHumano("Conocido.")
    })
    expect(log).not.toHaveBeenCalled()
    const fallo = await accion("prueba", async () => {
      throw new Error("se rompió algo")
    })
    expect(fallo).toEqual({ ok: false, error: mensajes.inesperado })
    expect(log).toHaveBeenCalledWith("[prueba] Error: se rompió algo")
    log.mockRestore()
  })
})

describe("validar", () => {
  it("usa el primer problema como mensaje", () => {
    expect(() => validar(z.string().email("Ese correo no parece completo."), "hola")).toThrow("Ese correo no parece completo.")
  })
})
