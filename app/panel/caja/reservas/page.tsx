import type { Metadata } from "next"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { CobrosAnticipados, PendientesDeCobro } from "@/components/panel/caja/de-reservas"
import { BotonesDeCaja, ListaDeRenglones, PestanasDeCaja, SelectorDePeriodo, TarjetasDeCajones, textoDelPeriodo } from "@/components/panel/caja/partes"
import { cobrosAnticipados, esFiltroDeCajon, libroDeCaja, pendientesDeCobro, type FiltroDeCajon } from "@/lib/panel/caja"
import { exigirPanel } from "@/lib/panel/sesion"
import { hoyEnElPredio } from "@/lib/predio/fechas"

export const metadata: Metadata = { title: "Caja de reservas" }

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

export default async function CajaDeReservas({ searchParams }: PageProps<"/panel/caja/reservas">) {
  await exigirPanel("caja")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy)
  const pedido = primero(params.cajon)
  const filtro: FiltroDeCajon = esFiltroDeCajon(pedido) ? pedido : "todos"
  const ruta = "/panel/caja/reservas"
  const extras: Record<string, string> = filtro !== "todos" ? { cajon: filtro } : {}

  const [{ renglones, resumen }, pendientes, anticipados] = await Promise.all([libroDeCaja(desde, hasta, ["reservas"]), pendientesDeCobro(), cobrosAnticipados()])
  const adeudado = pendientes.reduce((suma, item) => suma + item.saldo, 0)
  const urgente = pendientes.filter((item) => item.vino).reduce((suma, item) => suma + item.saldo, 0)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Caja de reservas</p>
          <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">{textoDelPeriodo(desde, hasta)}</h1>
        </div>
        <BotonesDeCaja csv={`/panel/caja/csv?${new URLSearchParams({ desde, hasta, cajon: filtro, seccion: "reservas" })}`} />
      </header>
      <PestanasDeCaja activa="reservas" desde={desde} hasta={hasta} />
      <SelectorDePeriodo ruta={ruta} hoy={hoy} desde={desde} hasta={hasta} extras={extras} />

      <TarjetasDeCajones
        resumen={resumen}
        hasta={hasta}
        conEgreso={false}
        nota={`Ingreso es lo cobrado en el período; acumulado, todo lo cobrado hasta el ${hasta.split("-").reverse().join("/")}. Los cobros entran cuando el grupo llega al predio. Los egresos y los pases entre cajones están en la caja General.`}
      />

      <PendientesDeCobro pendientes={pendientes} adeudado={adeudado} urgente={urgente} />
      {anticipados.length ? <CobrosAnticipados anticipados={anticipados} /> : null}

      <ListaDeRenglones
        titulo="Cobros de reservas"
        renglones={renglones}
        filtro={filtro}
        enlace={(cajon) => `${ruta}?${new URLSearchParams({ desde, hasta, ...(cajon !== "todos" ? { cajon } : {}) })}`}
        vacio="No hay cobros de reservas en este período"
      />
    </main>
  )
}
