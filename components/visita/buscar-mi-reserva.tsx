"use client"

import Link from "next/link"
import { CalendarDays, MapPin, Search, Ticket, UsersRound } from "lucide-react"
import { useState, useTransition } from "react"

import { buscarMiReserva } from "@/app/(sitio)/mi-reserva/acciones"
import { Campo } from "@/components/reserva/campo"
import { BotonDescargarTicket } from "@/components/reserva/ticket-acciones"
import { Button } from "@/components/ui/button"
import { avisarError, llamar } from "@/lib/avisos"
import type { TicketDatos } from "@/lib/reservas"
import { filasDelTicket } from "@/lib/ticket"

export function BuscarMiReserva() {
  const [identificador, setIdentificador] = useState("")
  const [error, setError] = useState("")
  const [resultado, setResultado] = useState<{ token: string; ticket: TicketDatos } | null>(null)
  const [buscando, iniciar] = useTransition()

  function buscar(evento: React.FormEvent) {
    evento.preventDefault()
    setError("")
    iniciar(async () => {
      const respuesta = await llamar(() => buscarMiReserva({ identificador }))
      if (respuesta.ok) {
        setResultado({ token: respuesta.token, ticket: respuesta.ticket })
        return
      }
      setResultado(null)
      setError(respuesta.error)
      avisarError(respuesta.error)
    })
  }

  return (
    <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-[0.95fr_1.05fr]">
      <ResumenReserva resultado={resultado} />

      <form onSubmit={buscar} className="min-w-0 rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-[0_14px_38px_rgba(58,53,48,0.06)] md:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-orange text-sobre-naranja">
            <Search className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-lake-ink uppercase">Buscar</p>
            <h2 className="font-display text-2xl leading-none tracking-tight sm:text-3xl">Encontrá tu reserva</h2>
          </div>
        </div>
        <div className="mt-4">
          <Campo
            id="identificador"
            etiqueta="Código de reserva o DNI"
            placeholder="LC-AB12CD o 30123456"
            valor={identificador}
            onChange={(valor) => setIdentificador(valor.toUpperCase().replace(/\s/g, "").slice(0, 11))}
          />
        </div>
        {error ? (
          <p className="mt-3 rounded-xl bg-[#fde8e4] px-4 py-2.5 text-sm font-semibold text-[#a0261b]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={buscando || !identificador} className="mt-4 h-11 w-full px-6 text-base">
          {buscando ? "Buscando…" : "Mostrar mi reserva"}
        </Button>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          Ingresá uno solo de los dos datos: el código del ticket o el DNI usado al reservar.
        </p>
      </form>
    </div>
  )
}

const nombreDelEstado: Record<TicketDatos["estado"], string> = { PENDIENTE: "A confirmar", CONFIRMADA: "Confirmada", CANCELADA: "Cancelada" }

function ResumenReserva({ resultado }: { resultado: { token: string; ticket: TicketDatos } | null }) {
  const filas = resultado ? filasDelTicket(resultado.ticket) : []
  const buscarFila = (termino: string) => filas.find(([nombre]) => nombre === termino)?.[1]
  const personas = resultado
    ? resultado.ticket.grupo.adultos + resultado.ticket.grupo.menores + resultado.ticket.grupo.sinCargo
    : 0
  const enlace = resultado ? `/reserva/t/${resultado.token}` : ""

  return (
    <section className="min-w-0 rounded-[1.5rem] border border-ink/10 bg-[#f4eadb] p-5 shadow-[0_14px_38px_rgba(58,53,48,0.06)] md:p-6" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lake text-white">
            <Ticket className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.14em] text-lake-ink uppercase">Tu reserva</p>
            <h2 className="font-display truncate text-2xl leading-none tracking-tight sm:text-3xl">
              {resultado ? resultado.ticket.codigo : "Todavía no cargada"}
            </h2>
          </div>
        </div>
        {resultado ? (
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-lake-ink ring-1 ring-ink/10">
            {nombreDelEstado[resultado.ticket.estado]}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-3">
        <Dato icono={CalendarDays} termino="Fecha" detalle={resultado ? buscarFila("Llegada") ?? "Ver ticket" : "—"} />
        <Dato icono={UsersRound} termino="Personas" detalle={resultado ? String(personas) : "—"} />
        <Dato icono={MapPin} termino="Lugar" detalle={resultado ? buscarFila("Lugar") ?? buscarFila("Propuesta") ?? "Ver ticket" : "—"} />
      </dl>

      {resultado ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <BotonDescargarTicket
            ticket={resultado.ticket}
            enlace={`${window.location.origin}${enlace}`}
            className="h-11 flex-1"
          />
          <Button render={<Link href={enlace} />} variant="outline" className="h-11 flex-1 bg-white">
            Abrir reserva completa
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Button type="button" disabled className="h-11 w-full">
            Descargar ticket
          </Button>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Cuando encontremos la reserva, vas a ver acá la fecha, las personas y el lugar.
          </p>
        </div>
      )}
    </section>
  )
}

function Dato({ icono: Icono, termino, detalle }: { icono: typeof CalendarDays; termino: string; detalle: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/75 px-3 py-2.5 ring-1 ring-ink/8">
      <dt className="flex items-center gap-1.5 text-[0.67rem] font-bold tracking-[0.1em] text-text-muted uppercase">
        <Icono className="size-3.5" aria-hidden />
        {termino}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold" title={detalle}>{detalle}</dd>
    </div>
  )
}
