import { ArrowLeft, Phone, TriangleAlert, UtensilsCrossed } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { AccionesReserva } from "@/components/panel/acciones-reserva"
import { AnularCobro } from "@/components/panel/anular-cobro"
import { EnviarWhatsapp } from "@/components/panel/enviar-whatsapp"
import { ReasignarLugar } from "@/components/panel/reasignar-lugar"
import { saldoDe } from "@/lib/panel/cobros"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { textoDelEfectivo, textoDelTotal } from "@/lib/predio/cotizacion"
import { pesos } from "@/lib/predio/tarifas"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { totalDeCuenta } from "@/lib/panel/local"
import { actividadDeReserva, lineaDelModulo, nombreDeUnidad, nombreDelModulo, reservaParaPanel } from "@/lib/panel/reservas"
import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado"
import { resumenDeAsistencia } from "@/lib/panel/asistencia"
import { estadoVisible } from "@/lib/panel/estados"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { detalleDe } from "@/lib/reservas"
import { datosDeReserva, plantillasWhatsapp } from "@/lib/panel/whatsapp"
import { urlSitio } from "@/lib/url-sitio"
import { cn } from "cn"

export const metadata: Metadata = { title: "Reserva" }

const cuando = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" })
const nombreDeContacto: Record<string, string> = { confirmacion: "Pedido de confirmación", ticket: "Ticket", libre: "Mensaje" }

export default async function DetalleReserva({ params }: PageProps<"/panel/reservas/[id]">) {
  const sesion = await exigirPanel("reservas", "puerta", "caja")
  const veReservas = puedeVer(sesion.user.role, "reservas")
  const veClientes = puedeVer(sesion.user.role, "clientes")
  const marcaIngresos = puedeVer(sesion.user.role, "puerta")
  const anulaCobros = marcaIngresos || puedeVer(sesion.user.role, "caja")
  const volver = veReservas || marcaIngresos ? { href: "/panel/puerta", texto: "Volver a Puerta" } : { href: "/panel/caja", texto: "Volver a la Caja" }
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero) || numero < 1) notFound()
  const [reserva, { cuentas, movimientos }, plantillas] = await Promise.all([reservaParaPanel(numero), actividadDeReserva(numero), plantillasWhatsapp()])
  if (!reserva) notFound()
  const cuentasAbiertas = cuentas.filter((cuenta) => cuenta.estado === "ABIERTA")
  const cobrado = reserva.pagos.reduce((suma, pago) => suma + pago.importe, 0)

  const detalle = detalleDe(reserva.detalle)
  const desde = deFechaDb(reserva.desde)
  const hasta = deFechaDb(reserva.hasta)
  const telefono = normalizarTelefono(reserva.cliente.telefono ?? "")
  const enlaceTicket = `${urlSitio}/reserva/t/${reserva.token}`
  const familias = new Set(reserva.personas.map((persona) => persona.familia))
  const hoy = hoyEnElPredio()
  const asistencia = resumenDeAsistencia({ ...reserva, hasta }, hoy)
  const importantes = reserva.personas.filter((persona) => persona.notas)
  const sinOcupar = (detalle.lugares ?? []).filter((lugar) => !reserva.ocupaciones.some((item) => item.unidad.id === lugar.id))
  const visible = estadoVisible(reserva.estado, asistencia.asistencia)
  const saldo = saldoDe(reserva.total, reserva.pagos)
  const reasignable = (veReservas || marcaIngresos) && reserva.estado !== "CANCELADA" && !reserva.ingresoEn && asistencia.adentro + asistencia.salieron === 0 && hasta >= hoy

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
        <Link href={volver.href} className="inline-flex items-center gap-2 text-panel-muted hover:text-panel-ink">
          <ArrowLeft className="size-4" aria-hidden />
          {volver.texto}
        </Link>
        {veReservas ? (
          <Link href={`/panel/ocupacion?mes=${desde.slice(0, 7)}&dia=${desde}`} className="text-panel-tostado underline-offset-4 hover:underline">
            Ver ese día en Ocupación
          </Link>
        ) : null}
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
            <InsigniaDeEstado estado={visible} grande />
            <span className="font-semibold tracking-wider">{reserva.codigo}</span>
            <span>{nombreDelModulo[reserva.modulo]}</span>
            {reserva.origen === "LEGADO" ? <span>Vino de la web anterior</span> : null}
          </p>
        </div>
        {veReservas ? <AccionesReserva id={reserva.id} codigo={reserva.codigo} estado={reserva.estado} /> : null}
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

      {cuentasAbiertas.length ? (
        <p role="status" className="mt-6 flex flex-wrap items-center gap-2 rounded-3xl border-2 border-[#f0b266] bg-[#fff6ea] px-5 py-3 font-semibold text-[#7a4200]">
          <UtensilsCrossed className="size-5" aria-hidden />
          Tiene {cuentasAbiertas.length === 1 ? "una cuenta abierta" : `${cuentasAbiertas.length} cuentas abiertas`}:{" "}
          {cuentasAbiertas.map((cuenta) => `${cuenta.local === "BAR" ? "bar" : "restaurante"}, ${cuenta.mesa}, ${pesos(totalDeCuenta(cuenta.items))}`).join(" · ")}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <Bloque titulo="La reserva" color="border-t-[#1f6aa5]">
          <Dato termino="Llegada">{`${fechaLargaPanel(desde)} · ${reserva.ingreso}`}</Dato>
          <Dato termino="Salida">{`${fechaLargaPanel(hasta)} · ${reserva.salida}`}</Dato>
          <Dato termino="Personas">
            <span className="font-semibold">{reserva.adultos + reserva.menores + reserva.sinCargo}</span>
            <span className="mt-0.5 block text-panel-muted">
              {[
                `${reserva.adultos} ${reserva.adultos === 1 ? "adulto" : "adultos"}`,
                reserva.menores ? `${reserva.menores} de 5 a 12 años` : null,
                reserva.sinCargo ? `${reserva.sinCargo} sin cargo (menores de 5)` : null,
              ]
                .filter(Boolean)
                .map((linea) => (
                  <span key={linea} className="block">
                    {linea}
                  </span>
                ))}
            </span>
            {asistencia.adentro + asistencia.salieron ? (
              <span className="mt-0.5 block text-panel-tostado">
                {asistencia.adentro} adentro{asistencia.salieron ? `, ${asistencia.salieron} ya se fueron` : ""}
              </span>
            ) : null}
          </Dato>
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
          {reasignable ? <ReasignarLugar reservaId={reserva.id} /> : null}
          {reserva.notas ? <Dato termino="Notas">{reserva.notas}</Dato> : null}
          <Dato termino="Pedida">{reserva.creadaEn.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</Dato>
          <p className="pt-2 text-sm">
            <a href={enlaceTicket} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
              Ver el ticket que recibió
            </a>
          </p>
        </Bloque>

        <Bloque titulo="Responsable" color="border-t-[#7a5b3a]">
          <Dato termino="Nombre">
            {veClientes ? (
              <Link href={`/panel/clientes/todos/${reserva.cliente.id}`} className="font-semibold underline-offset-4 hover:underline">
                {`${reserva.cliente.nombre} ${reserva.cliente.apellido}`}
              </Link>
            ) : (
              `${reserva.cliente.nombre} ${reserva.cliente.apellido}`
            )}
          </Dato>
          {reserva.cliente.dni ? <Dato termino="DNI">{reserva.cliente.dni}</Dato> : null}
          {reserva.cargo ? <Dato termino="Cargo">{reserva.cargo}</Dato> : null}
          {reserva.cliente.email ? (
            <Dato termino="Correo">
              <a href={`mailto:${reserva.cliente.email}`} className="break-all underline underline-offset-4">
                {reserva.cliente.email}
              </a>
            </Dato>
          ) : null}
          <Dato termino="Teléfono">{reserva.cliente.telefono ?? "—"}</Dato>
          {telefono ? (
            <div className="flex flex-wrap gap-2 pt-3">
              {veClientes || marcaIngresos ? (
                <EnviarWhatsapp
                  tipo={reserva.estado === "CONFIRMADA" ? "ticket" : "libre"}
                  etiqueta={reserva.estado === "CONFIRMADA" ? "Mandar el ticket por WhatsApp" : "Escribir por WhatsApp"}
                  className="h-10 px-4"
                  plantillas={plantillas}
                  destinatario={{
                    reservaId: reserva.id,
                    titular: `${reserva.cliente.nombre} ${reserva.cliente.apellido}`,
                    whatsapp: telefono.whatsapp,
                    datos: datosDeReserva({ nombre: reserva.cliente.nombre, codigo: reserva.codigo, desde, token: reserva.token, modulo: reserva.modulo }),
                  }}
                />
              ) : null}
              <a href={`tel:${telefono.e164}`} className="inline-flex items-center gap-2 rounded-full border border-panel-line bg-white px-4 py-2 text-sm font-bold">
                <Phone className="size-4" aria-hidden />
                Llamar
              </a>
            </div>
          ) : null}
        </Bloque>

        <Bloque titulo="Cobranza" color="border-t-[#2e7d32]">
          <Dato termino="Total">{textoDelTotal(detalle.cotizacion)}</Dato>
          {textoDelEfectivo(detalle.cotizacion) ? <Dato termino="Efectivo">{textoDelEfectivo(detalle.cotizacion)}</Dato> : null}
          {!detalle.cotizacion.aConfirmar && !detalle.cotizacion.consumo && reserva.total ? (
            <div className="pt-1">
              <div className="h-2 overflow-hidden rounded-full bg-panel" aria-hidden>
                <div className="h-full rounded-full bg-[#2e7d32]" style={{ width: `${Math.min(((reserva.total - saldo) / reserva.total) * 100, 100)}%` }} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="block text-xs font-bold text-[#2e7d32] uppercase">Cobrado</span>
                  <span className="font-semibold tabular-nums">{pesos(cobrado)}</span>
                </p>
                <p>
                  <span className="block text-xs font-bold text-[#a85d00] uppercase">Pendiente</span>
                  <span className="font-semibold tabular-nums">{pesos(saldo)}</span>
                </p>
              </div>
            </div>
          ) : null}
          {reserva.pagos.length ? (
            <Dato termino="Cobros">
              <ul className="space-y-1.5">
                {reserva.pagos.map((pago) => {
                  const texto = `${pesos(pago.importe)} en ${pago.forma === "DEBITO" ? "débito" : pago.forma.toLowerCase()}`
                  return (
                    <li key={pago.id} className="flex flex-wrap items-baseline gap-x-3">
                      <span>
                        {texto}
                        {pago.descuento ? ` (−${pesos(pago.descuento)} desc.)` : ""}
                        <span className="text-panel-muted">
                          {" "}
                          · {deFechaDb(pago.fecha).split("-").reverse().join("/")}
                          {pago.registradoPor ? ` · ${pago.registradoPor}` : ""}
                        </span>
                      </span>
                      {anulaCobros ? <AnularCobro pagoId={pago.id} descripcion={texto} /> : null}
                    </li>
                  )
                })}
              </ul>
            </Dato>
          ) : (
            <Dato termino="Cobros">Todavía no se cobró nada.</Dato>
          )}
          {cuentas.length ? (
            <Dato termino="Restaurante y bar">
              <ul className="space-y-1">
                {cuentas.map((cuenta) => (
                  <li key={cuenta.id}>
                    {cuenta.local === "BAR" ? "Bar" : "Restaurante"}, {cuenta.mesa}: {pesos(totalDeCuenta(cuenta.items))}{" "}
                    <span className={cuenta.estado === "ABIERTA" ? "font-semibold text-[#a85d00]" : "text-panel-muted"}>{cuenta.estado === "ABIERTA" ? "· abierta" : "· cobrada"}</span>
                  </li>
                ))}
              </ul>
            </Dato>
          ) : null}
        </Bloque>

        <Bloque titulo="Actividad" color="border-t-[#e07b1a]" className="2xl:col-span-3">
          <Dato termino="Ingreso">
            {reserva.ingresoEn
              ? `${reserva.ingresoEn.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}${reserva.ingresoPor ? ` · ${reserva.ingresoPor}` : ""}`
              : "Todavía no ingresó"}
          </Dato>
          <Dato termino="WhatsApp">
            {reserva.contactos.length ? (
              <ul className="space-y-1">
                {reserva.contactos.map((contacto) => (
                  <li key={contacto.id}>
                    {nombreDeContacto[contacto.tipo] ?? contacto.tipo}
                    {contacto.plantilla ? ` («${contacto.plantilla}»)` : ""}
                    <span className="text-panel-muted"> · {cuando.format(contacto.creadoEn)}{contacto.por ? ` · ${contacto.por}` : ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              "Todavía no se le escribió desde el panel."
            )}
          </Dato>
          <Dato termino="Movimientos">
            {movimientos.length ? (
              <ul className="space-y-1">
                {movimientos.map((movimiento) => (
                  <li key={movimiento.id}>
                    {movimiento.detalle}
                    <span className="text-panel-muted"> · {cuando.format(movimiento.creadoEn)} · {movimiento.usuario}</span>
                  </li>
                ))}
              </ul>
            ) : (
              "Sin movimientos registrados."
            )}
          </Dato>
        </Bloque>

      </div>
    </main>
  )
}

function Bloque({ titulo, color, className, children }: { titulo: string; color: string; className?: string; children: ReactNode }) {
  return (
    <section aria-label={titulo} className={cn("rounded-3xl border-t-8 bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)]", color, className)}>
      <h2 className="font-display text-2xl tracking-tight">{titulo}</h2>
      <dl className="mt-3 space-y-2">{children}</dl>
    </section>
  )
}

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-panel-line/60 pb-2 text-sm last:border-0">
      <dt className="font-bold text-panel-muted">{termino}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}
