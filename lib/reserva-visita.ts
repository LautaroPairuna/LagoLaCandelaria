import { z } from "zod"

import { dniValido, limpiarDni } from "@/lib/predio/contacto"
import { HORARIO_RESTAURANTE, type Franja } from "@/lib/predio/horario"
import { contacto, nombre } from "@/lib/reserva-familia"

/// Lo que se pide en la web para el finde en familia, los bungalows y el nado: las
/// cantidades por edad y los datos de quien reserva, nada más del resto del grupo.

export const MAX_PERSONAS_WEB = 99
export const MAX_PERSONAS_BUNGALOWS = 16
/// El nado se reserva por hasta 3 horas seguidas, entre las 10 y las 19.
export const MAX_HORAS_DE_NADO = 3

export const formasDePagoWeb = ["EFECTIVO", "TRANSFERENCIA"] as const
export type FormaDePagoWeb = (typeof formasDePagoWeb)[number]

const cantidad = (maximo: number) => z.number("Revisá la cantidad.").int("Revisá la cantidad.").min(0, "Revisá la cantidad.").max(maximo, "Revisá la cantidad.")

export const grupoWeb = z
  .object({ adultos: cantidad(MAX_PERSONAS_WEB), menores: cantidad(MAX_PERSONAS_WEB), sinCargo: cantidad(30) })
  .refine((grupo) => grupo.adultos >= 1, { path: ["adultos"], message: "Tiene que venir al menos un adulto." })
  .refine((grupo) => grupo.adultos + grupo.menores + grupo.sinCargo <= MAX_PERSONAS_WEB, {
    path: ["adultos"],
    message: `Para más de ${MAX_PERSONAS_WEB} personas escribinos por WhatsApp.`,
  })

export const titularWeb = z.object({
  nombre,
  apellido: nombre,
  dni: z
    .string()
    .transform(limpiarDni)
    .refine(dniValido, "El DNI tiene 7 u 8 números, sin puntos."),
  notas: z.string().trim().max(200, "Es muy largo: resumilo en 200 letras.").optional(),
})

export const formaDePagoWeb = z.enum(formasDePagoWeb, "Elegí cómo vas a pagar: efectivo o transferencia.")

export function esFranjaDeNado(franja: Franja) {
  return (
    Number.isInteger(franja.desde) &&
    Number.isInteger(franja.hasta) &&
    franja.desde >= HORARIO_RESTAURANTE.abre &&
    franja.hasta <= HORARIO_RESTAURANTE.cierra &&
    franja.hasta > franja.desde &&
    franja.hasta - franja.desde <= MAX_HORAS_DE_NADO
  )
}

export const franjaDeNado = z
  .object({ desde: z.number(), hasta: z.number() })
  .refine(esFranjaDeNado, `Elegí de 1 a ${MAX_HORAS_DE_NADO} horas seguidas, entre las 10 y las 19.`)

export { contacto }

export type GrupoWeb = z.infer<typeof grupoWeb>
export type TitularWeb = z.input<typeof titularWeb>
