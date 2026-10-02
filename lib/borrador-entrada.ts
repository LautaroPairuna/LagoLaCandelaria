import { z } from "zod"

import type { Borrador, Errores } from "@/lib/solicitud"

export const MAX_FAMILIAS = 20
export const MAX_INTEGRANTES = 40
export const MAX_CUERPO_BYTES = 256 * 1024

const largo = "Es demasiado largo."

function texto(maximo: number) {
  return z.string().max(maximo, largo).default("")
}

function opcion<const T extends readonly [string, ...string[]]>(valores: T) {
  return z.enum(valores).or(z.literal("")).default("")
}

const ids = z.array(z.string().max(40)).max(80, "Elegiste demasiados lugares.").default([])

const persona = z
  .object({
    id: texto(64),
    nombre: texto(80),
    apellido: texto(80),
    dni: texto(20),
    edad: texto(3),
    notas: texto(1000),
    cud: z.boolean().default(false),
  })
  .prefault({})

const borradorSchema = z.object({
  tipo: opcion(["familiar", "estudiantil"]),
  contacto: z
    .object({
      nombre: texto(80),
      apellido: texto(80),
      email: texto(120),
      telefono: texto(40),
    })
    .prefault({}),
  estadia: opcion(["dia", "noche"]),
  desde: texto(10),
  hasta: texto(10),
  ingreso: texto(5),
  salida: texto(5),
  familias: z
    .array(
      z.object({
        id: texto(64),
        responsable: persona,
        integrantes: z.array(persona).max(MAX_INTEGRANTES, `Cada familia puede tener hasta ${MAX_INTEGRANTES} integrantes.`).default([]),
      }),
    )
    .max(MAX_FAMILIAS, `Una reserva puede tener hasta ${MAX_FAMILIAS} familias.`)
    .default([]),
  lugares: ids,
  restaurante: opcion(["si", "no"]),
  mesasRestaurante: ids,
  bar: opcion(["si", "no"]),
  mesasBar: ids,
  institucion: texto(120),
  cargo: texto(80),
  estudiantes: texto(4),
  adultos: texto(3),
  cudEstudiantes: texto(4).transform((valor) => valor || "0"),
  edadesGrupo: texto(120),
  notasGrupo: texto(2000),
  responsableInstitucion: persona,
})

export function leerBorrador(cuerpo: unknown): { borrador: Borrador } | { campos: Errores } {
  const resultado = borradorSchema.safeParse(cuerpo)
  if (resultado.success) return { borrador: resultado.data }
  const campos: Errores = {}
  for (const problema of resultado.error.issues) {
    const clave = problema.path.join(".") || "formulario"
    campos[clave] ??= problema.code === "too_big" ? problema.message : "Este dato no es válido."
  }
  return { campos }
}

export async function leerJsonAcotado(request: Request, maximo = MAX_CUERPO_BYTES) {
  const declarado = Number(request.headers.get("content-length") ?? "0")
  if (declarado > maximo || !request.body) return declarado > maximo ? "grande" : "ilegible"

  const lector = request.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await lector.read()
    if (done) break
    total += value.byteLength
    if (total > maximo) {
      await lector.cancel()
      return "grande"
    }
    partes.push(value)
  }

  try {
    return { json: JSON.parse(Buffer.concat(partes).toString("utf8")) as unknown }
  } catch {
    return "ilegible"
  }
}
