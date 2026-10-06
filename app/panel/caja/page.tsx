import { Download } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { atajosDeCaja, periodoDeCaja } from "@/app/panel/caja/periodo"
import { cobrosEntre, porForma } from "@/lib/panel/caja"
import { fechaLargaPanel } from "@/lib/panel/formato"
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

export default async function PanelCaja({ searchParams }: PageProps<"/panel/caja">) {
  await exigirPanel("caja")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy)
  const atajos = atajosDeCaja(hoy)
  const activo = atajos.find((atajo) => atajo.desde === desde && atajo.hasta === hasta)?.id

  const cobros = await cobrosEntre(desde, hasta)
  const grupos = porForma(cobros)
  const total = grupos.reduce((suma, grupo) => suma + grupo.total, 0)
  const descuentos = grupos.reduce((suma, grupo) => suma + grupo.descuentos, 0)
  const unDia = desde === hasta
  const periodo = unDia ? fechaLargaPanel(desde) : `Del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Caja</p>
          <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">{periodo}</h1>
        </div>
        {cobros.length ? (
          <a
            href={`/panel/caja/csv?desde=${desde}&hasta=${hasta}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"
          >
            <Download className="size-4" aria-hidden />
            Descargar para Excel
          </a>
        ) : null}
      </header>

      <div className="mt-5 flex flex-wrap items-end gap-2">
        <nav aria-label="Períodos" className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-auto md:overflow-visible md:px-0 md:pb-0">
          {atajos.map((atajo) => (
            <Link
              key={atajo.id}
              href={`/panel/caja?desde=${atajo.desde}&hasta=${atajo.hasta}`}
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

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 rounded-2xl bg-panel-ink px-4 py-3 text-white lg:col-span-1">
          <dt className="text-xs font-bold tracking-wide text-white/70 uppercase">Total cobrado</dt>
          <dd className="font-display mt-1 text-3xl tracking-tight">{pesos(total)}</dd>
          <dd className="text-xs text-white/70">
            {cobros.length} {cobros.length === 1 ? "cobro" : "cobros"}
            {descuentos ? ` · ${pesos(descuentos)} de descuento en efectivo` : ""}
          </dd>
        </div>
        {grupos.map((grupo) => (
          <div key={grupo.id} className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{grupo.nombre}</dt>
            <dd className="font-display mt-1 text-2xl tracking-tight md:text-3xl">{pesos(grupo.total)}</dd>
            <dd className="text-xs text-panel-muted">
              {grupo.cobros.length} {grupo.cobros.length === 1 ? "cobro" : "cobros"}
            </dd>
          </div>
        ))}
      </dl>

      {cobros.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-white p-6 text-sm text-panel-muted shadow-[0_8px_28px_rgba(58,42,24,0.06)]">No hay cobros registrados en este período.</p>
      ) : (
        <div className="mt-6 grid items-start gap-4 xl:grid-cols-3">
          {grupos
            .filter((grupo) => grupo.cobros.length)
            .map((grupo) => (
              <section key={grupo.id} aria-label={`Cobros en ${grupo.nombre.toLowerCase()}`} className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
                <h2 className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-xl tracking-tight">Total {grupo.nombre.toLowerCase()}</span>
                  <span className="font-semibold tabular-nums">{pesos(grupo.total)}</span>
                </h2>
                <ul className="mt-3 divide-y divide-panel-line text-sm">
                  {grupo.cobros.map((cobro) => (
                    <li key={cobro.id} className="flex items-start justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block">
                          {unDia ? null : <span className="text-panel-muted">{fechaCorta(cobro.fecha)} · </span>}
                          <Link href={`/panel/reservas/${cobro.reservaId}`} className="font-semibold hover:underline">
                            Reserva {cobro.reservaId}
                          </Link>
                        </span>
                        <span className="block truncate text-xs text-panel-muted">
                          {cobro.titular} · {hora.format(cobro.hora)}
                          {cobro.registradoPor ? ` · ${cobro.registradoPor}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right font-semibold tabular-nums">
                        {pesos(cobro.importe)}
                        {cobro.descuento ? <span className="block text-xs font-normal text-panel-muted">−{pesos(cobro.descuento)} desc.</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </main>
  )
}
