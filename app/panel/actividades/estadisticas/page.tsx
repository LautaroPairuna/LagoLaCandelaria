import type { Metadata } from "next"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { PestanasDeActividades } from "@/components/panel/actividades/pestanas"
import { SelectorDePeriodo, textoDelPeriodo } from "@/components/panel/caja/partes"
import { actividadesConProfesor, nombreDeActividad } from "@/lib/panel/actividades"
import { estadisticasDeActividades } from "@/lib/panel/estadisticas-actividades"
import { exigirPanel } from "@/lib/panel/sesion"
import { hoyEnElPredio } from "@/lib/predio/fechas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Estadísticas de actividades" }

// Un solo tono para las barras (validado contra el fondo del panel): la cantidad se lee
// por el largo, no por el color.
const BARRA = "#c2611a"
const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
const numero = new Intl.NumberFormat("es-AR")
const decimal = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 })

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

const fechaCorta = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/")

export default async function EstadisticasDeActividades({ searchParams }: PageProps<"/panel/actividades/estadisticas">) {
  await exigirPanel("general")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy)
  const { total, visitantes, ranking, tramos, profesores } = await estadisticasDeActividades(desde, hasta)
  const maximo = Math.max(1, ...ranking.map((fila) => fila.cantidad))
  const maximoTramo = Math.max(1, ...tramos.map((tramo) => tramo.cantidad))
  const masElegida = ranking[0]?.cantidad ? ranking[0] : null
  const porSemana = tramos.some((tramo) => tramo.desde !== tramo.hasta)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Actividades · Estadísticas</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">{textoDelPeriodo(desde, hasta)}</h1>
        <PestanasDeActividades actividades={actividadesConProfesor} activa="estadisticas" conEstadisticas />
      </header>
      <SelectorDePeriodo ruta="/panel/actividades/estadisticas" hoy={hoy} desde={desde} hasta={hasta} />

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { termino: "Actividades realizadas", valor: numero.format(total) },
          { termino: "Visitantes que ingresaron", valor: numero.format(visitantes) },
          { termino: "Promedio por visitante", valor: visitantes ? decimal.format(total / visitantes) : "—" },
          { termino: "La más elegida", valor: masElegida ? masElegida.nombre : "—" },
        ].map((dato) => (
          <div key={dato.termino} className={cn("rounded-2xl bg-white px-4 py-3", sombra)}>
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{dato.termino}</dt>
            <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Qué actividades se hicieron más" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
        <h2 className="font-display text-2xl tracking-tight">Qué actividades se hicieron más</h2>
        <p className="mt-1 text-sm text-panel-muted">Cantidad de veces y qué parte de los visitantes la hizo.</p>
        <ul className="mt-4 space-y-3">
          {ranking.map((fila) => (
            <li key={fila.slug} className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_9rem]">
              <span className="truncate text-sm font-semibold">{fila.nombre}</span>
              <span className="group relative block h-7" title={`${fila.nombre}: ${numero.format(fila.cantidad)} veces, ${fila.porcentaje} % de los visitantes`}>
                <span className="absolute inset-y-0 left-0 w-full rounded-r bg-panel/70" aria-hidden />
                <span
                  className="absolute inset-y-0 left-0 rounded-r-[4px] transition-[filter] group-hover:brightness-110"
                  style={{ width: `${(fila.cantidad / maximo) * 100}%`, background: BARRA, minWidth: fila.cantidad ? "4px" : 0 }}
                  aria-hidden
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-xs font-bold text-panel-ink sm:hidden">
                  <span className="rounded bg-white/85 px-1">
                    {numero.format(fila.cantidad)} · {fila.porcentaje} %
                  </span>
                </span>
              </span>
              <span className="hidden text-right text-sm tabular-nums sm:block">
                <strong>{numero.format(fila.cantidad)}</strong> <span className="text-panel-muted">· {fila.porcentaje} %</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Actividades por día" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl tracking-tight">{porSemana ? "Actividades por semana" : "Actividades por día"}</h2>
          <p className="text-sm text-panel-muted">Pasá el mouse (o tocá) una barra para ver el número.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="flex h-48 min-w-full items-end gap-[2px] border-b border-panel-line pb-px" style={{ minWidth: `${tramos.length * 14}px` }}>
            {tramos.map((tramo) => {
              const texto = `${tramo.desde === tramo.hasta ? fechaCorta(tramo.desde) : `${fechaCorta(tramo.desde)} al ${fechaCorta(tramo.hasta)}`}: ${numero.format(tramo.cantidad)}`
              return (
                <span key={tramo.desde} tabIndex={0} title={texto} aria-label={texto} className="group relative flex h-full min-w-[10px] flex-1 items-end focus:outline-none">
                  <span
                    className="block w-full rounded-t-[4px] group-hover:brightness-110 group-focus:brightness-110"
                    style={{ height: `${(tramo.cantidad / maximoTramo) * 100}%`, background: BARRA, minHeight: tramo.cantidad ? "3px" : 0 }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-panel-ink px-2 py-1 text-xs font-semibold whitespace-nowrap text-white group-hover:block group-focus:block">
                    {texto}
                  </span>
                </span>
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-panel-muted tabular-nums">
            <span>{fechaCorta(desde)}</span>
            <span>Máximo: {numero.format(maximoTramo === 1 && !tramos.some((tramo) => tramo.cantidad) ? 0 : maximoTramo)}</span>
            <span>{fechaCorta(hasta)}</span>
          </div>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-panel-tostado">Ver como tabla</summary>
          <table className="mt-2 w-full max-w-md text-left">
            <thead className="text-xs text-panel-muted uppercase">
              <tr>
                <th className="py-1 font-bold">{porSemana ? "Semana" : "Día"}</th>
                <th className="py-1 text-right font-bold">Actividades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-line">
              {tramos
                .filter((tramo) => tramo.cantidad)
                .map((tramo) => (
                  <tr key={tramo.desde}>
                    <td className="py-1">{tramo.desde === tramo.hasta ? fechaCorta(tramo.desde) : `${fechaCorta(tramo.desde)} al ${fechaCorta(tramo.hasta)}`}</td>
                    <td className="py-1 text-right tabular-nums">{numero.format(tramo.cantidad)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </section>

      <section aria-label="Por profesor" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
        <h2 className="font-display text-2xl tracking-tight">Por profesor</h2>
        {profesores.length === 0 ? (
          <p className="mt-2 text-sm text-panel-muted">Todavía no hay actividades marcadas en este período.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-panel-line text-xs font-bold tracking-wide text-panel-muted uppercase">
              <tr>
                <th className="py-2 font-bold">Profesor</th>
                <th className="py-2 font-bold">Actividades</th>
                <th className="py-2 text-right font-bold">Marcadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-line">
              {profesores.map((fila) => (
                <tr key={fila.nombre}>
                  <td className="py-2.5 font-semibold">{fila.nombre}</td>
                  <td className="py-2.5 text-panel-muted">{fila.actividades.map(nombreDeActividad).join(", ")}</td>
                  <td className="py-2.5 text-right tabular-nums">{numero.format(fila.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
