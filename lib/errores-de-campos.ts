import type { ZodError } from "zod"

/// El primer problema de cada campo, con la ruta como id del input ("familias.0.adultos.1.dni").
export function camposDe(error: ZodError, prefijo?: string) {
  const campos: Record<string, string> = {}
  for (const problema of error.issues) {
    const ruta = [...(prefijo ? [prefijo] : []), ...problema.path].join(".")
    campos[ruta] ??= problema.message
  }
  return campos
}
