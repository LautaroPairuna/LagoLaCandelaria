export const reservaMessages = {
  invalid: "Revisá los datos marcados antes de enviar la consulta.",
  duplicate: "Ya tenemos una consulta igual. Si querés cambiarla, llamá al predio.",
  unavailable: "El sistema de reservas no responde. Intentá en un rato o llamá al predio.",
  saveFailed: "No pudimos guardar la consulta. Intentá de nuevo en un momento.",
  unreadable: "No pudimos leer la consulta. Volvé a completarla.",
  offline: "No llegamos al predio. Revisá la conexión e intentá de nuevo.",
  saved: "Recibimos la consulta. La fecha se confirma con el equipo.",
  tooMany: "Recibimos muchas solicitudes desde tu conexión. Esperá unos minutos o llamá al predio.",
} as const

export function visitorMessage(message: string | undefined, status: number) {
  const technical = !message || message.length > 180 || /prisma|sql|stack|exception|at \//i.test(message)
  if (!technical) return message
  if (status === 409) return reservaMessages.duplicate
  if (status === 429) return reservaMessages.tooMany
  if (status === 503) return reservaMessages.unavailable
  if (status === 400 || status === 413) return reservaMessages.invalid
  return reservaMessages.saveFailed
}
