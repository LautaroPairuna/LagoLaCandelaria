import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { estadoDelDia, mapaDeEspeciales, type TipoDia } from "@/lib/predio/calendario"
import { aFechaDb, deFechaDb, diaDeLaSemana, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { fechaLargaPanel, nombreDelMes, rangoPanel } from "@/lib/panel/formato"
import {
  esLinea,
  esMes,
  lineas,
  nombreDelModulo,
  reservasDelMes,
  sumarMes,
  type LineaId,
  type ReservaDelMes,
} from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"
import { cn } from "cn"

export const metadata: Metadata = { title: "Reservas" }

const diasDeLaSemana = ["L", "M", "M", "J", "V", "S", "D"]

type Filtros = { mes: string; linea?: LineaId; dia?: string }

function enlace({ mes, linea, dia }: Filtros) {
  const params = new URLSearchParams({ mes })
  if (linea) params.set("linea", linea)
  if (dia) params.set("dia", dia)
  return `/panel/reservas?${params}`
}

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

export default async function PanelReservas({ searchParams }: PageProps<"/panel/reservas">) {
  await exigirPanel("reservas")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const mesPedido = primero(params.mes)
  const mes = esMes(mesPedido) ? mesPedido : hoy.slice(0, 7)
  const lineaPedida = primero(params.linea)
  const linea = esLinea(lineaPedida) ? lineaPedida : undefined
  const diaPedido = primero(params.dia)
  const dia = diaPedido?.startsWith(mes) && /^\d{4}-\d{2}-\d{2}$/.test(diaPedido) ? diaPedido : undefined

  const inicio = `${mes}-01`
  const fin = sumarDiasIso(`${sumarMes(mes, 1)}-01`, -1)
  const [reservas, especiales] = await Promise.all([
    reservasDelMes(mes, linea),
    db().diaEspecial.findMany({ where: { fecha: { gte: aFechaDb(inicio), lte: aFechaDb(fin) } } }),
  ])
  const mapa = mapaDeEspeciales(
    especiales.map((item) => ({ fecha: deFechaDb(item.fecha), tipo: item.tipo as TipoDia, motivo: item.motivo })),
  )

  const porDia = new Map<string, { pendientes: number; confirmadas: number }>()
  for (const reserva of reservas) {
    const desde = reserva.desde < inicio ? inicio : reserva.desde
    const hasta = reserva.hasta > fin ? fin : reserva.hasta
    for (const fecha of fechasEntre(desde, hasta)) {
      const cuenta = porDia.get(fecha) ?? { pendientes: 0, confirmadas: 0 }
      if (reserva.estado === "PENDIENTE") cuenta.pendientes += 1
      else cuenta.confirmadas += 1
      porDia.set(fecha, cuenta)
    }
  }

  const visibles = dia ? reservas.filter((reserva) => reserva.desde <= dia && reserva.hasta >= dia) : reservas
  const pendientes = visibles.filter((reserva) => reserva.estado === "PENDIENTE")
  const confirmadas = visibles.filter((reserva) => reserva.estado === "CONFIRMADA")

  const desplazamiento = (diaDeLaSemana(inicio) + 6) % 7
  const dias = fechasEntre(inicio, fin)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Panel de Reservas</p>
          <div className="mt-2 flex items-center gap-2">
            <Link href={enlace({ mes: sumarMes(mes, -1), linea })} className="rounded-full p-2 hover:bg-panel-line" aria-label="Mes anterior">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <h1 className="font-display min-w-48 text-center text-3xl tracking-tight md:text-4xl">{nombreDelMes(mes)}</h1>
            <Link href={enlace({ mes: sumarMes(mes, 1), linea })} className="rounded-full p-2 hover:bg-panel-line" aria-label="Mes siguiente">
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
        <nav aria-label="Propuesta" className="flex flex-wrap gap-2">
          {[{ id: undefined, nombre: "Todas" }, ...lineas].map((item) => {
            const activa = item.id === linea
            return (
              <Link
                key={item.nombre}
                href={enlace({ mes, linea: item.id, dia })}
                aria-current={activa ? "true" : undefined}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold",
                  activa ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
                )}
              >
                {item.nombre}
              </Link>
            )
          })}
        </nav>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Calendario" className="rounded-3xl bg-white p-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-panel-muted md:gap-2">
            {diasDeLaSemana.map((letra, indice) => (
              <span key={indice} className="py-1">
                {letra}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1.5 md:gap-2">
            {Array.from({ length: desplazamiento }, (_, indice) => (
              <span key={`vacio-${indice}`} aria-hidden />
            ))}
            {dias.map((fecha) => {
              const cuenta = porDia.get(fecha)
              const cerrado = !estadoDelDia(fecha, mapa).abierto
              const elegido = fecha === dia
              return (
                <Link
                  key={fecha}
                  href={enlace({ mes, linea, dia: elegido ? undefined : fecha })}
                  aria-label={`${fechaLargaPanel(fecha)}${cuenta ? `: ${cuenta.pendientes} a confirmar, ${cuenta.confirmadas} confirmadas` : ""}${cerrado ? ", predio cerrado" : ""}`}
                  aria-current={elegido ? "date" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col rounded-xl border p-1.5 text-left text-sm transition md:min-h-24 md:p-2",
                    cuenta?.pendientes
                      ? "border-panel-ambar bg-panel-claro"
                      : cuenta?.confirmadas
                        ? "border-panel-naranja bg-panel-naranja text-white"
                        : cerrado
                          ? "border-transparent bg-panel text-panel-muted"
                          : "border-panel-line bg-white",
                    elegido && "ring-2 ring-panel-ink ring-offset-2",
                    fecha === hoy && "font-black",
                  )}
                >
                  <span>{Number(fecha.slice(8))}</span>
                  {cuenta ? (
                    <span className="mt-auto flex gap-1 md:hidden" aria-hidden>
                      {cuenta.pendientes ? <span className="rounded-full bg-panel-ambar px-1.5 text-[0.68rem] font-bold text-panel-ink">{cuenta.pendientes}</span> : null}
                      {cuenta.confirmadas ? <span className="rounded-full bg-white/90 px-1.5 text-[0.68rem] font-bold text-panel-tostado">{cuenta.confirmadas}</span> : null}
                    </span>
                  ) : null}
                  {cuenta?.pendientes ? (
                    <span className="mt-auto hidden text-xs leading-tight font-bold md:block">{cuenta.pendientes} a confirmar</span>
                  ) : null}
                  {cuenta?.confirmadas ? (
                    <span className={cn("hidden text-xs leading-tight font-semibold md:block", !cuenta.pendientes && "md:mt-auto")}>
                      {cuenta.confirmadas} {cuenta.confirmadas === 1 ? "confirmada" : "confirmadas"}
                    </span>
                  ) : null}
                  {!cuenta && cerrado ? <span className="mt-auto hidden text-[0.68rem] md:block">Cerrado</span> : null}
                </Link>
              )
            })}
          </div>
          <ul aria-label="Referencias" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-panel-muted">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded border border-panel-line bg-white" /> Libre
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-panel-naranja" /> Confirmada
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded border border-panel-ambar bg-panel-claro" /> A confirmar
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-panel" /> Predio cerrado
            </li>
          </ul>
        </section>

        <div className="space-y-6">
          {dia ? (
            <p className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold">
              {fechaLargaPanel(dia)}
              <Link href={enlace({ mes, linea })} className="text-panel-tostado underline-offset-4 hover:underline">
                Ver todo el mes
              </Link>
            </p>
          ) : null}
          <ListaReservas titulo="A confirmar" reservas={pendientes} vacio="No hay pedidos esperando confirmación." />
          <ListaReservas titulo="Confirmadas" reservas={confirmadas} vacio="Todavía no hay reservas confirmadas." />
        </div>
      </div>
    </main>
  )
}

function ListaReservas({ titulo, reservas, vacio }: { titulo: string; reservas: ReservaDelMes[]; vacio: string }) {
  return (
    <section aria-label={titulo} className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
      <h2 className="flex items-center justify-between font-display text-2xl tracking-tight">
        {titulo}
        <span className="rounded-full bg-panel px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{reservas.length}</span>
      </h2>
      {reservas.length === 0 ? (
        <p className="mt-3 text-sm text-panel-muted">{vacio}</p>
      ) : (
        <ul className="mt-3 divide-y divide-panel-line">
          {reservas.map((reserva) => (
            <li key={reserva.id}>
              <Link href={`/panel/reservas/${reserva.id}`} className="flex items-start gap-3 py-3 hover:bg-panel/60">
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2.5 shrink-0 rounded-full",
                    reserva.estado === "PENDIENTE" ? "bg-panel-ambar" : "bg-panel-naranja",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {nombreDelModulo[reserva.modulo]} · {reserva.personas} pers.
                  </span>
                  <span className="block truncate text-sm text-panel-muted">{reserva.titular}</span>
                </span>
                <span className="shrink-0 text-right text-xs font-semibold text-panel-muted">
                  {rangoPanel(reserva.desde, reserva.hasta)}
                  <span className="block font-normal">N.º {reserva.id}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
