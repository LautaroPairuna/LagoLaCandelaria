import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { estadoDelDia, mapaDeEspeciales, type TipoDia } from "@/lib/predio/calendario"
import { aFechaDb, deFechaDb, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
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
import { armarSemanas } from "@/lib/panel/semanas"
import { exigirPanel } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"
import { cn } from "cn"

export const metadata: Metadata = { title: "Reservas" }

const diasDeLaSemana = ["L", "M", "M", "J", "V", "S", "D"]
const CARRILES = 3

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

  const semanas = armarSemanas(mes, reservas, CARRILES)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3 md:gap-4">
        <div className="w-full md:w-auto">
          <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
            <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Panel de Reservas</p>
            {mes !== hoy.slice(0, 7) || dia !== hoy ? (
              <Link
                href={enlace({ mes: hoy.slice(0, 7), linea, dia: hoy })}
                className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted"
              >
                Hoy
              </Link>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-1 md:mt-2 md:gap-2">
            <Link href={enlace({ mes: sumarMes(mes, -1), linea })} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Mes anterior">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <h1 className="font-display min-w-0 px-0.5 text-center text-2xl leading-none tracking-tight whitespace-nowrap md:min-w-48 md:text-4xl">{nombreDelMes(mes)}</h1>
            <Link href={enlace({ mes: sumarMes(mes, 1), linea })} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Mes siguiente">
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
        <nav aria-label="Propuesta" className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-auto md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          {[{ id: undefined, nombre: "Todas" }, ...lineas].map((item) => {
            const activa = item.id === linea
            return (
              <Link
                key={item.nombre}
                href={enlace({ mes, linea: item.id, dia })}
                aria-current={activa ? "true" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
                  activa ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
                )}
              >
                {item.nombre}
              </Link>
            )
          })}
        </nav>
      </header>

      <div className="mt-6 space-y-6">
        <section aria-label="Calendario" className="rounded-3xl bg-white p-2 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-panel-muted md:gap-2">
            {diasDeLaSemana.map((letra, indice) => (
              <span key={indice} className="py-1">
                {letra}
              </span>
            ))}
          </div>
          <div className="mt-1 space-y-1 md:space-y-2">
            {semanas.map((semana) => (
              <div key={semana.dias.find(Boolean)} className="relative">
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {semana.dias.map((fecha, columna) => {
                    if (!fecha) return <span key={`vacio-${columna}`} aria-hidden />
                    const cuenta = porDia.get(fecha)
                    const cerrado = !estadoDelDia(fecha, mapa).abierto
                    const elegido = fecha === dia
                    return (
                      <Link
                        key={fecha}
                        href={enlace({ mes, linea, dia: elegido ? undefined : fecha })}
                        scroll={false}
                        aria-label={`${fechaLargaPanel(fecha)}${cuenta ? `: ${cuenta.pendientes} a confirmar, ${cuenta.confirmadas} confirmadas` : ""}${cerrado ? ", predio cerrado" : ""}`}
                        aria-current={elegido ? "date" : undefined}
                        className={cn(
                          "flex min-h-[3.4rem] flex-col items-center gap-1 rounded-xl border p-1 text-sm transition md:min-h-[8.25rem] md:items-stretch md:gap-0 md:p-2",
                          cerrado ? "border-transparent bg-panel text-panel-muted" : "border-panel-line bg-white hover:border-panel-muted",
                          elegido && "border-panel-ink ring-1 ring-panel-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-7 place-items-center rounded-full text-sm font-semibold md:size-6",
                            fecha === hoy && "bg-panel-ink text-white",
                          )}
                        >
                          {Number(fecha.slice(8))}
                        </span>
                        {cuenta ? <PuntosDelDia pendientes={cuenta.pendientes} confirmadas={cuenta.confirmadas} /> : null}
                        {!cuenta && cerrado ? <span className="mt-auto hidden text-[0.68rem] md:block">Cerrado</span> : null}
                      </Link>
                    )
                  })}
                </div>
                <div className="pointer-events-none absolute inset-0 hidden auto-rows-[1.35rem] grid-cols-7 content-start gap-x-2 gap-y-0.5 px-0 pt-[2.4rem] md:grid" aria-hidden={false}>
                  {semana.barras.map((barra) => (
                    <Link
                      key={`${barra.reserva.id}-${barra.columna}`}
                      href={`/panel/reservas/${barra.reserva.id}`}
                      title={`${barra.reserva.titular} · ${nombreDelModulo[barra.reserva.modulo]} · ${barra.reserva.personas} pers. · ${rangoPanel(barra.reserva.desde, barra.reserva.hasta)}${barra.reserva.estado === "PENDIENTE" ? " · a confirmar" : ""}`}
                      aria-label={`${barra.reserva.titular}, ${nombreDelModulo[barra.reserva.modulo]}, ${barra.reserva.personas} personas, ${rangoPanel(barra.reserva.desde, barra.reserva.hasta)}, ${barra.reserva.estado === "PENDIENTE" ? "a confirmar" : "confirmada"}`}
                      style={{ gridColumn: `${barra.columna + 1} / span ${barra.largo}`, gridRow: barra.carril + 1 }}
                      className={cn(
                        "pointer-events-auto mx-1 flex items-center gap-1 truncate border px-2 text-xs leading-none font-semibold",
                        barra.reserva.estado === "PENDIENTE"
                          ? "border-dashed border-panel-ambar bg-panel-claro text-panel-ink hover:bg-[#f3d3a8]"
                          : "border-panel-naranja bg-panel-naranja text-white hover:bg-panel-tostado",
                        barra.empiezaAca ? "rounded-l-md" : "-ml-2 rounded-l-none border-l-0 pl-3",
                        barra.terminaAca ? "rounded-r-md" : "-mr-2 rounded-r-none border-r-0",
                      )}
                    >
                      <span className="truncate">{barra.reserva.titular}</span>
                      <span className="shrink-0 font-normal opacity-80">· {barra.reserva.personas}</span>
                    </Link>
                  ))}
                  {semana.masPorColumna.map((mas, columna) =>
                    mas && semana.dias[columna] ? (
                      <Link
                        key={`mas-${columna}`}
                        href={enlace({ mes, linea, dia: semana.dias[columna]! })}
                        style={{ gridColumn: columna + 1, gridRow: CARRILES + 1 }}
                        className="pointer-events-auto mx-1 truncate rounded-md px-2 text-xs leading-[1.35rem] font-semibold text-panel-tostado hover:underline"
                      >
                        +{mas} más
                      </Link>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
          <ul aria-label="Referencias" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[0.7rem] font-semibold text-panel-muted md:mt-4 md:gap-x-5 md:gap-y-2 md:px-0 md:text-xs">
            <li className="flex items-center gap-2">
              <span className="h-3.5 w-6 rounded bg-panel-naranja" /> Confirmada
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3.5 w-6 rounded border border-dashed border-panel-ambar bg-panel-claro" /> A confirmar
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3.5 rounded bg-panel" /> Predio cerrado
            </li>
            <li className="hidden items-center gap-2 md:flex">Una estadía larga se ve como una sola barra. Tocá una barra para abrir la reserva y un día para ver solo ese día.</li>
          </ul>
        </section>

        <div className="space-y-4">
          {dia ? (
            <ListaReservas
              titulo={fechaLargaPanel(dia)}
              reservas={visibles}
              mostrarEstado
              vacio={estadoDelDia(dia, mapa).abierto ? "No hay reservas ese día." : "El predio está cerrado ese día."}
              accion={
                <Link href={enlace({ mes, linea })} scroll={false} className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
                  Ver todo el mes
                </Link>
              }
            />
          ) : (
            <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-2">
              <ListaReservas titulo="A confirmar" reservas={pendientes} vacio="No hay pedidos esperando confirmación." />
              <ListaReservas titulo="Confirmadas" reservas={confirmadas} vacio="Todavía no hay reservas confirmadas." />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function PuntosDelDia({ pendientes, confirmadas }: { pendientes: number; confirmadas: number }) {
  const total = pendientes + confirmadas
  return (
    <span className="flex h-2 items-center gap-0.5 md:hidden" aria-hidden>
      {total > 3 ? (
        <span className="text-[0.7rem] leading-none font-bold text-panel-tostado">{total}</span>
      ) : (
        <>
          {Array.from({ length: confirmadas }, (_, indice) => (
            <span key={`c${indice}`} className="size-2 rounded-full bg-panel-naranja" />
          ))}
          {Array.from({ length: pendientes }, (_, indice) => (
            <span key={`p${indice}`} className="size-2 rounded-full border border-panel-ambar bg-panel-claro" />
          ))}
        </>
      )}
    </span>
  )
}

function ListaReservas({
  titulo,
  reservas,
  vacio,
  mostrarEstado = false,
  accion,
}: {
  titulo: string
  reservas: ReservaDelMes[]
  vacio: string
  mostrarEstado?: boolean
  accion?: ReactNode
}) {
  return (
    <section aria-label={titulo} className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-3 font-display text-xl tracking-tight md:text-2xl">
          {titulo}
          <span className="rounded-full bg-panel px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{reservas.length}</span>
        </h2>
        {accion}
      </div>
      {reservas.length === 0 ? (
        <p className="mt-3 text-sm text-panel-muted">{vacio}</p>
      ) : (
        <ul className="mt-3 divide-y divide-panel-line">
          {reservas.map((reserva) => (
            <li key={reserva.id}>
              <Link href={`/panel/reservas/${reserva.id}`} className="flex items-start gap-3 py-3.5 hover:bg-panel/60 md:py-3">
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
                  <span className="flex items-center gap-2 text-sm text-panel-muted">
                    <span className="truncate">{reserva.titular}</span>
                    {mostrarEstado && reserva.estado === "PENDIENTE" ? (
                      <span className="shrink-0 rounded-full bg-panel-claro px-2 py-0.5 text-[0.7rem] font-bold whitespace-nowrap text-panel-tostado">A confirmar</span>
                    ) : null}
                  </span>
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
