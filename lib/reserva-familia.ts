import { z } from "zod"

import { dniValido, limpiarDni, normalizarTelefono } from "@/lib/predio/contacto"

export const EDAD_ADULTO = 13
export const MAYORIA_DE_EDAD = 18
export const MAX_FAMILIAS = 10

export const nombre = z
  .string()
  .trim()
  .min(2, "Escribilo completo, con al menos 2 letras.")
  .max(40, "Es muy largo: dejalo en 40 letras o menos.")
  .regex(/^[\p{L}' -]+$/u, "Escribilo solo con letras, sin números ni símbolos.")

export const telefono = z.string().transform((valor, contexto) => {
  const normalizado = normalizarTelefono(valor)
  if (!normalizado) {
    contexto.addIssue({ code: "custom", message: "Característica y número, 10 dígitos en total (por ejemplo 11 3009 1020)." })
    return z.NEVER
  }
  return normalizado.e164
})

export const email = z
  .string()
  .trim()
  .max(120, "Ese correo es muy largo.")
  .email("Ese correo no parece completo: revisá que tenga @ y el dominio.")
  .or(z.literal(""))
  .optional()

const notas = z.string().trim().max(200, "Es muy largo: resumilo en 200 letras.").optional()
// La edad vacía llega como null: el preprocess deja que el mensaje sea "Escribí la edad".
const edad = (minimo: number, maximo: number, menor: string, mayor: string) =>
  z.preprocess((valor) => valor, z.number({ error: "Escribí la edad." }).int("Escribí la edad en años.").min(minimo, menor).max(maximo, mayor))

const adulto = z
  .object({
    nombre,
    apellido: nombre,
    edad: edad(EDAD_ADULTO, 110, `Si tiene menos de ${EDAD_ADULTO}, sumalo como niño.`, "Revisá la edad."),
    dni: z.string().transform(limpiarDni),
    notas,
  })
  .superRefine((persona, contexto) => {
    const obligatorio = persona.edad >= MAYORIA_DE_EDAD
    if ((obligatorio || persona.dni) && !dniValido(persona.dni)) {
      contexto.addIssue({ code: "custom", path: ["dni"], message: obligatorio ? "El DNI tiene 7 u 8 números, sin puntos." : "Revisá el DNI: 7 u 8 números, o dejalo vacío." })
    }
  })

const nino = z.object({
  nombre,
  apellido: nombre,
  edad: edad(0, EDAD_ADULTO - 1, "Revisá la edad.", `Desde los ${EDAD_ADULTO} años va como adulto.`),
  notas,
})

export const familia = z
  .object({ adultos: z.array(adulto).min(1, "Cada familia necesita al menos un adulto.").max(30), ninos: z.array(nino).max(30) })
  .superRefine((grupo, contexto) => {
    if (grupo.adultos.length && !grupo.adultos.some((persona) => persona.edad >= MAYORIA_DE_EDAD)) {
      contexto.addIssue({ code: "custom", path: ["adultos", 0, "edad"], message: `En cada familia tiene que venir al menos una persona de ${MAYORIA_DE_EDAD} años o más.` })
    }
  })

export const familias = z.array(familia).min(1, "Sumá al menos una familia.").max(MAX_FAMILIAS, `Por la web se pueden cargar hasta ${MAX_FAMILIAS} familias.`)

export const contacto = z.object({ telefono, email })

export type FamiliaValida = z.infer<typeof familia>

/// Todas las personas en orden, con su familia y quién es el responsable de cada una
/// (el primer adulto mayor de edad).
export function personasDe(grupos: FamiliaValida[]) {
  return grupos.flatMap((grupo, indice) => {
    const responsable = grupo.adultos.findIndex((persona) => persona.edad >= MAYORIA_DE_EDAD)
    return [
      ...grupo.adultos.map((persona, posicion) => ({ ...persona, familia: indice + 1, responsable: posicion === responsable })),
      ...grupo.ninos.map((persona) => ({ ...persona, dni: "", familia: indice + 1, responsable: false })),
    ]
  })
}
