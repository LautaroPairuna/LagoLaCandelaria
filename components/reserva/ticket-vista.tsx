import { LogoMark } from "@/components/logo-mark"
import { textoDelEfectivo, textoDelTotal } from "@/lib/predio/cotizacion"
import { pesos } from "@/lib/predio/tarifas"
import type { TicketDatos } from "@/lib/reservas"
import { phones } from "@/lib/site"
import { esGrupo, filasDelTicket, titularDelTicket } from "@/lib/ticket"

function Fila({ termino, detalle }: { termino: string; detalle: string }) {
  return (
    <div className="grid gap-1 border-t border-ink/10 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold tracking-[0.14em] text-ink/50 uppercase">{termino}</dt>
      <dd className="text-ink">{detalle}</dd>
    </div>
  )
}

export function TicketVista({ ticket, qrDataUrl, enlace }: { ticket: TicketDatos; qrDataUrl?: string; enlace?: string }) {
  const grupo = esGrupo(ticket)
  const notas = ticket.personas.filter((persona) => persona.notas || persona.cud)

  return (
    <article className="ticket-sheet overflow-hidden rounded-[1.8rem] border border-ink/10 bg-white text-ink shadow-[0_18px_50px_rgba(58,53,48,0.08)]">
      <div className="flex items-center justify-between gap-4 bg-cream px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-14" />
          <div>
            <p className="kicker">{grupo ? "Pedido de servicio" : "Reserva"} N.º {ticket.numero}</p>
            <p className="font-display text-lg tracking-tight">Lago La Candelaria</p>
          </div>
        </div>
        <p className="font-display text-2xl tracking-tight text-lake-ink md:text-3xl">{ticket.codigo}</p>
      </div>

      <div className="grid gap-6 px-5 py-6 md:grid-cols-[180px_1fr] md:px-8">
        <div className="grid place-items-center rounded-2xl bg-cream p-3">
          {qrDataUrl ? (
            // El QR se genera en el momento, no es una imagen del sitio.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`Código QR de la reserva ${ticket.codigo}`} className="size-40" />
          ) : (
            <p className="px-3 text-center text-sm text-ink/60">Generando el código QR…</p>
          )}
        </div>
        <div>
          <h2 className="font-display text-4xl tracking-tight">Mostrá este ticket en el ingreso.</h2>
          <p className="mt-2 leading-relaxed text-ink/75">
            En la puerta escanean el QR y ven esta misma reserva.
            {ticket.estado === "PENDIENTE" ? " El equipo del predio la revisa y te confirma por WhatsApp." : ""}
            {enlace ? ` ${enlace}` : ""}
          </p>
        </div>
      </div>

      <div className="px-5 pb-8 md:px-8">
        <h3 className="font-display text-2xl tracking-tight">La visita</h3>
        <dl>
          {filasDelTicket(ticket).map(([termino, detalle]) => (
            <Fila key={termino} termino={termino} detalle={detalle} />
          ))}
        </dl>

        {ticket.personas.length > 1 ? (
          <>
            <h3 className="font-display mt-8 text-2xl tracking-tight">Quién ingresa</h3>
            <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
              {ticket.personas.map((persona, indice) => (
                <li key={`${persona.dni ?? persona.nombre}-${indice}`} className="py-3">
                  <p className="font-semibold">
                    {persona.nombre} {persona.apellido}
                    {persona.responsable ? ` · Responsable familia ${persona.familia}` : ""}
                  </p>
                  <p className="text-sm text-ink/70">
                    {persona.dni ? `DNI ${persona.dni} · ` : ""}
                    {persona.edad} años
                    {persona.cud ? " · Certificado CUD, no abona el ingreso" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {notas.length > 0 ? (
          <div className="mt-6 rounded-2xl bg-earth-soft px-4 py-4">
            <p className="kicker">Para el personal del predio</p>
            <ul className="mt-2 space-y-1 text-sm">
              {notas.map((persona, indice) => (
                <li key={indice}>
                  {persona.nombre} {persona.apellido}: {persona.notas || "certificado CUD"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <h3 className="font-display mt-8 text-2xl tracking-tight">Total</h3>
        <dl>
          {ticket.cotizacion.lineas.map((linea) => (
            <Fila key={`${linea.concepto}-${linea.detalle}`} termino={linea.concepto} detalle={ticket.cotizacion.consumo ? linea.detalle : `${linea.detalle} · ${pesos(linea.importe)}`} />
          ))}
        </dl>
        <p className="font-display mt-4 text-4xl tracking-tight">{textoDelTotal(ticket.cotizacion)}</p>
        {textoDelEfectivo(ticket.cotizacion) ? <p className="mt-1 font-semibold">{textoDelEfectivo(ticket.cotizacion)}</p> : null}
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
          {grupo
            ? "Es un pedido de servicio: el predio arma el presupuesto y la reserva se confirma con el pago del 50 %."
            : ticket.cotizacion.consumo
              ? "No se cobra nada por la web. En el restaurante se paga lo que consuman."
              : "No se cobra nada por la web. El pago se hace en el predio, cuando llegan."}
        </p>

        <h3 className="font-display mt-8 text-2xl tracking-tight">Quién hizo la reserva</h3>
        <dl>
          {ticket.institucion ? <Fila termino="Institución" detalle={ticket.institucion} /> : null}
          <Fila
            termino="Responsable"
            detalle={`${titularDelTicket(ticket)}${ticket.cargo ? ` · ${ticket.cargo}` : ""}${ticket.titular.dni ? ` · DNI ${ticket.titular.dni}` : ""}`}
          />
          {ticket.contacto.telefono ? <Fila termino="Teléfono" detalle={ticket.contacto.telefono} /> : null}
          {ticket.contacto.email ? <Fila termino="Correo" detalle={ticket.contacto.email} /> : null}
        </dl>

        <p className="mt-8 text-sm text-ink/60">
          Para consultas o para cambiar la cantidad de personas, escribinos por WhatsApp o llamá al{" "}
          {phones.map((phone) => phone.label).join(" o al ")}.
        </p>
      </div>
    </article>
  )
}
