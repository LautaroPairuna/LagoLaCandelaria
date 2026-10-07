import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesLlegada } from "@/components/panel/acciones-llegada"
import { InsigniaDeEstado, LeyendaDeEstados } from "@/components/panel/insignia-de-estado"
import { totalesPorForma } from "@/lib/panel/cobros"
import { estilosDeEstado } from "@/lib/panel/estados"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { llegadasDelDia, pagosDelDia, type Llegada } from "@/lib/panel/puerta"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Puerta" }

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

export default async function PanelPuerta({ searchParams }: PageProps<"/panel/puerta">) {
  const sesion = await exigirPanel("puerta")
  const params = await searchParams
  const busqueda = (Array.isArray(params.q) ? params.q[0] : params.q)?.slice(0, 60) ?? ""
  const hoy = hoyEnElPredio()
  const fechaPedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const [llegadas, todas, pagos] = await Promise.all([llegadasDelDia(fecha, busqueda), llegadasDelDia(fecha), pagosDelDia(fecha)])
  const verCaja = puedeVer(sesion.user.role, "caja")
  const enlace = (dia: string) => (dia === hoy ? "/panel/puerta" : `/panel/puerta?fecha=${dia}`)

  const esperadas = todas.reduce((suma, item) => suma + item.personas, 0)
  const adentro = todas.reduce((suma, item) => suma + item.adentro, 0)
  const vinieron = todas.reduce((suma, item) => suma + item.adentro + item.salieron, 0)
  const caja = totalesPorForma(pagos)
  const cobrado = caja.EFECTIVO + caja.DEBITO + caja.TRANSFERENCIA
  const porEntrar = llegadas.filter((item) => item.asistencia === "por-llegar" || item.asistencia === "no-vino")
  const enElPredio = llegadas.filter((item) => item.asistencia === "parcial" || item.asistencia === "adentro")
  const seFueron = llegadas.filter((item) => item.asistencia === "finalizada")

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Ingreso y cobranza</p>
          {momento !== "hoy" ? (
            <Link href="/panel/puerta" className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
              Hoy
            </Link>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-2 md:mt-2 md:gap-x-2">
          <Link href={enlace(sumarDiasIso(fecha, -1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día anterior">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <h1 className="font-display min-w-0 text-center text-2xl leading-tight tracking-tight md:text-4xl">{fechaLargaPanel(fecha)}</h1>
          <Link href={enlace(sumarDiasIso(fecha, 1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día siguiente">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
          <form action="/panel/puerta" className="flex items-center gap-2 md:ml-3">
            <input type="date" name="fecha" defaultValue={fecha} aria-label="Elegir otro día" className="h-10 rounded-xl border border-panel-line bg-white px-3 text-sm" />
            <button type="submit" className="h-10 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted">
              Ir
            </button>
          </form>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { termino: "Grupos", valor: String(todas.length) },
          { termino: "Personas esperadas", valor: String(esperadas) },
          momento === "pasado"
            ? { termino: "Vinieron", valor: `${vinieron} de ${esperadas}` }
            : { termino: "Adentro ahora", valor: `${adentro} de ${esperadas}` },
          { termino: momento === "hoy" ? "Cobrado hoy" : "Cobrado ese día", valor: pesos(cobrado) },
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
            {momento !== "hoy" ? <input type="hidden" name="fecha" value={fecha} /> : null}
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={busqueda}
              placeholder="N.º de reserva, apellido, institución o DNI"
              aria-label="Buscar reserva"
              className="h-12 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-11"
            />
          </form>

          <LeyendaDeEstados />

          <ListaLlegadas
            titulo={momento === "pasado" ? "No vinieron" : momento === "futuro" ? "Esperados" : "Por llegar"}
            llegadas={porEntrar}
            bloqueado={momento === "futuro"}
            vacio={busqueda ? "Nadie coincide con la búsqueda." : momento === "pasado" ? "Vinieron todos." : momento === "futuro" ? "No hay reservas para ese día." : "No queda nadie por entrar."}
          />
          {momento !== "futuro" ? (
            <>
              <ListaLlegadas titulo={momento === "pasado" ? "Se quedaron adentro" : "Adentro"} llegadas={enElPredio} vacio="No hay nadie adentro." ocultarVacia={momento === "pasado"} />
              <ListaLlegadas titulo="Ya se fueron" llegadas={seFueron} vacio="Todavía no se fue nadie." />
            </>
          ) : null}
        </div>

        <section aria-label="Registro de pagos" className="h-fit rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl tracking-tight">Caja del día</h2>
            {verCaja ? (
              <Link href={`/panel/caja?desde=${fecha}&hasta=${fecha}`} className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
                Ver en Caja
              </Link>
            ) : null}
          </div>
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
            <p className="mt-2 text-sm text-panel-muted">{momento === "hoy" ? "Todavía no se cobró nada hoy." : "No hay cobros registrados ese día."}</p>
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

function ListaLlegadas({
  titulo,
  llegadas,
  vacio,
  bloqueado = false,
  ocultarVacia = false,
}: {
  titulo: string
  llegadas: Llegada[]
  vacio: string
  bloqueado?: boolean
  ocultarVacia?: boolean
}) {
  if (ocultarVacia && llegadas.length === 0) return null
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
                "grid gap-4 rounded-3xl border-2 border-l-8 p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5 2xl:grid-cols-[minmax(0,1fr)_auto]",
                estilosDeEstado[llegada.visible].tarjeta,
                estilosDeEstado[llegada.visible].borde,
              )}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide text-panel-muted uppercase">
                  {nombreDelModulo[llegada.modulo]} · {llegada.codigo}
                </p>
                <Link href={`/panel/reservas/${llegada.id}`} className="font-display mt-1 block text-2xl tracking-tight hover:underline md:text-3xl">
                  {llegada.titular}
                </Link>
                <p className="mt-1 text-base text-panel-ink/80">
                  {llegada.personas} {llegada.personas === 1 ? "persona" : "personas"} · {llegada.horario}
                  {llegada.lugares.length ? ` · ${llegada.lugares.join(", ")}` : ""}
                  {llegada.dni ? ` · DNI ${llegada.dni}` : ""}
                </p>
                <p className="mt-2 text-base font-semibold">
                  {llegada.consumo
                    ? "Mesa en el restaurante: paga el consumo aparte"
                    : llegada.aConfirmar
                      ? "Presupuesto a confirmar con el predio"
                      : llegada.saldo
                        ? `Saldo ${pesos(llegada.saldo)}`
                        : "Pagado"}
                </p>
              </div>
              {bloqueado ? (
                <div className="space-y-2">
                  <InsigniaDeEstado estado={llegada.visible} grande />
                  <p className="text-sm text-panel-ink/70">El ingreso y el cobro se marcan ese día.</p>
                </div>
              ) : (
              <AccionesLlegada
                id={llegada.id}
                titular={llegada.titular}
                visible={llegada.visible}
                ingreso={llegada.ingresoEn ? { hora: hora.format(llegada.ingresoEn), por: llegada.ingresoPor } : null}
                asistencia={{ porPersona: llegada.porPersona, estado: llegada.asistencia, adentro: llegada.adentro, salieron: llegada.salieron, total: llegada.total }}
                integrantes={llegada.integrantes}
                saldo={llegada.saldo}
                efectivo={llegada.efectivo}
              />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
