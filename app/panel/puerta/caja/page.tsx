import type { Metadata } from "next"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { CargarMovimiento } from "@/components/panel/caja/cargar-movimiento"
import { BotonesDeCaja, fechaCorta, ListaDeRenglones, SelectorDePeriodo, TarjetasDeCajones, textoDelPeriodo } from "@/components/panel/caja/partes"
import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { esFiltroDeCajon, libroDeCaja, type FiltroDeCajon } from "@/lib/panel/caja"
import { exigirPanel } from "@/lib/panel/sesion"
import { hoyEnElPredio } from "@/lib/predio/fechas"

export const metadata: Metadata = { title: "Caja · Puerta" }

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

/// La caja de Puerta: lo cobrado de las reservas y sus propios egresos y pases (cambio,
/// retiros, depósitos). En la caja General se suma a las demás.
export default async function CajaDePuerta({ searchParams }: PageProps<"/panel/puerta/caja">) {
  await exigirPanel("puerta")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy)
  const pedido = primero(params.cajon)
  const filtro: FiltroDeCajon = esFiltroDeCajon(pedido) ? pedido : "todos"
  const ruta = "/panel/puerta/caja"
  const { renglones, resumen } = await libroDeCaja(desde, hasta, ["reservas"])

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Caja de Puerta</p>
          <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">{textoDelPeriodo(desde, hasta)}</h1>
        </div>
        <BotonesDeCaja csv={`/panel/caja/csv?${new URLSearchParams({ desde, hasta, cajon: filtro, seccion: "reservas" })}`} actividad={false} />
      </header>
      <PestanasDePuerta activa="caja" fecha={desde === hasta ? desde : undefined} />
      <SelectorDePeriodo ruta={ruta} hoy={hoy} desde={desde} hasta={hasta} extras={filtro !== "todos" ? { cajon: filtro } : {}} />
      <TarjetasDeCajones
        resumen={resumen}
        hasta={hasta}
        conEgreso
        nota={`Ingreso y egreso son los del período; balance, lo que hay en cada cajón al ${fechaCorta(hasta)}. Los cobros entran solos al marcar el ingreso de una reserva; acá se cargan los egresos y los pases.`}
      />
      <ListaDeRenglones
        titulo="Movimientos"
        renglones={renglones}
        filtro={filtro}
        enlace={(cajon) => `${ruta}?${new URLSearchParams({ desde, hasta, ...(cajon !== "todos" ? { cajon } : {}) })}`}
        vacio="No hay cobros ni movimientos en este período"
        arriba={<CargarMovimiento hoy={hoy} seccion="reservas" />}
      />
    </main>
  )
}
