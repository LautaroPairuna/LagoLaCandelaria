import { Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesLlegada } from "@/components/panel/acciones-llegada"
import { totalesPorForma } from "@/lib/panel/cobros"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { llegadasDelDia, pagosDelDia, type Llegada } from "@/lib/panel/puerta"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Puerta" }

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

export default async function PanelPuerta({ searchParams }: PageProps<"/panel/puerta">) {
  await exigirPanel("puerta")
  const { q } = await searchParams
  const busqueda = (Array.isArray(q) ? q[0] : q)?.slice(0, 60) ?? ""
  const hoy = hoyEnElPredio()
  const [llegadas, todas, pagos] = await Promise.all([llegadasDelDia(hoy, busqueda), llegadasDelDia(hoy), pagosDelDia(hoy)])

  const esperadas = todas.reduce((suma, item) => suma + item.personas, 0)
  const adentro = todas.filter((item) => item.ingresoEn).reduce((suma, item) => suma + item.personas, 0)
  const caja = totalesPorForma(pagos)
  const cobrado = caja.EFECTIVO + caja.DEBITO + caja.TRANSFERENCIA
  const porEntrar = llegadas.filter((item) => !item.ingresoEn)
  const yaEntraron = llegadas.filter((item) => item.ingresoEn)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Panel de Puerta</p>
        <h1 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">{fechaLargaPanel(hoy)}</h1>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { termino: "Grupos hoy", valor: String(todas.length) },
          { termino: "Personas esperadas", valor: String(esperadas) },
          { termino: "Ya ingresaron", valor: `${adentro} de ${esperadas}` },
          { termino: "Cobrado hoy", valor: pesos(cobrado) },
        ].map((dato) => (
          <div key={dato.termino} className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{dato.termino}</dt>
            <dd className="font-display mt-1 text-2xl tracking-tight md:text-3xl">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <form className="relative" role="search">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={busqueda}
              placeholder="Buscar por apellido, institución, DNI o código"
              aria-label="Buscar reserva"
              className="h-12 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-11"
            />
          </form>

          <ListaLlegadas titulo="Por entrar" llegadas={porEntrar} vacio={busqueda ? "Nadie coincide con la búsqueda." : "No queda nadie por entrar."} />
          <ListaLlegadas titulo="Ya ingresaron" llegadas={yaEntraron} vacio="Todavía no ingresó nadie." />
        </div>

        <section aria-label="Registro de pagos" className="h-fit rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
          <h2 className="font-display text-2xl tracking-tight">Caja del día</h2>
          <dl className="mt-3 space-y-1 text-sm">
            {(["EFECTIVO", "DEBITO", "TRANSFERENCIA"] as const).map((forma) => (
              <div key={forma} className="flex justify-between">
                <dt className="text-panel-muted capitalize">{forma === "DEBITO" ? "Débito" : forma.toLowerCase()}</dt>
                <dd className="font-semibold">{pesos(caja[forma])}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-sm font-bold tracking-wide text-panel-muted uppercase">Cobros</h3>
          {pagos.length === 0 ? (
            <p className="mt-2 text-sm text-panel-muted">Todavía no se cobró nada hoy.</p>
          ) : (
            <ul className="mt-2 divide-y divide-panel-line text-sm">
              {pagos.map((pago) => (
                <li key={pago.id} className="flex justify-between gap-3 py-2">
                  <span>
                    <Link href={`/panel/reservas/${pago.reserva.id}`} className="font-semibold hover:underline">
                      {pago.reserva.institucion ?? `${pago.reserva.cliente.nombre} ${pago.reserva.cliente.apellido}`}
                    </Link>
                    <span className="block text-panel-muted">
                      {hora.format(pago.creadoEn)} · {pago.forma === "DEBITO" ? "débito" : pago.forma.toLowerCase()}
                      {pago.registradoPor ? ` · ${pago.registradoPor}` : ""}
                    </span>
                  </span>
                  <span className="text-right font-semibold">
                    {pesos(pago.importe)}
                    {pago.descuento ? <span className="block text-xs font-normal text-panel-muted">−{pesos(pago.descuento)} desc.</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

function ListaLlegadas({ titulo, llegadas, vacio }: { titulo: string; llegadas: Llegada[]; vacio: string }) {
  return (
    <section aria-label={titulo}>
      <h2 className="font-display flex items-center gap-3 text-2xl tracking-tight">
        {titulo}
        <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{llegadas.length}</span>
      </h2>
      {llegadas.length === 0 ? (
        <p className="mt-2 text-sm text-panel-muted">{vacio}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {llegadas.map((llegada) => (
            <li
              key={llegada.id}
              className={cn(
                "grid gap-4 rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5 2xl:grid-cols-[minmax(0,1fr)_auto]",
                llegada.ingresoEn && "opacity-80",
              )}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide text-panel-muted uppercase">
                  {nombreDelModulo[llegada.modulo]} · {llegada.codigo}
                  {llegada.estado === "PENDIENTE" ? (
                    <span className="rounded-full bg-panel-claro px-2 py-0.5 text-panel-tostado normal-case">Sin confirmar</span>
                  ) : null}
                </p>
                <Link href={`/panel/reservas/${llegada.id}`} className="font-display mt-1 block text-2xl tracking-tight hover:underline">
                  {llegada.titular}
                </Link>
                <p className="mt-1 text-sm text-panel-muted">
                  {llegada.personas} {llegada.personas === 1 ? "persona" : "personas"} · {llegada.horario}
                  {llegada.lugares.length ? ` · ${llegada.lugares.join(", ")}` : ""}
                  {llegada.dni ? ` · DNI ${llegada.dni}` : ""}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {llegada.aConfirmar ? "Presupuesto a confirmar con el predio" : llegada.saldo ? `Saldo ${pesos(llegada.saldo)}` : "Pagado"}
                </p>
              </div>
              <AccionesLlegada
                id={llegada.id}
                ingreso={llegada.ingresoEn ? { hora: hora.format(llegada.ingresoEn), por: llegada.ingresoPor } : null}
                saldo={llegada.saldo}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
