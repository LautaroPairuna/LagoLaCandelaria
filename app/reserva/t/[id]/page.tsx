import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TicketPublico } from "@/components/reserva/ticket-publico"
import { reservaPorToken } from "@/lib/reservas"
import { urlSitio } from "@/lib/url-sitio"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ticket de reserva",
  description: "Solicitud de reserva de Lago La Candelaria, con el código QR del ingreso.",
  robots: { index: false, follow: false },
}

export default async function TicketPage({ params }: PageProps<"/reserva/t/[id]">) {
  const { id } = await params
  if (!/^[a-z0-9]{20,40}$/i.test(id)) notFound()

  let reserva: Awaited<ReturnType<typeof reservaPorToken>> = null
  try {
    reserva = await reservaPorToken(id)
  } catch {
    return (
      <main className="bg-foam px-5 py-32 text-ink md:px-8">
        <div className="mx-auto max-w-xl">
          <p className="kicker">Ticket</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight">No pudimos abrir esta solicitud.</h1>
          <p className="mt-3 leading-relaxed text-ink/75">
            Probá de nuevo en un rato o llamá al predio con el código del ticket.
          </p>
        </div>
      </main>
    )
  }

  if (!reserva) notFound()

  return (
    <main className="bg-foam px-5 pt-28 pb-16 text-ink md:px-8 md:pt-32">
      <div className="mx-auto max-w-3xl">
        {reserva.estado === "CANCELADA" ? (
          <p className="mb-6 rounded-2xl bg-destructive/10 px-5 py-4 font-semibold text-destructive" role="status">
            Esta reserva está cancelada. Si es un error, llamá al predio.
          </p>
        ) : null}
        <TicketPublico solicitud={reserva.solicitud} enlace={`${urlSitio}/reserva/t/${id}`} />
      </div>
    </main>
  )
}
