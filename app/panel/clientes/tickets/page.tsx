import { CheckCheck, ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesMasivas } from "@/components/panel/acciones-masivas"
import { ElegirFecha } from "@/components/panel/elegir-fecha"
import { EnviarWhatsapp } from "@/components/panel/enviar-whatsapp"
import { EncabezadoDeClientes } from "@/components/panel/pestanas-clientes"
import { TablaDeReservas } from "@/components/panel/tabla-de-reservas"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { llegadasDelDia } from "@/lib/panel/puerta"
import { exigirPanel } from "@/lib/panel/sesion"
import { datosDeReserva, enviosDeTickets, plantillasWhatsapp, whatsappDe } from "@/lib/panel/whatsapp"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"

export const metadata: Metadata = { title: "Tickets QR" }

const hora = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

/// Las reservas confirmadas de un día, para mandarles el ticket con el QR: de a una
/// eligiendo el mensaje, o todas seguidas con el envío guiado.
export default async function TicketsQr({ searchParams }: PageProps<"/panel/clientes/tickets">) {
  await exigirPanel("clientes")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const pedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = pedida && esFechaIso(pedida) ? pedida : sumarDiasIso(hoy, 1)
  const enlace = (dia: string) => `/panel/clientes/tickets?fecha=${dia}`
  const [delDia, plantillas] = await Promise.all([llegadasDelDia(fecha), plantillasWhatsapp()])
  const confirmadas = delDia.filter((llegada) => llegada.estado === "CONFIRMADA" && llegada.desde === fecha)
  const enviados = confirmadas.filter((llegada) => llegada.ticketEnviadoEn).length

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDeClientes
        activa="tickets"
        titulo={fecha === sumarDiasIso(hoy, 1) ? "Tickets de mañana" : fecha === hoy ? "Tickets de hoy" : fechaLargaPanel(fecha)}
        bajada={`${fechaLargaPanel(fecha)} · ${confirmadas.length} ${confirmadas.length === 1 ? "reserva confirmada" : "reservas confirmadas"} que llegan ese día · ${enviados} con el ticket enviado`}
      >
        <nav aria-label="Elegir el día" className="flex items-center gap-2">
          <Link href={enlace(sumarDiasIso(fecha, -1))} aria-label="Día anterior" className="grid size-11 place-items-center rounded-full border border-panel-line bg-white">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <ElegirFecha fecha={fecha} />
          <Link href={enlace(sumarDiasIso(fecha, 1))} aria-label="Día siguiente" className="grid size-11 place-items-center rounded-full border border-panel-line bg-white">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </nav>
      </EncabezadoDeClientes>

      <div className="mt-5">
        <AccionesMasivas aConfirmar={[]} envios={enviosDeTickets(confirmadas, plantillas)} puedeConfirmar={false} />
        <p className="mt-2 text-sm text-panel-muted">
          El envío guiado usa el primer mensaje de ticket de los{" "}
          <Link href="/panel/clientes/mensajes" className="font-semibold text-panel-tostado underline-offset-4 hover:underline">
            mensajes guardados
          </Link>
          ; con el botón de cada reserva se puede elegir otro o retocarlo.
        </p>
      </div>

      {confirmadas.length === 0 ? (
        <p className="mt-5 rounded-3xl bg-white p-6 text-panel-muted shadow-[0_8px_28px_rgba(58,42,24,0.06)]">No hay reservas confirmadas que lleguen ese día.</p>
      ) : (
        <TablaDeReservas
          llegadas={confirmadas}
          hoy={hoy}
          puedeConfirmar
          extra={{
            titulo: "Ticket",
            celda: (llegada) => (
              <div className="space-y-1.5">
                {llegada.ticketEnviadoEn ? (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#1b5e20]">
                    <CheckCheck className="size-4" aria-hidden />
                    Enviado {hora.format(llegada.ticketEnviadoEn)}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-panel-muted">Sin enviar</p>
                )}
                <EnviarWhatsapp
                  tipo="ticket"
                  etiqueta={llegada.ticketEnviadoEn ? "Reenviar" : "Enviar el ticket"}
                  plantillas={plantillas}
                  destinatario={{ reservaId: llegada.id, titular: llegada.titular, whatsapp: whatsappDe(llegada.telefono), datos: datosDeReserva(llegada) }}
                />
              </div>
            ),
          }}
        />
      )}
    </main>
  )
}
