import { ArrowLeft, MessageCircle, Phone, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { AccionesReserva } from "@/components/panel/acciones-reserva"
import { AnularCobro } from "@/components/panel/anular-cobro"
import { saldoDe } from "@/lib/panel/cobros"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { textoDelEfectivo, textoDelTotal } from "@/lib/predio/cotizacion"
import { pesos } from "@/lib/predio/tarifas"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { lineaDelModulo, nombreDeUnidad, nombreDelModulo, reservaParaPanel } from "@/lib/panel/reservas"
import { AsistenciaDelGrupo } from "@/components/panel/asistencia-grupo"
import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado"
import { estadoDe, resumenDeAsistencia } from "@/lib/panel/asistencia"
import { estadoVisible } from "@/lib/panel/estados"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { detalleDe } from "@/lib/reservas"
import { urlSitio } from "@/lib/url-sitio"

export const metadata: Metadata = { title: "Reserva" }

export default async function DetalleReserva({ params }: PageProps<"/panel/reservas/[id]">) {
  const sesion = await exigirPanel("reservas", "puerta", "caja")
  const veReservas = puedeVer(sesion.user.role, "reservas")
  const marcaIngresos = puedeVer(sesion.user.role, "puerta")
  const anulaCobros = marcaIngresos || puedeVer(sesion.user.role, "caja")
  const volver = veReservas
    ? { href: "/panel/reservas", texto: "Volver a Reservas" }
    : marcaIngresos
      ? { href: "/panel/puerta", texto: "Volver a Puerta" }
      : { href: "/panel/caja", texto: "Volver a la Caja" }
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
  const familias = new Set(reserva.personas.map((persona) => persona.familia))
  const hoy = hoyEnElPredio()
  const asistencia = resumenDeAsistencia({ ...reserva, hasta }, hoy)
  const puedeMarcar = marcaIngresos && reserva.estado !== "CANCELADA" && desde <= hoy
  const importantes = reserva.personas.filter((persona) => persona.notas)
  const sinOcupar = (detalle.lugares ?? []).filter((lugar) => !reserva.ocupaciones.some((item) => item.unidad.id === lugar.id))
  const visible = estadoVisible(reserva.estado, asistencia.asistencia)
  const motivoSinMarcar =
    reserva.estado === "CANCELADA"
      ? "La reserva está cancelada: no se puede marcar el ingreso."
      : desde > hoy
        ? `El ingreso se marca desde el ${fechaLargaPanel(desde).toLowerCase()}.`
        : !marcaIngresos
          ? "Tu usuario no marca ingresos: eso se hace desde Puerta."
          : undefined

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

        <Bloque titulo="Responsable de la reserva">
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
          ) : null}
          {!detalle.cotizacion.aConfirmar && !detalle.cotizacion.consumo ? <Dato termino="Saldo">{pesos(saldoDe(reserva.total, reserva.pagos))}</Dato> : null}
          {reserva.notas ? <Dato termino="Notas">{reserva.notas}</Dato> : null}
          <p className="pt-3 text-sm">
            <a href={enlaceTicket} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
              Ver el ticket que recibió
            </a>
          </p>
        </Bloque>

        <section id="grupo" aria-label="El grupo" className="rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)] lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-2xl tracking-tight">El grupo</h2>
            <p className="text-sm text-panel-muted">
              {reserva.adultos} {reserva.adultos === 1 ? "adulto" : "adultos"} · {reserva.menores} {reserva.menores === 1 ? "menor" : "menores"}
              {reserva.sinCargo ? ` · ${reserva.sinCargo} sin cargo` : ""}
              {familias.size > 1 ? ` · ${familias.size} familias` : ""}
              {reserva.estado !== "CANCELADA" ? (
                <>
                  {" · "}
                  {asistencia.adentro + asistencia.salieron ? ` (${asistencia.adentro} adentro de ${asistencia.total})` : ""}
                </>
              ) : null}
            </p>
          </div>
          {reserva.edadesGrupo ? <p className="mt-1 text-sm text-panel-muted">Edades: {reserva.edadesGrupo}</p> : null}
          {asistencia.porPersona ? (
            <div className="mt-4">
              <AsistenciaDelGrupo
                reservaId={reserva.id}
                completo
                puedeMarcar={puedeMarcar}
                motivoSinMarcar={motivoSinMarcar}
                integrantes={reserva.personas.map((persona) => ({
                  id: persona.id,
                  familia: persona.familia,
                  responsable: persona.responsable,
                  nombre: persona.nombre,
                  apellido: persona.apellido,
                  dni: persona.dni,
                  edad: persona.edad,
                  notas: persona.notas,
                  estado: estadoDe(persona, hasta < hoy),
                }))}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-panel-muted">
              {reserva.personas.length
                ? "Esta reserva no tiene a todas las personas cargadas, así que el ingreso se marca para el grupo entero desde Puerta."
                : "En los grupos no se carga a cada participante: el ingreso se marca para el grupo entero desde Puerta."}{" "}
              {marcaIngresos && desde <= hoy ? (
                <Link href={`/panel/puerta?fecha=${desde < hoy ? desde : hoy}&q=${reserva.id}`} className="font-semibold text-panel-tostado underline-offset-4 hover:underline">
                  Ir a Puerta
                </Link>
              ) : null}
            </p>
          )}
        </section>
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
