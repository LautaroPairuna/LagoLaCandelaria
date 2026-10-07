import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { fechaLargaPanel, rangoConMesPanel } from "@/lib/panel/formato"
import { esZona, ocupacionDeLugares, seccionesDe, zonas, type ReservaEnLugar, type ZonaId } from "@/lib/panel/lugares"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { estadoDelDia, mapaDeEspeciales, type TipoDia } from "@/lib/predio/calendario"
import { aFechaDb, deFechaDb, esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { inventario, type UnidadPredio } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { pesos } from "@/lib/predio/tarifas"
import { db } from "@/lib/prisma"
import { cn } from "cn"

export const metadata: Metadata = { title: "Lugares" }

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

function enlace(fecha: string, zona: ZonaId, unidad?: string) {
  const params = new URLSearchParams({ fecha, zona })
  if (unidad) params.set("unidad", unidad)
  return `/panel/lugares?${params}`
}

function nombreDe(unidad: UnidadPredio) {
  return `${nombreDeUnidad[unidad.tipo]} ${unidad.etiqueta}`
}

export default async function PanelLugares({ searchParams }: PageProps<"/panel/lugares">) {
  await exigirPanel("lugares")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const fechaPedida = primero(params.fecha)
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const zonaPedida = primero(params.zona)
  const zona = esZona(zonaPedida) ? zonaPedida : "parrillas"
  const secciones = seccionesDe(zona)
  const elegida = secciones.flatMap((seccion) => seccion.unidades).find((unidad) => unidad.id === primero(params.unidad))

  const [ocupadas, especial] = await Promise.all([ocupacionDeLugares(fecha), db().diaEspecial.findUnique({ where: { fecha: aFechaDb(fecha) } })])
  const estado = estadoDelDia(fecha, mapaDeEspeciales(especial ? [{ fecha: deFechaDb(especial.fecha), tipo: especial.tipo as TipoDia, motivo: especial.motivo }] : []))
  const reservasElegida = elegida ? (ocupadas.get(elegida.id) ?? []) : []

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Ocupación por lugar</p>
          {fecha !== hoy ? (
            <Link href={enlace(hoy, zona)} className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
              Hoy
            </Link>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-2 md:mt-2 md:gap-x-2">
          <Link href={enlace(sumarDiasIso(fecha, -1), zona)} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día anterior">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <h1 className="font-display min-w-0 text-center text-2xl leading-tight tracking-tight md:text-4xl">{fechaLargaPanel(fecha)}</h1>
          <Link href={enlace(sumarDiasIso(fecha, 1), zona)} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día siguiente">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
          <form action="/panel/lugares" className="flex items-center gap-2 md:ml-3">
            <input type="hidden" name="zona" value={zona} />
            <input type="date" name="fecha" defaultValue={fecha} aria-label="Elegir otro día" className="h-10 rounded-xl border border-panel-line bg-white px-3 text-sm" />
            <button type="submit" className="h-10 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted">
              Ir
            </button>
          </form>
        </div>
      </header>

      {!estado.abierto ? (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-panel-muted">
          Ese día el predio está cerrado: {estado.motivo}
        </p>
      ) : null}

      <nav aria-label="Zonas" className="-mx-4 mt-5 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-auto md:flex-wrap md:overflow-visible md:px-0">
        {zonas.map((item) => {
          const unidades = seccionesDe(item.id).flatMap((seccion) => seccion.unidades)
          const tomadas = unidades.filter((unidad) => ocupadas.has(unidad.id)).length
          const activa = item.id === zona
          return (
            <Link
              key={item.id}
              href={enlace(fecha, item.id)}
              aria-current={activa ? "true" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                activa ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
              )}
            >
              {item.nombre}
              <span className={cn("text-xs font-bold", activa ? "text-white/70" : "text-panel-muted")}>
                {unidades.length - tomadas} libres
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {secciones.map((seccion) => {
            const libres = seccion.unidades.filter((unidad) => !ocupadas.has(unidad.id)).length
            return (
              <section key={seccion.titulo} aria-label={seccion.titulo} className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
                <h2 className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-display text-xl tracking-tight">{seccion.titulo}</span>
                  <span className="text-sm text-panel-muted">
                    <strong className="text-panel-ink">{libres}</strong> de {seccion.unidades.length} libres
                  </span>
                </h2>
                <ul className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:gap-2 xl:grid-cols-10">
                  {seccion.unidades.map((unidad) => (
                    <li key={unidad.id}>
                      <Lugar unidad={unidad} reservas={ocupadas.get(unidad.id) ?? []} elegida={unidad.id === elegida?.id} href={enlace(fecha, zona, unidad.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
          <ul aria-label="Referencias" className="flex flex-wrap gap-x-5 gap-y-1.5 px-1 text-xs font-semibold text-panel-muted">
            <li className="flex items-center gap-2">
              <span className="size-3.5 rounded border border-panel-line bg-white" /> Libre
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3.5 rounded bg-panel-naranja" /> Reserva confirmada
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3.5 rounded border border-dashed border-panel-ambar bg-panel-claro" /> Reserva a confirmar
            </li>
          </ul>
        </div>

        {elegida ? (
          <Link href={enlace(fecha, zona)} scroll={false} aria-label="Cerrar el detalle" className="fixed inset-0 z-30 bg-panel-ink/30 lg:hidden" />
        ) : null}
        {elegida ? (
          <aside
            aria-label={`Detalle de ${nombreDe(elegida)}`}
            className="fixed inset-x-0 bottom-0 z-40 max-h-[70svh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-[0_-12px_40px_rgba(58,42,24,0.18)] lg:sticky lg:top-6 lg:z-auto lg:max-h-none lg:rounded-3xl lg:shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
          >
            <Detalle unidad={elegida} reservas={reservasElegida} cerrar={enlace(fecha, zona)} />
          </aside>
        ) : (
          <p className="hidden rounded-3xl bg-white p-5 text-sm text-panel-muted shadow-[0_8px_28px_rgba(58,42,24,0.06)] lg:block">
            Tocá un lugar ocupado para ver de quién es la reserva.
          </p>
        )}
      </div>
    </main>
  )
}

function Lugar({ unidad, reservas, elegida, href }: { unidad: UnidadPredio; reservas: ReservaEnLugar[]; elegida: boolean; href: string }) {
  const [reserva] = reservas
  const confirmada = reservas.some((item) => item.estado === "CONFIRMADA")
  const debajo = reservas.length > 1 ? `${reservas.length} reservas` : reserva ? reserva.titular.split(" ").at(-1) : null
  const descripcion = reservas
    .map((item) => `${item.titular}, ${item.personas} personas${unidad.tipo === "MESA_RESTAURANTE" ? `, de ${item.horario}` : ""}, ${item.estado === "PENDIENTE" ? "a confirmar" : "confirmada"}`)
    .join("; ")
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={`${nombreDe(unidad)}: ${reserva ? descripcion : "libre"}`}
      aria-current={elegida ? "true" : undefined}
      className={cn(
        "flex h-14 flex-col items-center justify-center rounded-xl border px-1 text-center transition md:h-16",
        !reserva && "border-panel-line bg-white text-panel-ink hover:border-panel-muted",
        reserva && confirmada && "border-panel-naranja bg-panel-naranja text-white hover:bg-panel-tostado",
        reserva && !confirmada && "border-dashed border-panel-ambar bg-panel-claro text-panel-ink hover:bg-[#f3d3a8]",
        elegida && "ring-2 ring-panel-ink ring-offset-2",
      )}
    >
      <span className="text-base leading-none font-bold">{unidad.etiqueta}</span>
      {debajo ? <span className="mt-1 w-full truncate text-[0.65rem] leading-none font-semibold">{debajo}</span> : null}
    </Link>
  )
}

function Detalle({ unidad, reservas, cerrar }: { unidad: UnidadPredio; reservas: ReservaEnLugar[]; cerrar: string }) {
  const titulo = reservas.length === 0 ? "Libre" : reservas.length === 1 ? reservas[0].titular : `${reservas.length} reservas`
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">{nombreDe(unidad)}</p>
          <h2 className="font-display mt-1 text-2xl tracking-tight">{titulo}</h2>
        </div>
        <Link href={cerrar} scroll={false} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </Link>
      </div>
      {unidad.capacidad ? (
        <p className="mt-1 text-sm text-panel-muted">
          Hasta {unidad.capacidad} personas
          {unidad.tipo !== "MESA_RESTAURANTE" && unidad.mesas ? ` · ${unidad.mesas} ${unidad.mesas === 1 ? "mesa" : "mesas"}` : ""}
        </p>
      ) : null}
      {reservas.length ? (
        <div className="divide-y divide-panel-line">
          {reservas.map((reserva) => (
            <ReservaDelLugar key={reserva.id} reserva={reserva} conTitular={reservas.length > 1} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-panel-muted">Nadie lo reservó para este día.</p>
      )}
    </>
  )
}

function ReservaDelLugar({ reserva, conTitular }: { reserva: ReservaEnLugar; conTitular: boolean }) {
  const otros = reserva.otrosLugares.map((id) => inventario.find((item) => item.id === id)).filter((item) => item !== undefined)
  return (
    <section className="py-4">
      {conTitular ? <h3 className="font-semibold">{reserva.titular}</h3> : null}
      <dl className="mt-1 space-y-2 text-sm">
        <Fila termino="Reserva">
          N.º {reserva.id} · {reserva.codigo}
        </Fila>
        <Fila termino="Propuesta">
          {nombreDelModulo[reserva.modulo]} · {reserva.personas} pers.
        </Fila>
        <Fila termino="Fechas">{rangoConMesPanel(reserva.desde, reserva.hasta)}</Fila>
        <Fila termino="Horario">{reserva.horario}</Fila>
        <Fila termino="Estado">{reserva.ingreso ? "Ya ingresó" : reserva.estado === "PENDIENTE" ? "A confirmar" : "Confirmada"}</Fila>
        <Fila termino="Saldo">
          {reserva.consumo ? "Consumo aparte" : reserva.aConfirmar ? "A presupuestar" : reserva.saldo ? pesos(reserva.saldo) : "Pagado"}
        </Fila>
        {reserva.telefono ? <Fila termino="Teléfono">{reserva.telefono}</Fila> : null}
        {otros.length ? <Fila termino="También tiene">{otros.map(nombreDe).join(", ")}</Fila> : null}
      </dl>
      <Link
        href={`/panel/reservas/${reserva.id}`}
        className="mt-4 flex h-11 items-center justify-center rounded-full bg-panel-ink px-5 text-sm font-semibold text-white hover:bg-panel-tostado"
      >
        Ver la reserva completa
      </Link>
    </section>
  )
}

function Fila({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3">
      <dt className="font-semibold text-panel-muted">{termino}</dt>
      <dd>{children}</dd>
    </div>
  )
}
