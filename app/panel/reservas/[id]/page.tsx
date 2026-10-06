import { ArrowLeft, MessageCircle, Phone, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { AccionesReserva } from "@/components/panel/acciones-reserva"
import { saldoDe } from "@/lib/panel/cobros"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { textoDelEfectivo, textoDelTotal } from "@/lib/predio/cotizacion"
import { pesos } from "@/lib/predio/tarifas"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { lineaDelModulo, nombreDeUnidad, nombreDelModulo, reservaParaPanel } from "@/lib/panel/reservas"
import { AsistenciaDelGrupo } from "@/components/panel/asistencia-grupo"
import { estadoDe, nombreDeAsistencia, resumenDeAsistencia } from "@/lib/panel/asistencia"
import { puedeVer } from "@/lib/panel/roles"
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
  const sesion = await exigirPanel("reservas", "puerta")
  const veReservas = puedeVer(sesion.user.role, "reservas")
  const marcaIngresos = puedeVer(sesion.user.role, "puerta")
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
  const estado = etiquetaDeEstado[reserva.estado]

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
        <Link href={veReservas ? "/panel/reservas" : "/panel/puerta"} className="inline-flex items-center gap-2 text-panel-muted hover:text-panel-ink">
          <ArrowLeft className="size-4" aria-hidden />
          {veReservas ? "Volver a Reservas" : "Volver a Puerta"}
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
            <span className={cn("rounded-full px-3 py-1 text-sm font-bold", estado.clase)}>{estado.texto}</span>
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
                  <strong className="text-panel-ink">{nombreDeAsistencia[asistencia.asistencia]}</strong>
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
                integrantes={reserva.personas.map((persona) => ({
                  id: persona.id,
                  familia: persona.familia,
                  responsable: persona.responsable,
                  nombre: persona.nombre,
                  apellido: persona.apellido,
                  dni: persona.dni,
                  edad: persona.edad,
                  notas: persona.notas,
                  estado: estadoDe(persona),
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
