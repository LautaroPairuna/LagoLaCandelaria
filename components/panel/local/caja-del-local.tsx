import Link from "next/link"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { BotonesDeCaja, fechaCorta, ListaDeRenglones, PestanasDeCaja, SelectorDePeriodo, sombra, TarjetasDeCajones, textoDelPeriodo } from "@/components/panel/caja/partes"
import { PestanasDelLocal } from "@/components/panel/local/pestanas"
import { esFiltroDeCajon, libroDeCaja, pendienteDeLocales, type FiltroDeCajon } from "@/lib/panel/caja"
import { seccionDelLocal } from "@/lib/panel/libro-caja"
import type { DatosDelLocal } from "@/lib/panel/local"
import { exigirPanel } from "@/lib/panel/sesion"
import { hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

type Params = Record<string, string | string[] | undefined>

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

/// La caja propia del restaurante o del bar: lo cobrado por cajón, las cuentas cobradas
/// y lo que quedó abierto. Se ve dentro del local y también desde la caja General.
export async function CajaDelLocal({ local, contexto, params }: { local: DatosDelLocal; contexto: "local" | "general"; params: Params }) {
  await exigirPanel(contexto === "general" ? "caja" : local.panel)
  const hoy = hoyEnElPredio()
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy)
  const pedido = primero(params.cajon)
  const filtro: FiltroDeCajon = esFiltroDeCajon(pedido) ? pedido : "todos"
  const ruta = contexto === "general" ? `/panel/caja/${local.slug}` : `${local.base}/caja`
  const seccion = seccionDelLocal(local.id)
  const cuentas = local.id === "RESTAURANTE" ? `${local.base}/cuentas` : local.base

  const [{ renglones, resumen }, pendientes] = await Promise.all([libroDeCaja(desde, hasta, [seccion]), pendienteDeLocales()])
  const abiertas = pendientes.lista.filter((cuenta) => cuenta.local === local.id)
  const pendiente = local.id === "RESTAURANTE" ? pendientes.restaurante : pendientes.bar
  const total = resumen.reduce((suma, cajon) => suma + cajon.ingreso, 0)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Caja del {local.nombre.toLowerCase()}</p>
          <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">{textoDelPeriodo(desde, hasta)}</h1>
        </div>
        <BotonesDeCaja csv={`/panel/caja/csv?${new URLSearchParams({ desde, hasta, cajon: filtro, seccion })}`} actividad={contexto === "general"} />
      </header>
      {contexto === "general" ? <PestanasDeCaja activa={seccion as "restaurante" | "bar"} desde={desde} hasta={hasta} /> : <PestanasDelLocal local={local} activa="caja" />}
      <SelectorDePeriodo ruta={ruta} hoy={hoy} desde={desde} hasta={hasta} extras={filtro !== "todos" ? { cajon: filtro } : {}} />

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-panel-ink px-4 py-3 text-white">
          <dt className="text-xs font-bold tracking-wide text-white/75 uppercase">Cobrado en el período</dt>
          <dd className="font-display mt-1 text-3xl tracking-tight tabular-nums">{pesos(total)}</dd>
        </div>
        <div className="rounded-2xl border-2 border-[#f0b266] bg-[#ffeedb] px-4 py-3">
          <dt className="text-xs font-bold tracking-wide text-[#7a4200] uppercase">Pendiente de cobro</dt>
          <dd className="font-display mt-1 text-3xl tracking-tight tabular-nums">{pesos(pendiente)}</dd>
          <dd className="text-xs text-[#7a4200]">Cuentas abiertas, de cualquier día</dd>
        </div>
      </dl>

      <TarjetasDeCajones
        resumen={resumen}
        hasta={hasta}
        conEgreso={false}
        nota={`Ingreso es lo cobrado en el período; acumulado, todo lo cobrado hasta el ${fechaCorta(hasta)}. Es la caja propia del ${local.nombre.toLowerCase()}; en la caja General se suma a las demás.`}
      />

      {abiertas.length ? (
        <section aria-label="Cuentas abiertas" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
          <h2 className="font-display text-2xl tracking-tight">Cuentas sin cobrar</h2>
          <ul className="mt-2 divide-y divide-panel-line">
            {abiertas.map((cuenta) => (
              <li key={cuenta.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                <span className="min-w-0 flex-1">
                  <Link href={`${cuentas}?fecha=${cuenta.fecha}`} className="font-semibold hover:underline">
                    {cuenta.mesa}
                    {cuenta.titular ? ` · ${cuenta.titular}` : ""}
                  </Link>
                  <span className="block text-xs text-panel-muted">Abierta el {fechaCorta(cuenta.fecha)}</span>
                </span>
                <span className="font-semibold tabular-nums">{pesos(cuenta.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ListaDeRenglones
        titulo="Cuentas cobradas"
        renglones={renglones}
        filtro={filtro}
        enlace={(cajon) => `${ruta}?${new URLSearchParams({ desde, hasta, ...(cajon !== "todos" ? { cajon } : {}) })}`}
        vacio="No hay cuentas cobradas en este período"
      />
    </main>
  )
}
