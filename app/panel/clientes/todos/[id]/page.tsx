import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EnviarWhatsapp } from "@/components/panel/enviar-whatsapp"
import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado"
import { resumenDeAsistencia } from "@/lib/panel/asistencia"
import { estadoVisible } from "@/lib/panel/estados"
import { rangoConMesPanel } from "@/lib/panel/formato"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { fichaDeCliente, plantillasWhatsapp, whatsappDe } from "@/lib/panel/whatsapp"
import { deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Cliente" }

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
const cuando = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" })
const nombreDeContacto: Record<string, string> = { confirmacion: "Pedido de confirmación", ticket: "Ticket", libre: "Mensaje" }

/// Un cliente con todas sus reservas y los WhatsApp que se le mandaron desde el panel.
export default async function FichaDeCliente({ params }: PageProps<"/panel/clientes/todos/[id]">) {
  await exigirPanel("clientes")
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero) || numero < 1) notFound()
  const [cliente, plantillas] = await Promise.all([fichaDeCliente(numero), plantillasWhatsapp()])
  if (!cliente) notFound()

  const vigentes = cliente.reservas.filter((reserva) => reserva.estado !== "CANCELADA")
  const pagado = vigentes.reduce((suma, reserva) => suma + reserva.pagos.reduce((parcial, pago) => parcial + pago.importe, 0), 0)
  const nombre = `${cliente.nombre} ${cliente.apellido}`
  const hoy = hoyEnElPredio()

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Link href="/panel/clientes/todos" className="inline-flex items-center gap-2 text-sm font-semibold text-panel-muted hover:text-panel-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a Clientes
      </Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Cliente</p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">{nombre}</h1>
          <p className="mt-1 text-sm text-panel-muted">
            {[cliente.dni ? `DNI ${cliente.dni}` : null, cliente.telefono, cliente.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
          </p>
        </div>
        <EnviarWhatsapp
          tipo="libre"
          etiqueta="Escribir por WhatsApp"
          className="h-11 px-5"
          plantillas={plantillas}
          destinatario={{ clienteId: cliente.id, titular: nombre, whatsapp: whatsappDe(cliente.telefono), datos: { nombre: cliente.nombre } }}
        />
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { termino: "Reservas", valor: String(vigentes.length) },
          { termino: "Canceladas", valor: String(cliente.reservas.length - vigentes.length) },
          { termino: "Pagó en total", valor: pesos(pagado) },
          { termino: "Cliente desde", valor: cliente.creadoEn.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) },
        ].map((dato) => (
          <div key={dato.termino} className={cn("rounded-2xl bg-white px-4 py-3", sombra)}>
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{dato.termino}</dt>
            <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label="Reservas" className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}>
          <h2 className="font-display text-2xl tracking-tight">Reservas</h2>
          <ul className="mt-2 divide-y divide-panel-line">
            {cliente.reservas.map((reserva) => {
              const desde = deFechaDb(reserva.desde)
              return (
                <li key={reserva.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/panel/reservas/${reserva.id}`} className="font-semibold hover:underline">
                      {rangoConMesPanel(desde, deFechaDb(reserva.hasta))} · {nombreDelModulo[reserva.modulo]}
                    </Link>
                    <p className="text-sm text-panel-muted">
                      {reserva.codigo} · {reserva.adultos + reserva.menores + reserva.sinCargo} personas · {pesos(reserva.total)}
                    </p>
                  </div>
                  <InsigniaDeEstado estado={estadoVisible(reserva.estado, resumenDeAsistencia({ ...reserva, hasta: deFechaDb(reserva.hasta) }, hoy).asistencia)} />
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-label="WhatsApp enviados" className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}>
          <h2 className="font-display text-2xl tracking-tight">WhatsApp enviados</h2>
          {cliente.contactos.length === 0 ? (
            <p className="mt-2 text-sm text-panel-muted">Todavía no se le escribió desde el panel.</p>
          ) : (
            <ul className="mt-2 divide-y divide-panel-line text-sm">
              {cliente.contactos.map((contacto) => (
                <li key={contacto.id} className="py-2">
                  <p className="font-semibold">
                    {nombreDeContacto[contacto.tipo] ?? contacto.tipo}
                    {contacto.plantilla ? ` · ${contacto.plantilla}` : ""}
                    {contacto.reserva ? ` · ${contacto.reserva.codigo}` : ""}
                  </p>
                  <p className="text-panel-muted">
                    {cuando.format(contacto.creadoEn)}
                    {contacto.por ? ` · ${contacto.por}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
