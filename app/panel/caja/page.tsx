import type { Metadata } from "next"
import Link from "next/link"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { CargarMovimiento } from "@/components/panel/caja/cargar-movimiento"
import { BotonesDeCaja, ListaDeRenglones, PestanasDeCaja, SelectorDePeriodo, sombra, TarjetasDeCajones, textoDelPeriodo } from "@/components/panel/caja/partes"
import { esFiltroDeCajon, esSeccion, libroDeCaja, pendienteDeLocales, pendientesDeCobro, type FiltroDeCajon } from "@/lib/panel/caja"
import { nombreDeSeccion, secciones, type Seccion } from "@/lib/panel/libro-caja"
import { exigirPanel } from "@/lib/panel/sesion"
import { hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Caja general" }

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

const cajaDe: Record<Seccion, string | null> = {
  reservas: "/panel/caja/reservas",
  restaurante: "/panel/caja/restaurante",
  bar: "/panel/caja/bar",
  predio: null,
}

const detalleDe: Record<Seccion, string> = {
  reservas: "Cobros de reservas de grupos que llegaron",
  restaurante: "Cuentas cobradas del restaurante",
  bar: "Cuentas cobradas del bar",
  predio: "Egresos y pases entre cajones",
}

/// La caja madre: junta la de reservas, la del restaurante y la del bar, y suma los
/// egresos y pases del predio.
export default async function CajaGeneral({ searchParams }: PageProps<"/panel/caja">) {
  await exigirPanel("caja")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy)
  const pedido = primero(params.cajon)
  const filtro: FiltroDeCajon = esFiltroDeCajon(pedido) ? pedido : "todos"
  const pedida = primero(params.seccion)
  const seccion = esSeccion(pedida) ? pedida : null
  const filtros = { ...(filtro !== "todos" ? { cajon: filtro } : {}), ...(seccion ? { seccion } : {}) }
  const enlace = (cambios: Record<string, string | null>) => {
    const valores = Object.fromEntries(Object.entries({ desde, hasta, ...filtros, ...cambios }).filter(([, valor]) => valor && valor !== "todos")) as Record<string, string>
    return `/panel/caja?${new URLSearchParams(valores)}`
  }

  const [{ renglones, resumen, porSeccion }, deReservas, deLocales] = await Promise.all([libroDeCaja(desde, hasta), pendientesDeCobro(), pendienteDeLocales()])
  const visibles = seccion ? renglones.filter((renglon) => renglon.seccion === seccion) : renglones
  const pendiente: Record<Seccion, number | null> = {
    reservas: deReservas.reduce((suma, item) => suma + item.saldo, 0),
    restaurante: deLocales.restaurante,
    bar: deLocales.bar,
    predio: null,
  }
  const total = (cual: Seccion) => porSeccion[cual].EFECTIVO + porSeccion[cual].BANCO

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Caja general</p>
          <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">{textoDelPeriodo(desde, hasta)}</h1>
        </div>
        <BotonesDeCaja csv={`/panel/caja/csv?${new URLSearchParams({ desde, hasta, cajon: filtro, ...(seccion ? { seccion, general: "1" } : {}) })}`} />
      </header>
      <PestanasDeCaja activa="general" desde={desde} hasta={hasta} />
      <SelectorDePeriodo ruta="/panel/caja" hoy={hoy} desde={desde} hasta={hasta} extras={filtros} />

      <TarjetasDeCajones
        resumen={resumen}
        hasta={hasta}
        conEgreso
        nota={`Junta las cajas de reservas, restaurante y bar, y los egresos y pases del predio. Ingreso y egreso son del período; el balance suma toda la historia hasta el ${hasta.split("-").reverse().join("/")}.`}
      />

      <section aria-label="Por sección" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
        <h2 className="font-display text-2xl tracking-tight">Por sección</h2>
        <div className="-mx-4 mt-3 overflow-x-auto px-4 md:mx-0 md:px-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-panel-line text-xs font-bold tracking-wide text-panel-muted uppercase">
              <tr>
                <th className="py-2 pr-3 font-bold">Sección</th>
                <th className="px-3 py-2 text-right font-bold">Efectivo</th>
                <th className="px-3 py-2 text-right font-bold">Banco</th>
                <th className="px-3 py-2 text-right font-bold">Total</th>
                <th className="py-2 pl-3 text-right font-bold">Pendiente de cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-line">
              {secciones.map((cual) => (
                <tr key={cual}>
                  <td className="py-3 pr-3">
                    {cajaDe[cual] ? (
                      <Link href={`${cajaDe[cual]}?${new URLSearchParams({ desde, hasta })}`} className="font-semibold hover:underline">
                        {nombreDeSeccion[cual]}
                      </Link>
                    ) : (
                      <span className="font-semibold">{nombreDeSeccion[cual]}</span>
                    )}
                    <span className="block text-xs text-panel-muted">{detalleDe[cual]}</span>
                  </td>
                  {(["EFECTIVO", "BANCO"] as const).map((cajon) => (
                    <td key={cajon} className={cn("px-3 py-3 text-right tabular-nums", porSeccion[cual][cajon] < 0 && "text-[#a32020]")}>
                      {pesos(porSeccion[cual][cajon])}
                    </td>
                  ))}
                  <td className={cn("px-3 py-3 text-right font-semibold tabular-nums", total(cual) < 0 && "text-[#a32020]")}>{pesos(total(cual))}</td>
                  <td className="py-3 pl-3 text-right tabular-nums text-[#7a4200]">{pendiente[cual] === null ? "—" : pesos(pendiente[cual])}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-panel-ink/20 font-semibold">
              <tr>
                <td className="py-3 pr-3">Total del período</td>
                {(["EFECTIVO", "BANCO"] as const).map((cajon) => (
                  <td key={cajon} className="px-3 py-3 text-right tabular-nums">
                    {pesos(secciones.reduce((suma, cual) => suma + porSeccion[cual][cajon], 0))}
                  </td>
                ))}
                <td className="px-3 py-3 text-right tabular-nums">{pesos(secciones.reduce((suma, cual) => suma + total(cual), 0))}</td>
                <td className="py-3 pl-3 text-right tabular-nums text-[#7a4200]">
                  {pesos((pendiente.reservas ?? 0) + (pendiente.restaurante ?? 0) + (pendiente.bar ?? 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <ListaDeRenglones
        titulo="Movimientos"
        renglones={visibles}
        filtro={filtro}
        enlace={(cajon) => enlace({ cajon })}
        vacio={`No hay movimientos ${seccion ? `de ${nombreDeSeccion[seccion].toLowerCase()} ` : ""}en este período`}
        conSeccion
        arriba={<CargarMovimiento hoy={hoy} />}
        filtrosExtra={
          <nav aria-label="Sección" className="mt-3 flex flex-wrap gap-1.5">
            {[null, ...secciones].map((cual) => (
              <Link
                key={cual ?? "todas"}
                href={enlace({ seccion: cual })}
                aria-current={seccion === cual ? "true" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-semibold",
                  seccion === cual ? "border-panel-tostado bg-panel-claro text-panel-tostado" : "border-panel-line bg-white hover:border-panel-muted",
                )}
              >
                {cual ? nombreDeSeccion[cual] : "Todas las secciones"}
              </Link>
            ))}
          </nav>
        }
      />
    </main>
  )
}
