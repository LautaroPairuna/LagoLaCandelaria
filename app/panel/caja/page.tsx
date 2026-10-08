import { ArrowDownLeft, ArrowUpRight, Download, History, Landmark, Wallet } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { atajosDeCaja, periodoDeCaja } from "@/app/panel/caja/periodo"
import { BorrarMovimiento } from "@/components/panel/caja/borrar-movimiento"
import { CargarMovimiento } from "@/components/panel/caja/cargar-movimiento"
import { CobrarPendiente } from "@/components/panel/caja/cobrar-pendiente"
import { cobrosAnticipados, esFiltroDeCajon, libroDeCaja, pendientesDeCobro, type Anticipado, type FiltroDeCajon, type Pendiente } from "@/lib/panel/caja"
import { fechaLargaPanel, rangoConMesPanel } from "@/lib/panel/formato"
import { nombreDelCajon, type Renglon } from "@/lib/panel/libro-caja"
import { exigirPanel } from "@/lib/panel/sesion"
import { hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Caja" }

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

function fechaCorta(iso: string) {
  return iso.split("-").reverse().join("/")
}

const filtros: { id: FiltroDeCajon; nombre: string }[] = [
  { id: "todos", nombre: "Todos" },
  { id: "EFECTIVO", nombre: "Efectivo" },
  { id: "BANCO", nombre: "Banco" },
]

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

export default async function PanelCaja({ searchParams }: PageProps<"/panel/caja">) {
  await exigirPanel("caja")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy)
  const pedido = primero(params.cajon)
  const filtro: FiltroDeCajon = esFiltroDeCajon(pedido) ? pedido : "todos"
  const atajos = atajosDeCaja(hoy)
  const activo = atajos.find((atajo) => atajo.desde === desde && atajo.hasta === hasta)?.id
  const enlace = (cambios: Record<string, string>) => `/panel/caja?${new URLSearchParams({ desde, hasta, ...(filtro !== "todos" ? { cajon: filtro } : {}), ...cambios })}`

  const [{ renglones, resumen }, pendientes, anticipados] = await Promise.all([libroDeCaja(desde, hasta), pendientesDeCobro(), cobrosAnticipados()])
  const visibles = filtro === "todos" ? renglones : renglones.filter((renglon) => renglon.cajon === filtro)
  const periodo = desde === hasta ? fechaLargaPanel(desde) : `Del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`
  const adeudado = pendientes.reduce((suma, item) => suma + item.saldo, 0)
  const urgente = pendientes.filter((item) => item.vino).reduce((suma, item) => suma + item.saldo, 0)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Caja</p>
          <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">{periodo}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/panel/caja/actividad"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"
          >
            <History className="size-4" aria-hidden />
            Actividad
          </Link>
          <a
            href={`/panel/caja/csv?${new URLSearchParams({ desde, hasta, cajon: filtro })}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"
          >
            <Download className="size-4" aria-hidden />
            Exportar a Excel
          </a>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-end gap-2">
        <nav aria-label="Períodos" className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-auto md:overflow-visible md:px-0 md:pb-0">
          {atajos.map((atajo) => (
            <Link
              key={atajo.id}
              href={enlace({ desde: atajo.desde, hasta: atajo.hasta })}
              aria-current={activo === atajo.id ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
                activo === atajo.id ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
              )}
            >
              {atajo.nombre}
            </Link>
          ))}
        </nav>
        <form action="/panel/caja" className="flex flex-wrap items-end gap-2">
          {filtro !== "todos" ? <input type="hidden" name="cajon" value={filtro} /> : null}
          <label className="text-xs font-semibold text-panel-muted">
            Desde
            <input type="date" name="desde" defaultValue={desde} className="mt-1 block h-10 rounded-xl border border-panel-line bg-white px-3 text-sm text-panel-ink" />
          </label>
          <label className="text-xs font-semibold text-panel-muted">
            Hasta
            <input type="date" name="hasta" defaultValue={hasta} className="mt-1 block h-10 rounded-xl border border-panel-line bg-white px-3 text-sm text-panel-ink" />
          </label>
          <button type="submit" className="h-10 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted">
            Ver
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {resumen.map((cajon) => {
          const Icono = cajon.id === "EFECTIVO" ? Wallet : Landmark
          return (
            <section key={cajon.id} aria-label={cajon.nombre} className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}>
              <h2 className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-panel">
                  <Icono className="size-5 text-panel-tostado" aria-hidden />
                </span>
                <span>
                  <span className="font-display block text-xl leading-tight tracking-tight">{cajon.nombre}</span>
                  <span className="block text-xs text-panel-muted">{cajon.detalle}</span>
                </span>
              </h2>
              <dl className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
                <div className="rounded-2xl bg-[#e6f5e4] px-3 py-2.5">
                  <dt className="text-xs font-bold tracking-wide text-[#24622a] uppercase">Ingreso</dt>
                  <dd className="font-display mt-1 text-lg tracking-tight tabular-nums md:text-2xl">{pesos(cajon.ingreso)}</dd>
                </div>
                <div className="rounded-2xl bg-[#fde9e7] px-3 py-2.5">
                  <dt className="text-xs font-bold tracking-wide text-[#a32020] uppercase">Egreso</dt>
                  <dd className="font-display mt-1 text-lg tracking-tight tabular-nums md:text-2xl">{pesos(cajon.egreso)}</dd>
                </div>
                <div className="rounded-2xl bg-panel-ink px-3 py-2.5 text-white">
                  <dt className="text-xs font-bold tracking-wide text-white/75 uppercase">Balance</dt>
                  <dd className={cn("font-display mt-1 text-lg tracking-tight tabular-nums md:text-2xl", cajon.balance < 0 && "text-[#ffb4ab]")}>{pesos(cajon.balance)}</dd>
                  <dd className="text-[0.7rem] text-white/70">al {fechaCorta(hasta)}</dd>
                </div>
              </dl>
            </section>
          )
        })}
      </div>
      <p className="mt-2 px-1 text-xs text-panel-muted">
        Ingreso y egreso son del período elegido. El balance suma toda la historia hasta el {fechaCorta(hasta)}. Los cobros de reservas entran a la caja cuando el grupo
        llega al predio.
      </p>

      <PendientesDeCobro pendientes={pendientes} adeudado={adeudado} urgente={urgente} />

      {anticipados.length ? <CobrosAnticipados anticipados={anticipados} /> : null}

      <section aria-label="Movimientos" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight">Movimientos</h2>
          <nav aria-label="Cajón" className="flex gap-1.5">
            {filtros.map((item) => (
              <Link
                key={item.id}
                href={enlace({ cajon: item.id })}
                aria-current={filtro === item.id ? "true" : undefined}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-semibold",
                  filtro === item.id ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
                )}
              >
                {item.nombre}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-4 flex">
          <CargarMovimiento hoy={hoy} />
        </div>
        {visibles.length === 0 ? (
          <p className="mt-4 text-sm text-panel-muted">No hay movimientos en este período{filtro !== "todos" ? ` en ${nombreDelCajon[filtro].toLowerCase()}` : ""}.</p>
        ) : (
          <ul className="mt-4 divide-y divide-panel-line">
            {visibles.map((renglon) => (
              <RenglonDeCaja key={renglon.clave} renglon={renglon} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function PendientesDeCobro({ pendientes, adeudado, urgente }: { pendientes: Pendiente[]; adeudado: number; urgente: number }) {
  return (
    <section aria-label="Pendiente de cobro" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl tracking-tight">Pendiente de cobro</h2>
        <p className="text-sm text-panel-muted">Reservas confirmadas que todavía deben plata, de cualquier fecha.</p>
      </div>
      {pendientes.length === 0 ? (
        <p className="mt-3 text-sm text-panel-muted">No hay reservas confirmadas con saldo.</p>
      ) : (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-panel px-4 py-3">
              <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">Total adeudado</dt>
              <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{pesos(adeudado)}</dd>
              <dd className="text-xs text-panel-muted">
                {pendientes.length} {pendientes.length === 1 ? "reserva" : "reservas"}, a precio de lista
              </dd>
            </div>
            <div className="rounded-2xl border-2 border-[#f0b266] bg-[#ffeedb] px-4 py-3">
              <dt className="text-xs font-bold tracking-wide text-[#7a4200] uppercase">De grupos que ya vinieron</dt>
              <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{pesos(urgente)}</dd>
              <dd className="text-xs text-[#7a4200]">Están o estuvieron en el predio: son los más urgentes</dd>
            </div>
          </dl>
          <ul className="mt-4 divide-y divide-panel-line">
            {pendientes.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link href={`/panel/reservas/${item.id}`} className="font-semibold hover:underline">
                      {item.titular}
                    </Link>
                    {item.vino ? (
                      <span className="rounded-full bg-[#f5a13a] px-2 py-0.5 text-xs font-bold text-[#2e1900]">Ya vino</span>
                    ) : (
                      <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-bold text-panel-muted">Todavía no vino</span>
                    )}
                  </span>
                  <span className="block text-sm text-panel-muted">
                    N.º {item.id} · {item.codigo} · {rangoConMesPanel(item.desde, item.hasta)}
                    {item.cobrado ? ` · ya pagó ${pesos(item.cobrado)}` : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold tabular-nums">Debe {pesos(item.saldo)}</span>
                  <span className="block text-xs text-panel-muted">
                    {item.pierdeDescuento ? "Sin descuento: ya pagó una parte por banco" : `En efectivo: ${pesos(item.efectivo)}`}
                  </span>
                </span>
                <CobrarPendiente id={item.id} titular={item.titular} saldo={item.saldo} efectivo={item.efectivo} vino={item.vino} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function CobrosAnticipados({ anticipados }: { anticipados: Anticipado[] }) {
  const total = (cajon: "EFECTIVO" | "BANCO") => anticipados.filter((item) => item.cajon === cajon).reduce((suma, item) => suma + item.importe, 0)
  return (
    <section aria-label="Cobrado por adelantado" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl tracking-tight">Cobrado por adelantado</h2>
        <p className="text-sm text-panel-muted">Señas y pagos de grupos que todavía no llegaron. Entran a la caja el día que llegan.</p>
      </div>
      <p className="mt-3 text-sm">
        En efectivo <strong className="tabular-nums">{pesos(total("EFECTIVO"))}</strong> · Por banco <strong className="tabular-nums">{pesos(total("BANCO"))}</strong>
      </p>
      <ul className="mt-2 divide-y divide-panel-line">
        {anticipados.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
            <span className="min-w-0 flex-1">
              <Link href={`/panel/reservas/${item.reservaId}`} className="font-semibold hover:underline">
                {item.titular} · N.º {item.reservaId}
              </Link>
              <span className="block text-xs text-panel-muted">
                Cobrado el {fechaCorta(item.fecha)} en {item.forma === "DEBITO" ? "débito" : item.forma.toLowerCase()}
                {item.registradoPor ? ` por ${item.registradoPor}` : ""} · llega el {fechaCorta(item.llega)}
              </span>
            </span>
            <span className="font-semibold tabular-nums">{pesos(item.importe)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function RenglonDeCaja({ renglon }: { renglon: Renglon }) {
  const ingreso = renglon.sentido === "ingreso"
  const Flecha = ingreso ? ArrowDownLeft : ArrowUpRight
  const tipo =
    renglon.origen === "cobro"
      ? `Cobro de reserva · ${renglon.forma === "DEBITO" ? "débito" : renglon.forma.toLowerCase()}`
      : renglon.tipo === "TRANSFERENCIA"
        ? ingreso
          ? "Pase entre cajones · entra"
          : "Pase entre cajones · sale"
        : ingreso
          ? "Ingreso"
          : "Egreso"
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", ingreso ? "bg-[#e6f5e4] text-[#24622a]" : "bg-[#fde9e7] text-[#a32020]")}>
        <Flecha className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {renglon.origen === "cobro" ? (
            <Link href={`/panel/reservas/${renglon.reservaId}`} className="hover:underline">
              {renglon.concepto} · N.º {renglon.reservaId}
            </Link>
          ) : (
            renglon.concepto
          )}
        </span>
        <span className="block text-xs text-panel-muted">
          {fechaCorta(renglon.fecha)} {hora.format(renglon.hora)} · {nombreDelCajon[renglon.cajon]} · {tipo}
          {renglon.registradoPor ? ` · ${renglon.registradoPor}` : ""}
        </span>
      </span>
      <span className={cn("shrink-0 text-right font-semibold tabular-nums", ingreso ? "text-[#24622a]" : "text-[#a32020]")}>
        {ingreso ? "+" : "−"}
        {pesos(renglon.monto)}
        {renglon.origen === "cobro" && renglon.descuento ? <span className="block text-xs font-normal text-panel-muted">−{pesos(renglon.descuento)} desc.</span> : null}
      </span>
      <span className="w-9 shrink-0">
        {renglon.origen === "movimiento" ? (
          <BorrarMovimiento id={renglon.movimientoId} descripcion={`«${renglon.concepto}» por ${pesos(renglon.monto)}`} />
        ) : (
          <span className="sr-only">Se corrige desde la reserva</span>
        )}
      </span>
    </li>
  )
}
