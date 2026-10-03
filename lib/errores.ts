import { ZodError, type ZodType, type output } from "zod"

import { Prisma } from "@/generated/prisma/client"

export type Fallo = { ok: false; error: string; campos?: Record<string, string> }
export type Resultado<T extends object = object> = ({ ok: true } & T) | Fallo

export const mensajes = {
  sinBase: "Ahora no llegamos al sistema del predio. Esperá un minuto y probá de nuevo; si sigue igual, avisá a la administración.",
  sinPermiso: "Tu sesión venció o no tenés permiso para hacer esto. Volvé a entrar al panel.",
  repetido: "Eso ya estaba cargado. Actualizá la página para ver lo último.",
  yaNoEsta: "Eso ya no está como lo veías: alguien lo cambió hace un momento. Actualizá la página.",
  datos: "Hay datos para revisar. Te marcamos qué falta.",
  demasiados: "Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.",
  inesperado: "Algo falló de nuestro lado. Probá de nuevo y, si se repite, avisá a la administración.",
}

export type Mensajes = typeof mensajes

// Quien reserva desde la web no conoce a "la administración": se le ofrece el WhatsApp.
export const mensajesDelSitio: Mensajes = {
  ...mensajes,
  sinBase: "El sistema de reservas no responde en este momento. Probá en un rato o escribinos por WhatsApp y lo resolvemos.",
  repetido: "Ese pedido ya nos había llegado. Si no te aparece, escribinos por WhatsApp.",
  datos: "Hay algunos datos para revisar. Te los marcamos en rojo.",
  demasiados: "Recibimos muchos pedidos seguidos desde tu conexión. Esperá unos minutos y probá de nuevo.",
  inesperado: "Algo falló de nuestro lado y no se guardó nada. Probá de nuevo; si se repite, escribinos por WhatsApp.",
}

/// Un error que ya viene con el texto para la persona. Se tira desde una acción cuando
/// el motivo es conocido (no hay lugar, la reserva ya estaba confirmada, etc.).
export class ErrorHumano extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = "ErrorHumano"
  }
}

export function exigir(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new ErrorHumano(mensaje)
}

/// Para formularios que no marcan cada campo: el primer problema ya es el mensaje.
export function validar<T extends ZodType>(esquema: T, datos: unknown): output<T> {
  const entrada = esquema.safeParse(datos)
  if (!entrada.success) throw new ErrorHumano(entrada.error.issues[0]?.message ?? mensajes.datos)
  return entrada.data
}

export function baseCaida(error: unknown) {
  if (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1000", "P1001", "P1002", "P1017", "P2021", "P2022"].includes(error.code)) ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true
  }
  const texto = error instanceof Error ? `${error.name} ${error.message}` : ""
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connect|pool timeout|database server|DATABASE_URL/i.test(texto)
}

// El APIError de Better Auth puede venir de otra copia del módulo, así que
// `instanceof` no siempre lo reconoce: se identifica por el nombre.
export function errorDeAuth(error: unknown): { status: string; message: string } | null {
  if (error instanceof Error && error.name === "APIError" && "status" in error) {
    return { status: String(error.status), message: error.message }
  }
  return null
}

export function camposDe(error: ZodError) {
  const campos: Record<string, string> = {}
  for (const problema of error.issues) campos[problema.path.join(".")] ??= problema.message
  return campos
}

export function humanizar(error: unknown, textos: Mensajes = mensajes): Fallo {
  if (error instanceof ErrorHumano) return { ok: false, error: error.message }
  if (error instanceof ZodError) return { ok: false, error: textos.datos, campos: camposDe(error) }
  if (baseCaida(error)) return { ok: false, error: textos.sinBase }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { ok: false, error: textos.repetido }
    if (error.code === "P2025") return { ok: false, error: textos.yaNoEsta }
  }
  const auth = errorDeAuth(error)
  if (auth) {
    if (auth.status === "TOO_MANY_REQUESTS") return { ok: false, error: textos.demasiados }
    if (/exist/i.test(auth.message)) return { ok: false, error: "Ya hay alguien del equipo con ese correo." }
    if (auth.status === "UNAUTHORIZED" || auth.status === "FORBIDDEN") return { ok: false, error: textos.sinPermiso }
  }
  return { ok: false, error: textos.inesperado }
}

/// Envoltorio de las Server Actions: lo que sale mal se anota con su detalle técnico en
/// el log del servidor y a la persona le llega solo el mensaje humano.
export async function accion<T extends object>(
  nombre: string,
  tarea: () => Promise<Resultado<T>>,
  textos: Mensajes = mensajes,
): Promise<Resultado<T>> {
  try {
    return await tarea()
  } catch (error) {
    if (!(error instanceof ErrorHumano) && !(error instanceof ZodError)) {
      const detalle = error instanceof Error ? `${error.name}: ${error.message.replace(/\s+/g, " ").slice(0, 300)}` : String(error)
      console.error(`[${nombre}] ${detalle}`)
    }
    return humanizar(error, textos)
  }
}
