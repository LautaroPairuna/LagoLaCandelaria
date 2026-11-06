import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado"
import { estilosDeEstado } from "@/lib/panel/estados"
import { estadosDe, filtrosDeEstado, filtrosDeTipo, modulosDe, type FiltrosDePuerta } from "@/lib/panel/filtros-puerta"
import { fechaLargaPanel, nombreDelMes, rangoPanel } from "@/lib/panel/formato"
import { ocupacionPorDia, porcentaje, textoDelPorcentaje, type DiaOcupado } from "@/lib/panel/ocupacion"
import { esMes, lineas, nombreDelModulo, reservasDelMes, sumarMes, type ReservaDelMes } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { estadoDelDia, mapaDeEspeciales, type TipoDia } from "@/lib/predio/calendario"
import { aFechaDb, deFechaDb, diaDeLaSemana, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { AFORO_DEL_PREDIO } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"
import { cn } from "cn"

export const metadata: Metadata = { title: "Ocupación" }

const diasDeLaSemana = ["L", "M", "M", "J", "V", "S", "D"]
const numero = new Intl.NumberFormat("es-AR")

type Filtro = { estado: FiltrosDePuerta["estado"]; tipo: FiltrosDePuerta["tipo"] }

function enlace(mes: string, dia?: string, filtro?: Filtro) {
  const params = new URLSearchParams({ mes })
  if (dia) params.set("dia", dia)
  if (filtro && filtro.estado !== "todas") params.set("estado", filtro.estado)
  if (filtro && filtro.tipo !== "todas") params.set("tipo", filtro.tipo)
  return `/panel/ocupacion?${params}`
}

function elegir<T extends string>(lista: readonly { id: T }[], valor: string | undefined, porDefecto: T): T {
  return lista.find((opcion) => opcion.id === valor)?.id ?? porDefecto
}

const coincideEstado = (reserva: ReservaDelMes, estado: Filtro["estado"]) => estado === "todas" || estadosDe[estado].includes(reserva.visible)
const coincideTipo = (reserva: ReservaDelMes, tipo: Filtro["tipo"]) => tipo === "todas" || modulosDe[tipo].includes(reserva.modulo)

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

export default async function PanelOcupacion({ searchParams }: PageProps<"/panel/ocupacion">) {
  await exigirPanel("ocupacion")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const mesPedido = primero(params.mes)
  const mes = esMes(mesPedido) ? mesPedido : hoy.slice(0, 7)
  const diaPedido = primero(params.dia)
  const dia = diaPedido?.startsWith(mes) && /^\d{4}-\d{2}-\d{2}$/.test(diaPedido) ? diaPedido : hoy.startsWith(mes) ? hoy : undefined

  const inicio = `${mes}-01`
  const fin = sumarDiasIso(`${sumarMes(mes, 1)}-01`, -1)
  const [reservas, especiales] = await Promise.all([
    reservasDelMes(mes),
    db().diaEspecial.findMany({ where: { fecha: { gte: aFechaDb(inicio), lte: aFechaDb(fin) } } }),
  ])
  const mapa = mapaDeEspeciales(especiales.map((item) => ({ fecha: deFechaDb(item.fecha), tipo: item.tipo as TipoDia, motivo: item.motivo })))
  const ocupacion = ocupacionPorDia(reservas, inicio, fin)
  const desplazamiento = (diaDeLaSemana(inicio) + 6) % 7
  const delDia = dia ? reservas.filter((reserva) => reserva.desde <= dia && reserva.hasta >= dia) : []
  const filtro: Filtro = { estado: elegir(filtrosDeEstado, primero(params.estado), "todas"), tipo: elegir(filtrosDeTipo, primero(params.tipo), "todas") }
  const filtradas = delDia.filter((reserva) => coincideEstado(reserva, filtro.estado) && coincideTipo(reserva, filtro.tipo))

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3 md:gap-4">
        <div className="w-full md:w-auto">
          <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
            <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Panel de Ocupación</p>
            {dia !== hoy ? (
              <Link href={enlace(hoy.slice(0, 7), hoy)} className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
                Hoy
              </Link>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-1 md:mt-2 md:gap-2">
            <Link href={enlace(sumarMes(mes, -1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Mes anterior">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <h1 className="font-display min-w-0 px-0.5 text-center text-2xl leading-none tracking-tight whitespace-nowrap md:min-w-48 md:text-4xl">{nombreDelMes(mes)}</h1>
            <Link href={enlace(sumarMes(mes, 1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Mes siguiente">
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
        <p className="text-sm text-panel-muted">
          Capacidad del predio: <strong className="text-panel-ink">{numero.format(AFORO_DEL_PREDIO)} personas por día</strong>
        </p>
      </header>

      <section aria-label="Calendario de ocupación" className="mt-6 rounded-3xl bg-white p-2 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-panel-muted md:gap-2">
          {diasDeLaSemana.map((letra, indice) => (
            <span key={indice} className="py-1">
              {letra}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: desplazamiento }, (_, indice) => (
            <span key={`vacio-${indice}`} aria-hidden />
          ))}
          {fechasEntre(inicio, fin).map((fecha) => (
            <Dia key={fecha} fecha={fecha} hoy={hoy} elegido={fecha === dia} cerrado={!estadoDelDia(fecha, mapa).abierto} ocupado={ocupacion.get(fecha)} href={enlace(mes, fecha, filtro)} />
          ))}
        </div>
        <ul aria-label="Referencias" className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 px-1 text-[0.7rem] font-semibold text-panel-muted md:mt-4 md:px-0 md:text-xs">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-6 rounded-full bg-panel-naranja" /> Personas reservadas sobre la capacidad del predio
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-panel-ambar" /> Tiene reservas a confirmar
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3 rounded bg-panel" /> Predio cerrado
          </li>
        </ul>
      </section>

      <div className="mt-6">
        {dia ? (
          <ResumenDelDia dia={dia} ocupado={ocupacion.get(dia)} cerrado={!estadoDelDia(dia, mapa).abierto}>
            <ReservasDelDia
              total={delDia.length}
              reservas={filtradas}
              estados={filtrosDeEstado.map((opcion) => ({
                ...opcion,
                cantidad: delDia.filter((reserva) => coincideEstado(reserva, opcion.id) && coincideTipo(reserva, filtro.tipo)).length,
                href: enlace(mes, dia, { ...filtro, estado: opcion.id }),
                activo: filtro.estado === opcion.id,
              }))}
              tipos={filtrosDeTipo.map((opcion) => ({
                ...opcion,
                cantidad: delDia.filter((reserva) => coincideTipo(reserva, opcion.id) && coincideEstado(reserva, filtro.estado)).length,
                href: enlace(mes, dia, { ...filtro, tipo: opcion.id }),
                activo: filtro.tipo === opcion.id,
              }))}
            />
          </ResumenDelDia>
        ) : (
          <p className="rounded-3xl bg-white p-5 text-sm text-panel-muted shadow-[0_8px_28px_rgba(58,42,24,0.06)]">Tocá un día para ver su detalle.</p>
        )}
      </div>
    </main>
  )
}

function Dia({ fecha, hoy, elegido, cerrado, ocupado, href }: { fecha: string; hoy: string; elegido: boolean; cerrado: boolean; ocupado?: DiaOcupado; href: string }) {
  const valor = ocupado ? porcentaje(ocupado.personas, AFORO_DEL_PREDIO) : 0
  const detalle = ocupado
    ? `: ${textoDelPorcentaje(ocupado.personas, AFORO_DEL_PREDIO)} de ocupación, ${ocupado.personas} personas, ${lineas.map((linea) => `${ocupado.porLinea[linea.id]} de ${linea.nombre.toLowerCase()}`).join(", ")}${ocupado.pendientes ? `, ${ocupado.pendientes} a confirmar` : ""}`
    : cerrado
      ? ", predio cerrado"
      : ", sin reservas"

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={`${fechaLargaPanel(fecha)}${detalle}`}
      aria-current={elegido ? "date" : undefined}
      className={cn(
        "flex min-h-[3.4rem] flex-col items-center gap-1 rounded-xl border p-1 text-sm transition md:min-h-[8.5rem] md:items-stretch md:gap-1.5 md:p-2.5",
        cerrado && !ocupado ? "border-transparent bg-panel text-panel-muted" : "border-panel-line bg-white hover:border-panel-muted",
        elegido && "border-panel-ink ring-1 ring-panel-ink",
      )}
    >
      <span className="flex w-full items-center justify-center md:justify-between">
        <span className={cn("grid size-7 place-items-center rounded-full text-sm font-semibold md:size-6", fecha === hoy && "bg-panel-ink text-white")}>
          {Number(fecha.slice(8))}
        </span>
        {ocupado?.pendientes ? <span className="hidden size-2 rounded-full bg-panel-ambar md:block" aria-hidden /> : null}
      </span>

      {ocupado ? (
        <>
          <span className="flex items-baseline gap-1.5 md:mt-1">
            <span className="text-[0.7rem] leading-none font-bold text-panel-tostado md:font-display md:text-2xl md:font-normal md:tracking-tight md:text-panel-ink">
              {textoDelPorcentaje(ocupado.personas, AFORO_DEL_PREDIO)}
            </span>
            <span className="hidden text-xs text-panel-muted md:inline">· {numero.format(ocupado.personas)} pers.</span>
          </span>
          <span className="h-1 w-full overflow-hidden rounded-full bg-panel-claro md:h-1.5" aria-hidden>
            <span className="block h-full rounded-full bg-panel-naranja" style={{ width: `${Math.min(valor, 100)}%`, minWidth: 3 }} />
          </span>
          <span className="mt-auto hidden space-y-0.5 text-xs md:block" aria-hidden>
            {lineas.map((linea) =>
              ocupado.porLinea[linea.id] ? (
                <span key={linea.id} className="flex justify-between gap-2">
                  <span className="truncate text-panel-muted">{linea.id === "familia" ? "Familia" : linea.nombre}</span>
                  <span className="font-semibold">{ocupado.porLinea[linea.id]}</span>
                </span>
              ) : null,
            )}
          </span>
        </>
      ) : cerrado ? (
        <span className="mt-auto hidden text-[0.68rem] md:block">Cerrado</span>
      ) : null}
    </Link>
  )
}

function ResumenDelDia({ dia, ocupado, cerrado, children }: { dia: string; ocupado?: DiaOcupado; cerrado: boolean; children: ReactNode }) {
  return (
    <section aria-label="Resumen del día" className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="font-display text-xl tracking-tight md:text-2xl">
            {fechaLargaPanel(dia)}
            {cerrado ? <span className="ml-3 align-middle font-sans text-sm font-semibold text-panel-muted">Predio cerrado</span> : null}
          </h2>
          <Link href={`/panel/lugares?fecha=${dia}`} className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
            Ver los lugares de este día
          </Link>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Dato termino="Ocupación" valor={textoDelPorcentaje(ocupado?.personas ?? 0, AFORO_DEL_PREDIO)} pie={`${numero.format(ocupado?.personas ?? 0)} de ${numero.format(AFORO_DEL_PREDIO)} personas`} />
          <Dato
            termino="Reservas"
            valor={numero.format(ocupado?.reservas ?? 0)}
            pie={ocupado?.pendientes ? `${ocupado.pendientes} a confirmar` : ocupado ? "Todas confirmadas" : "Ninguna"}
          />
          <div className="col-span-2 rounded-2xl bg-panel px-4 py-3 md:col-span-1">
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">Por propuesta</dt>
            {lineas.map((linea) => (
              <dd key={linea.id} className="mt-1 flex justify-between gap-3 text-sm">
                <span className="text-panel-muted">{linea.nombre}</span>
                <span className="font-semibold">{numero.format(ocupado?.porLinea[linea.id] ?? 0)}</span>
              </dd>
            ))}
          </div>
        </dl>
      </div>
      {children}
    </section>
  )
}

function Dato({ termino, valor, pie }: { termino: string; valor: string; pie: string }) {
  return (
    <div className="rounded-2xl bg-panel px-4 py-3">
      <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{termino}</dt>
      <dd className="font-display mt-1 text-2xl tracking-tight">{valor}</dd>
      <dd className="text-xs text-panel-muted">{pie}</dd>
    </div>
  )
}

type Boton = { id: string; nombre: string; cantidad: number; href: string; activo: boolean }

function ReservasDelDia({ total, reservas, estados, tipos }: { total: number; reservas: ReservaDelMes[]; estados: Boton[]; tipos: Boton[] }) {
  return (
    <section aria-labelledby="reservas-del-dia" className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
      <h2 id="reservas-del-dia" className="font-display flex items-center gap-3 text-xl tracking-tight md:text-2xl">
        Reservas del día
        <span className="rounded-full bg-panel px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">
          {reservas.length === total ? total : `${reservas.length} de ${total}`}
        </span>
      </h2>
      {total ? (
        <div className="mt-3 space-y-2">
          <Botones etiqueta="Estado" botones={estados} />
          <Botones etiqueta="Propuesta" botones={tipos} />
        </div>
      ) : null}
      {reservas.length === 0 ? (
        <p className="mt-4 text-sm text-panel-muted">{total ? "Ninguna reserva coincide con los filtros." : "No hay reservas para este día."}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {reservas.map((reserva) => (
            <li key={reserva.id}>
              <Link
                href={`/panel/reservas/${reserva.id}`}
                className={cn("flex h-full flex-col gap-2 rounded-3xl border-2 border-l-8 p-4 hover:brightness-95", estilosDeEstado[reserva.visible].tarjeta, estilosDeEstado[reserva.visible].borde)}
              >
                <span className="text-xs font-bold tracking-wide text-panel-muted uppercase">
                  {nombreDelModulo[reserva.modulo]} · {reserva.codigo}
                </span>
                <span className="font-display text-xl leading-tight tracking-tight">{reserva.titular}</span>
                <span className="text-sm text-panel-ink/80">
                  {reserva.personas} {reserva.personas === 1 ? "persona" : "personas"} · {rangoPanel(reserva.desde, reserva.hasta)}
                </span>
                <InsigniaDeEstado estado={reserva.visible} className="mt-auto w-fit" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Botones({ etiqueta, botones }: { etiqueta: string; botones: Boton[] }) {
  return (
    <nav aria-label={`Filtrar por ${etiqueta.toLowerCase()}`} className="flex flex-wrap items-center gap-2">
      <span className="w-full shrink-0 text-xs font-bold sm:w-20 tracking-wide text-panel-muted uppercase">{etiqueta}</span>
      {botones.map((boton) =>
        boton.cantidad || boton.activo || boton.id === "todas" ? (
          <Link
            key={boton.id}
            href={boton.href}
            scroll={false}
            aria-current={boton.activo ? "true" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold",
              boton.activo ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
            )}
          >
            {boton.nombre}
            <span className={cn("text-xs font-bold", boton.activo ? "text-white/75" : "text-panel-muted")}>{boton.cantidad}</span>
          </Link>
        ) : null,
      )}
    </nav>
  )
}
