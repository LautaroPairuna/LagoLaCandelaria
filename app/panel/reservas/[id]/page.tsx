import { ArrowLeft, MessageCircle, Phone, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { AccionesReserva } from "@/components/panel/acciones-reserva"
import { saldoDe } from "@/lib/panel/cobros"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { deFechaDb } from "@/lib/predio/fechas"
import { textoDelEfectivo, textoDelTotal } from "@/lib/predio/cotizacion"
import { pesos } from "@/lib/predio/tarifas"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { lineaDelModulo, nombreDeUnidad, nombreDelModulo, reservaParaPanel } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { detalleDe } from "@/lib/reservas"
import { urlSitio } from "@/lib/url-sitio"
import { cn } from "cn"

export const metadata: Metadata = { title: "Reserva" }

const etiquetaDeEstado = {
  PENDIENTE: { texto: "A confirmar", clase: "bg-panel-claro text-panel-tostado" },
  CONFIRMADA: { texto: "Confirmada", clase: "bg-panel-naranja text-white" },
  CANCELADA: { texto: "Cancelada", clase: "bg-panel-line text-panel-muted" },
} as const

export default async function DetalleReserva({ params }: PageProps<"/panel/reservas/[id]">) {
  await exigirPanel("reservas")
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero) || numero < 1) notFound()
  const reserva = await reservaParaPanel(numero)
  if (!reserva) notFound()

  const detalle = detalleDe(reserva.detalle)
  const desde = deFechaDb(reserva.desde)
  const hasta = deFechaDb(reserva.hasta)
  const telefono = normalizarTelefono(reserva.cliente.telefono ?? "")
  const enlaceTicket = `${urlSitio}/reserva/t/${reserva.token}`
  const mensaje =
    reserva.estado === "CONFIRMADA"
      ? `¡Hola ${reserva.cliente.nombre}! Tu reserva ${reserva.codigo} en Lago La Candelaria para el ${fechaLargaPanel(desde).toLowerCase()} quedó confirmada. Tu ticket con el QR del ingreso: ${enlaceTicket}`
      : `¡Hola ${reserva.cliente.nombre}! Te escribimos de Lago La Candelaria por tu solicitud de reserva ${reserva.codigo}.`
  const familias = new Map<number, typeof reserva.personas>()
  for (const persona of reserva.personas) familias.set(persona.familia, [...(familias.get(persona.familia) ?? []), persona])
  const importantes = reserva.personas.filter((persona) => persona.notas)
  const sinOcupar = (detalle.lugares ?? []).filter((lugar) => !reserva.ocupaciones.some((item) => item.unidad.id === lugar.id))
  const estado = etiquetaDeEstado[reserva.estado]

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
        <Link href="/panel/reservas" className="inline-flex items-center gap-2 text-panel-muted hover:text-panel-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Volver a Reservas
        </Link>
        <Link href={`/panel/ocupacion?mes=${desde.slice(0, 7)}&dia=${desde}`} className="text-panel-tostado underline-offset-4 hover:underline">
          Ver ese día en Ocupación
        </Link>
      </div>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">
            {lineaDelModulo(reserva.modulo).nombre} · Reserva N.º {reserva.id}
          </p>
          <h1 className="font-display mt-2 text-4xl tracking-tight md:text-5xl">
            {reserva.institucion ?? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-panel-muted">
            <span className={cn("rounded-full px-3 py-1 text-sm font-bold", estado.clase)}>{estado.texto}</span>
            <span className="font-semibold tracking-wider">{reserva.codigo}</span>
            <span>{nombreDelModulo[reserva.modulo]}</span>
            {reserva.origen === "LEGADO" ? <span>Vino de la web anterior</span> : null}
          </p>
        </div>
        <AccionesReserva id={reserva.id} codigo={reserva.codigo} estado={reserva.estado} />
      </header>

      {importantes.length > 0 ? (
        <section aria-label="Información importante" className="mt-6 flex gap-3 rounded-3xl border border-panel-ambar bg-panel-claro p-4 md:p-5">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-panel-tostado" aria-hidden />
          <div>
            <h2 className="font-semibold">Información importante</h2>
            <ul className="mt-1 space-y-1 text-sm">
              {importantes.map((persona) => (
                <li key={persona.id}>
                  <strong>
                    {persona.nombre} {persona.apellido}
                  </strong>{" "}
                  <span className="text-panel-muted">
                    ({familias.size > 1 ? `familia ${persona.familia}, ` : ""}
                    {persona.edad} años)
                  </span>
                  : {persona.notas}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Cuándo">
          <Dato termino="Llegada">{`${fechaLargaPanel(desde)} · ${reserva.ingreso}`}</Dato>
          <Dato termino="Salida">{`${fechaLargaPanel(hasta)} · ${reserva.salida}`}</Dato>
          <Dato termino="Ingreso">
            {reserva.ingresoEn
              ? `${reserva.ingresoEn.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}${reserva.ingresoPor ? ` · ${reserva.ingresoPor}` : ""}`
              : "Todavía no ingresó"}
          </Dato>
          <Dato termino="Pedida">{reserva.creadaEn.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</Dato>
        </Bloque>

        <Bloque titulo="Quién reserva">
          <Dato termino="Nombre">{`${reserva.cliente.nombre} ${reserva.cliente.apellido}`}</Dato>
          {reserva.cliente.dni ? <Dato termino="DNI">{reserva.cliente.dni}</Dato> : null}
          {reserva.cargo ? <Dato termino="Cargo">{reserva.cargo}</Dato> : null}
          {reserva.cliente.email ? (
            <Dato termino="Correo">
              <a href={`mailto:${reserva.cliente.email}`} className="underline underline-offset-4">
                {reserva.cliente.email}
              </a>
            </Dato>
          ) : null}
          <Dato termino="Teléfono">{reserva.cliente.telefono ?? "—"}</Dato>
          {telefono ? (
            <div className="flex flex-wrap gap-2 pt-3">
              <a
                href={`https://wa.me/${telefono.whatsapp}?text=${encodeURIComponent(mensaje)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-bold text-white"
              >
                <MessageCircle className="size-4" aria-hidden />
                {reserva.estado === "CONFIRMADA" ? "Avisar la confirmación por WhatsApp" : "Escribir por WhatsApp"}
              </a>
              <a href={`tel:${telefono.e164}`} className="inline-flex items-center gap-2 rounded-full border border-panel-line bg-white px-4 py-2 text-sm font-bold">
                <Phone className="size-4" aria-hidden />
                Llamar
              </a>
            </div>
          ) : null}
        </Bloque>

        <Bloque titulo="El grupo">
          <Dato termino="Adultos">{String(reserva.adultos)}</Dato>
          <Dato termino="Menores">{String(reserva.menores)}</Dato>
          <Dato termino="Sin cargo">{String(reserva.sinCargo)}</Dato>
          {reserva.edadesGrupo ? <Dato termino="Edades">{reserva.edadesGrupo}</Dato> : null}
          {familias.size > 1 ? <Dato termino="Familias">{String(familias.size)}</Dato> : null}
          {[...familias].map(([numero, personas]) => (
            <div key={numero} className="mt-3">
              {familias.size > 1 ? <h3 className="text-xs font-bold tracking-wide text-panel-muted uppercase">Familia {numero}</h3> : null}
              <ul className="divide-y divide-panel-line text-sm">
                {personas.map((persona) => (
                  <li key={persona.id} className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 py-2">
                    <span className="font-semibold">
                      {persona.nombre} {persona.apellido}
                      {persona.responsable ? <span className="ml-2 text-xs font-bold text-panel-naranja">Responsable</span> : null}
                    </span>
                    <span className="text-panel-muted">
                      {persona.edad} años{persona.dni ? ` · DNI ${persona.dni}` : ""}
                      {persona.cud ? " · CUD" : ""}
                    </span>
                    {persona.notas ? <span className="w-full font-semibold text-panel-tostado">{persona.notas}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Bloque>

        <Bloque titulo="Lugar y total">
          <Dato termino="Lugares">
            {reserva.ocupaciones.length
              ? reserva.ocupaciones.map((item) => `${nombreDeUnidad[item.unidad.tipo]} ${item.unidad.etiqueta}`).join(", ")
              : "Sin lugar asignado"}
          </Dato>
          {sinOcupar.length > 0 && reserva.estado !== "CANCELADA" ? (
            <p className="rounded-xl bg-panel-claro px-3 py-2 text-sm font-semibold text-panel-tostado">
              Pidió {sinOcupar.map((lugar) => lugar.nombre).join(", ")}, pero ya estaba tomado por otra reserva. Hay que reasignarlo.
            </p>
          ) : null}
          <Dato termino="Total">{textoDelTotal(detalle.cotizacion)}</Dato>
          {textoDelEfectivo(detalle.cotizacion) ? <Dato termino="Efectivo">{textoDelEfectivo(detalle.cotizacion)}</Dato> : null}
          {reserva.pagos.length ? (
            <Dato termino="Pagos">
              {reserva.pagos
                .map((pago) => `${pesos(pago.importe)} en ${pago.forma === "DEBITO" ? "débito" : pago.forma.toLowerCase()}${pago.descuento ? ` (−${pesos(pago.descuento)})` : ""}`)
                .join(" · ")}
            </Dato>
          ) : null}
          {!detalle.cotizacion.aConfirmar ? <Dato termino="Saldo">{pesos(saldoDe(reserva.total, reserva.pagos))}</Dato> : null}
          {reserva.notas ? <Dato termino="Notas">{reserva.notas}</Dato> : null}
          <p className="pt-3 text-sm">
            <a href={enlaceTicket} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
              Ver el ticket que recibió
            </a>
          </p>
        </Bloque>
      </div>
    </main>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
      <h2 className="font-display text-2xl tracking-tight">{titulo}</h2>
      <dl className="mt-3 space-y-2">{children}</dl>
    </section>
  )
}

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 text-sm">
      <dt className="font-bold text-panel-muted">{termino}</dt>
      <dd>{children}</dd>
    </div>
  )
}
