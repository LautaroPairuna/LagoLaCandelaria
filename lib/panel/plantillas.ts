/// Los mensajes de WhatsApp guardados y cómo se arman para cada cliente. Sin base de
/// datos: lo usa también el navegador para mostrar el mensaje antes de enviarlo.

export const tiposDePlantilla = [
  { id: "confirmacion", nombre: "Confirmación del día anterior" },
  { id: "ticket", nombre: "Ticket con el QR" },
  { id: "libre", nombre: "Otros mensajes" },
] as const

export type TipoDePlantilla = (typeof tiposDePlantilla)[number]["id"]
export type Plantilla = { id: number; tipo: TipoDePlantilla; nombre: string; texto: string }

export const marcas = [
  { marca: "{nombre}", explicacion: "el nombre de quien reservó" },
  { marca: "{codigo}", explicacion: "el código de la reserva" },
  { marca: "{fecha}", explicacion: "el día de la reserva" },
  { marca: "{ticket}", explicacion: "el enlace al ticket (también sirve para cancelar)" },
  { marca: "{reglamento}", explicacion: "el aviso de que el ticket trae el reglamento, si corresponde" },
] as const

/// Las que se crean la primera vez, iguales a los mensajes que ya usaba el predio.
export const plantillasIniciales: Omit<Plantilla, "id">[] = [
  {
    tipo: "confirmacion",
    nombre: "Confirmación",
    texto: "¡Hola {nombre}! Te escribimos de Lago La Candelaria para que nos confirmes tu presencia el día de mañana, saludos.\n\nSi no pueden venir, pueden cancelar la reserva desde acá: {ticket}",
  },
  {
    tipo: "ticket",
    nombre: "Ticket confirmado",
    texto: "¡Hola {nombre}! Tu reserva {codigo} en Lago La Candelaria para el {fecha} quedó confirmada.\n\nTu ticket con el QR del ingreso: {ticket}\n\n{reglamento}",
  },
  { tipo: "libre", nombre: "Saludo", texto: "¡Hola {nombre}! Te escribimos de Lago La Candelaria." },
]

/// Lo que se sabe del destinatario. Un cliente sin reserva no tiene código, fecha ni ticket.
export type DatosDelMensaje = { nombre: string; codigo?: string; fecha?: string; ticket?: string; reglamento?: string }

/// Reemplaza las marcas y limpia los renglones que quedaron vacíos (por ejemplo, el del
/// reglamento en una propuesta que no lo tiene).
export function armarMensaje(texto: string, datos: DatosDelMensaje) {
  const valores: Record<string, string> = {
    "{nombre}": datos.nombre,
    "{codigo}": datos.codigo ?? "",
    "{fecha}": datos.fecha ?? "",
    "{ticket}": datos.ticket ?? "",
    "{reglamento}": datos.reglamento ?? "",
  }
  return texto
    .replace(/\{(nombre|codigo|fecha|ticket|reglamento)\}/g, (marca) => valores[marca] ?? marca)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function enlaceDeWhatsapp(telefono: string, texto: string) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
}
