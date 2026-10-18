import { MessageCircle } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TicketPublico } from "@/components/reserva/ticket-publico"
import { CompartirReglamento } from "@/components/visita/compartir-reglamento"
import { MiReservaAcciones } from "@/components/visita/mi-reserva-acciones"
import { leerAjustes } from "@/lib/ajustes"
import { fechaLarga, hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { reglamentoDe } from "@/lib/reglamentos"
import { ticketDeReserva } from "@/lib/reservas"
import { enlaceWhatsappDelPredio } from "@/lib/site"
import { urlSitio } from "@/lib/url-sitio"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ticket de reserva",
  description: "Reserva de Lago La Candelaria, con el código QR del ingreso.",
  robots: { index: false, follow: false },
}

export default async function TicketPage({ params, searchParams }: PageProps<"/reserva/t/[id]">) {
  const { id } = await params
  const { nuevo, modificada } = await searchParams
  if (!/^[a-z0-9]{20,40}$/i.test(id)) notFound()

  let ticket: Awaited<ReturnType<typeof ticketDeReserva>> = null
  try {
    ticket = await ticketDeReserva(id)
  } catch {
    return (
      <main className="bg-foam px-5 py-32 text-ink md:px-8">
        <div className="mx-auto max-w-xl">
          <p className="kicker">Ticket</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight">No pudimos abrir esta reserva.</h1>
          <p className="mt-3 leading-relaxed text-ink/75">Probá de nuevo en un rato o llamá al predio con el código del ticket.</p>
        </div>
      </main>
    )
  }

  if (!ticket) notFound()

  const whatsapp = enlaceWhatsappDelPredio(`Hola, tengo la reserva ${ticket.codigo}. Quiero hacer una consulta.`)
  const reglamento = reglamentoDe(ticket.modulo)
  const viva = ticket.estado !== "CANCELADA"
  const modificable = Boolean(reglamento) && viva && !ticket.ingresado && ticket.desde >= hoyEnElPredio()
  const pagoAnticipado = ticket.modulo === "BUNGALOW" && ticket.estado === "PENDIENTE"
  const transferencia = pagoAnticipado ? await leerAjustes().catch(() => null) : null

  return (
    <main className="bg-foam px-5 pt-28 pb-16 text-ink md:px-8 md:pt-32">
      <div className="mx-auto max-w-3xl space-y-6">
        {ticket.estado === "CANCELADA" ? (
          <p className="rounded-2xl bg-destructive/10 px-5 py-4 font-semibold text-destructive" role="status">
            Esta reserva está cancelada. Si es un error, escribinos o llamá al predio.
          </p>
        ) : modificada ? (
          <div className="no-print">
            <p className="kicker">Reserva modificada</p>
            <h1 className="font-display mt-2 text-4xl tracking-tight md:text-5xl">Guardamos los cambios.</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/75">Este es tu ticket actualizado: el código y el QR siguen siendo los mismos.</p>
          </div>
        ) : nuevo ? (
          <div className="no-print">
            <p className="kicker">Reserva registrada</p>
            <h1 className="font-display mt-2 text-4xl tracking-tight md:text-5xl">Este es tu ticket.</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/75">
              Guardalo o descargalo. El equipo del predio revisa la reserva y te confirma por WhatsApp.
            </p>
          </div>
        ) : null}
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="no-print inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white"
        >
          <MessageCircle className="size-5" aria-hidden />
          Consultas por WhatsApp
        </a>
        {pagoAnticipado ? (
          <section className="no-print rounded-[1.6rem] border-2 border-orange bg-white p-5 md:p-6">
            <p className="kicker">Pago anticipado</p>
            <h2 className="font-display mt-1 text-3xl tracking-tight">Transferí {pesos(ticket.cotizacion.total)} para confirmar el bungalow.</h2>
            {transferencia?.aliasTransferencia ? (
              <dl className="mt-3 space-y-1">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-ink/60">Alias:</dt>
                  <dd className="font-bold tracking-wide">{transferencia.aliasTransferencia}</dd>
                </div>
                {transferencia.titularTransferencia ? (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-ink/60">A nombre de:</dt>
                    <dd className="font-semibold">{transferencia.titularTransferencia}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-2 text-ink/75">Escribinos por WhatsApp y te pasamos los datos para transferir.</p>
            )}
            <a
              href={enlaceWhatsappDelPredio(`Hola, te mando el comprobante de la transferencia de la reserva ${ticket.codigo} (bungalow, ${fechaLarga(ticket.desde).toLowerCase()}).`)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white"
            >
              <MessageCircle className="size-5" aria-hidden />
              Mandar el comprobante por WhatsApp
            </a>
            <p className="mt-3 text-sm text-ink/65">La reserva queda confirmada cuando el predio recibe el pago.</p>
          </section>
        ) : null}
        <TicketPublico ticket={ticket} enlace={`${urlSitio}/reserva/t/${id}`} />
        {modificable ? <MiReservaAcciones token={ticket.token} /> : null}
        {reglamento && viva ? <CompartirReglamento tipo={reglamento} fecha={fechaLarga(ticket.desde).toLowerCase()} enlace={`${urlSitio}/reglamento/${reglamento}`} /> : null}
      </div>
    </main>
  )
}
