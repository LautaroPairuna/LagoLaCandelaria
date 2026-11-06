import { MessageCircle, ScrollText, Ticket } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { Foto } from "@/components/foto"
import { TicketPublico } from "@/components/reserva/ticket-publico"
import { CompartirReglamento } from "@/components/visita/compartir-reglamento"
import { MiReservaAcciones } from "@/components/visita/mi-reserva-acciones"
import { leerAjustes } from "@/lib/ajustes"
import { fechaLarga, hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { contenidoDelSitio } from "@/lib/contenido/leer"
import { enlaceWhatsapp } from "@/lib/contenido/derivados"
import { reglamentoDe } from "@/lib/reglamentos"
import { ticketDeReserva } from "@/lib/reservas"
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

  const { contacto } = await contenidoDelSitio()
  const whatsapp = enlaceWhatsapp(contacto.whatsapp, `Hola, tengo la reserva ${ticket.codigo}. Quiero hacer una consulta.`)
  const reglamento = reglamentoDe(ticket.modulo)
  const viva = ticket.estado !== "CANCELADA"
  const modificable = Boolean(reglamento) && viva && !ticket.ingresado && ticket.desde >= hoyEnElPredio()
  const pagoAnticipado = ticket.modulo === "BUNGALOW" && ticket.estado === "PENDIENTE"
  const transferencia = pagoAnticipado ? await leerAjustes().catch(() => null) : null

  const titulo = modificada ? "Guardamos los cambios." : nuevo ? "Este es tu ticket." : "Tu reserva"
  const bajada = modificada
    ? "Este es tu ticket actualizado: el código y el QR siguen siendo los mismos."
    : nuevo
      ? "Guardalo o descargalo. El equipo del predio revisa la reserva y te confirma por WhatsApp."
      : "Presentá el QR al ingresar. Abajo están el reglamento y los horarios del predio."

  return (
    <main className="bg-foam pt-[var(--site-header)] text-ink">
      <div className="mx-auto max-w-[1180px] space-y-4 px-5 py-4 md:px-8 md:py-6">
        <header className="no-print relative min-h-40 overflow-hidden rounded-[1.7rem] md:min-h-44">
          <Foto
            src="/covers/playa.jpg"
            alt=""
            prioridad
            sizes="(min-width: 1180px) 1120px, 100vw"
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: "center 54%" }}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/52 to-black/15" />
          <div className="relative flex min-h-40 max-w-2xl flex-col justify-center gap-3 px-5 py-5 text-cream sm:px-7 md:min-h-44 md:px-9">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-cream/80 uppercase">Reserva {ticket.codigo}</p>
              <h1 className="font-display mt-1 text-4xl leading-none tracking-tight sm:text-5xl">{titulo}</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/85 sm:text-base">{bajada}</p>
            </div>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 font-bold text-white">
              <MessageCircle className="size-5" aria-hidden />
              Consultas por WhatsApp
            </a>
          </div>
        </header>

        {ticket.estado === "CANCELADA" ? (
          <p className="rounded-2xl bg-destructive/10 px-5 py-4 font-semibold text-destructive" role="status">
            Esta reserva está cancelada. Si es un error, escribinos o llamá al predio.
          </p>
        ) : null}

        {pagoAnticipado ? (
          <section className="no-print rounded-[1.5rem] border-2 border-orange bg-white p-5 md:p-6">
            <p className="kicker">Pago anticipado</p>
            <h2 className="font-display mt-1 text-3xl tracking-tight">Transferí {pesos(ticket.cotizacion.total)} para confirmar el bungalow.</h2>
            {transferencia?.aliasTransferencia ? (
              <dl className="mt-3 space-y-1">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-text-muted">Alias:</dt>
                  <dd className="font-bold tracking-wide">{transferencia.aliasTransferencia}</dd>
                </div>
                {transferencia.titularTransferencia ? (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-text-muted">A nombre de:</dt>
                    <dd className="font-semibold">{transferencia.titularTransferencia}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-2 text-ink/75">Escribinos por WhatsApp y te pasamos los datos para transferir.</p>
            )}
            <a
              href={enlaceWhatsapp(contacto.whatsapp, `Hola, te mando el comprobante de la transferencia de la reserva ${ticket.codigo} (bungalow, ${fechaLarga(ticket.desde).toLowerCase()}).`)}
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

        {/* El ticket y el reglamento van a la par: los dos son lo que hay que tener antes de venir. */}
        <div className={reglamento && viva ? "grid items-start gap-4 lg:grid-cols-2" : "mx-auto max-w-3xl"}>
          <section aria-labelledby="ticket-titulo" className="min-w-0">
            <Encabezado icono={<Ticket className="size-5" aria-hidden />} kicker="Ingreso" titulo="Tu ticket" id="ticket-titulo" />
            <TicketPublico ticket={ticket} enlace={`${urlSitio}/reserva/t/${id}`} />
          </section>
          {reglamento && viva ? (
            <section aria-labelledby="reglamento-titulo" className="no-print min-w-0">
              <Encabezado icono={<ScrollText className="size-5" aria-hidden />} kicker="Antes de venir" titulo="Reglamento y horarios" id="reglamento-titulo" />
              <CompartirReglamento tipo={reglamento} fecha={fechaLarga(ticket.desde).toLowerCase()} enlace={`${urlSitio}/reglamento/${reglamento}`} />
            </section>
          ) : null}
        </div>

        {modificable ? <MiReservaAcciones token={ticket.token} /> : null}
      </div>
    </main>
  )
}

function Encabezado({ icono, kicker, titulo, id }: { icono: ReactNode; kicker: string; titulo: string; id: string }) {
  return (
    <div className="no-print mb-3 flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-orange text-sobre-naranja">{icono}</span>
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-lake-ink uppercase">{kicker}</p>
        <h2 id={id} className="font-display text-2xl leading-none tracking-tight sm:text-3xl">
          {titulo}
        </h2>
      </div>
    </div>
  )
}
