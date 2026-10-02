import { z } from "zod"

import { interestChoices, isInterest } from "@/lib/activities"
import { visitTypes } from "@/lib/site"

export const reservaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Decinos cómo te llamás.")
    .max(80, "El nombre es demasiado largo."),
  email: z
    .string()
    .trim()
    .min(1, "Dejanos un correo.")
    .max(120, "Ese correo es demasiado largo.")
    .email("Ese correo no parece completo."),
  telefono: z
    .string()
    .trim()
    .max(40, "El teléfono es demasiado largo.")
    .refine(
      (value) => (value.match(/\d/g) ?? []).length >= 8,
      "El teléfono necesita al menos 8 números.",
    ),
  visita: z
    .string()
    .min(1, "Elegí qué tipo de visita es.")
    .refine(
      (value) => visitTypes.some((type) => type.value === value),
      "Esa visita no está entre las opciones.",
    ),
  intereses: z
    .array(z.string())
    .min(1, "Marcá al menos una cosa que quieran hacer.")
    .refine(
      (ids) => ids.every((id) => isInterest(id)),
      "Hay una actividad que no reconocemos.",
    ),
  fecha: z.string().refine((value) => {
    if (!value) return true
    const chosen = new Date(`${value}T12:00:00`)
    if (Number.isNaN(chosen.getTime())) return false
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return chosen >= today
  }, "Esa fecha ya pasó. Elegí un día por venir."),
  personas: z
    .string()
    .trim()
    .min(1, "Decinos cuántas personas son.")
    .refine((value) => {
      const count = Number(value)
      return Number.isInteger(count) && count >= 1 && count <= 400
    }, "Tiene que ser un número entero entre 1 y 400."),
  institucion: z
    .string()
    .trim()
    .max(120, "El nombre de la institución es demasiado largo."),
  mensaje: z
    .string()
    .trim()
    .max(800, "El mensaje es muy largo. Dejalo en unas líneas."),
})

const emptyReserva = {
  nombre: "",
  email: "",
  telefono: "",
  visita: "",
  fecha: "",
  personas: "",
  institucion: "",
  mensaje: "",
  intereses: [] as string[],
}

export function prepareReservaBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return emptyReserva
  const record = body as Record<string, unknown>
  return {
    nombre: typeof record.nombre === "string" ? record.nombre : "",
    email: typeof record.email === "string" ? record.email : "",
    telefono: typeof record.telefono === "string" ? record.telefono : "",
    visita: typeof record.visita === "string" ? record.visita : "",
    fecha: typeof record.fecha === "string" ? record.fecha : "",
    personas: typeof record.personas === "string" ? record.personas : "",
    institucion: typeof record.institucion === "string" ? record.institucion : "",
    mensaje: typeof record.mensaje === "string" ? record.mensaje : "",
    intereses: Array.isArray(record.intereses)
      ? record.intereses.filter((item): item is string => typeof item === "string")
      : [],
  }
}

export function humanFieldMessage(message: string) {
  if (/invalid input|expected |received |zod|undefined/i.test(message)) {
    return "Este dato no es válido."
  }
  return message
}

export type ReservaInput = z.infer<typeof reservaSchema>

export function visitLabel(value: string) {
  return visitTypes.find((type) => type.value === value)?.label ?? value
}

export const reservaMessages = {
  invalid: "Revisá los datos marcados antes de enviar la consulta.",
  duplicate: "Ya tenemos una consulta igual. Si querés cambiarla, llamá al predio.",
  unavailable: "El sistema de reservas no responde. Intentá en un rato o llamá al predio.",
  saveFailed: "No pudimos guardar la consulta. Intentá de nuevo en un momento.",
  unreadable: "No pudimos leer la consulta. Volvé a completarla.",
  offline: "No llegamos al predio. Revisá la conexión e intentá de nuevo.",
  saved: "Recibimos la consulta. La fecha se confirma con el equipo.",
} as const

export function visitorMessage(message: string | undefined, status: number) {
  const technical = !message || message.length > 180 || /prisma|sql|stack|exception|at \//i.test(message)
  if (!technical) return message
  if (status === 409) return reservaMessages.duplicate
  if (status === 503) return reservaMessages.unavailable
  if (status === 400) return reservaMessages.invalid
  return reservaMessages.saveFailed
}

export function toInquiry(data: ReservaInput) {
  const labels = data.intereses.map(
    (id) => interestChoices.find((choice) => choice.id === id)?.label ?? id,
  )
  const lines = [
    `Personas: ${data.personas}`,
    data.institucion ? `Institución: ${data.institucion}` : "",
    `Quieren: ${labels.join(", ")}`,
    data.mensaje,
  ].filter(Boolean)

  return {
    name: data.nombre,
    contact: `${data.email} · ${data.telefono}`,
    groupType: visitLabel(data.visita),
    date: data.fecha ? new Date(`${data.fecha}T00:00:00.000Z`) : null,
    message: lines.join("\n"),
  }
}

export function resumenTexto(data: ReservaInput, intereses: string[]) {
  const lines = [
    "Consulta Lago La Candelaria",
    `Nombre: ${data.nombre}`,
    `Correo: ${data.email}`,
    `Teléfono: ${data.telefono}`,
    `Visita: ${visitLabel(data.visita)}`,
    `Personas: ${data.personas}`,
    `Fecha tentativa: ${data.fecha || "sin fecha todavía"}`,
    `Institución: ${data.institucion || "—"}`,
    `Intereses: ${intereses.join(", ")}`,
    data.mensaje ? `Mensaje: ${data.mensaje}` : "",
  ]
  return lines.filter(Boolean).join("\n")
}
