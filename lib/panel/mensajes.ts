import type { Modulo } from "@/generated/prisma/enums"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { reglamentoDe, reglamentos } from "@/lib/reglamentos"
import { urlSitio } from "@/lib/url-sitio"

type ReservaDelMensaje = { nombre: string; codigo: string; desde: string; token: string; modulo: Modulo }

/// El WhatsApp con el ticket que se manda al confirmar. Si el ticket muestra el
/// reglamento, se avisa en negrita (en WhatsApp, entre asteriscos) que también está ahí.
export function mensajeDeConfirmada(reserva: ReservaDelMensaje) {
  const tipo = reglamentoDe(reserva.modulo)
  const queHay = tipo && reglamentos[tipo].conHorarios ? "los horarios y el reglamento del predio" : "el reglamento del predio"
  return [
    `¡Hola ${reserva.nombre}! Tu reserva ${reserva.codigo} en Lago La Candelaria para el ${fechaLargaPanel(reserva.desde).toLowerCase()} quedó confirmada.`,
    `Tu ticket con el QR del ingreso: ${urlSitio}/reserva/t/${reserva.token}`,
    ...(tipo ? [`📌 *En este link también vas a encontrar ${queHay}.*`] : []),
  ].join("\n\n")
}
