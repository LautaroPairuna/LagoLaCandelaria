import { ClipboardList, MessageCircle, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesMasivas, type EnvioDeTicket } from "@/components/panel/acciones-masivas"
import { EncabezadoDelDia } from "@/components/panel/encabezado-del-dia"
import { FiltrosDePuerta } from "@/components/panel/filtros-puerta"
import { LeyendaDeEstados } from "@/components/panel/insignia-de-estado"
import { NuevaReserva } from "@/components/panel/nueva-reserva"
import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { TablaDeReservas } from "@/components/panel/tabla-de-reservas"
import { feriadosDelAnio } from "@/lib/disponibilidad"
import { buscarReservas } from "@/lib/panel/busqueda"
import { filtrarYOrdenar, leerFiltros } from "@/lib/panel/filtros-puerta"
import { llegadasDelDia, llegadasPorIds, type Llegada } from "@/lib/panel/puerta"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { enviosDeTickets, plantillasWhatsapp } from "@/lib/panel/whatsapp"
import { esFechaIso, hoyEnElPredio } from "@/lib/predio/fechas"

export const metadata: Metadata = { title: "Puerta" }


const botonSecundario = "inline-flex h-11 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"

export default async function PanelPuerta({ searchParams }: PageProps<"/panel/puerta">) {
  const sesion = await exigirPanel("puerta")
  const params = await searchParams
  const busqueda = (Array.isArray(params.q) ? params.q[0] : params.q)?.slice(0, 60) ?? ""
  const hoy = hoyEnElPredio()
  const fechaPedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const filtros = leerFiltros(params)
  // Con algo escrito, la búsqueda es en todas las fechas (como era el panel Reservas).
  const [delDia, resultados] = await Promise.all([
    busqueda ? Promise.resolve([]) : llegadasDelDia(fecha),
    busqueda ? buscarReservas({ texto: busqueda, estado: "activas", pasadas: true, hoy }, 100) : null,
  ])
  const encontradas = resultados ? await llegadasPorIds(resultados.filas.map((fila) => fila.id)) : []
  const llegadas = filtrarYOrdenar(delDia, filtros)
  const puedeConfirmar = puedeVer(sesion.user.role, "reservas")
  const feriados = await feriadosDelAnio(hoy)

  const aConfirmar = llegadas.filter((item) => item.visible === "a-confirmar").map((item) => item.id)
  const envios: EnvioDeTicket[] = enviosDeTickets(
    llegadas.filter((item) => item.visible === "confirmada"),
    await plantillasWhatsapp(),
  )

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDelDia fecha={fecha} hoy={hoy} ruta="/panel/puerta" kicker="Ingreso y cobranza" />
      <PestanasDePuerta activa="reservas" fecha={momento === "hoy" ? undefined : fecha} />


      <div className="mt-6 space-y-4">
        <form className="relative" role="search">
          {momento !== "hoy" ? <input type="hidden" name="fecha" value={fecha} /> : null}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar en todas las fechas: N.º, código, apellido, institución, DNI o teléfono"
            aria-label="Buscar reserva en todas las fechas"
            className="h-12 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-11"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {momento === "hoy" ? <NuevaReserva hoy={hoy} enPuerta puedeCobrar feriados={feriados} /> : null}
          {puedeConfirmar ? <NuevaReserva hoy={hoy} enPuerta={false} puedeCobrar feriados={feriados} /> : null}
          {puedeConfirmar ? (
            <Link href="/panel/clientes" className={botonSecundario}>
              <MessageCircle className="size-4 text-[#25a95a]" aria-hidden />
              Confirmar las de mañana
            </Link>
          ) : null}
          <Link href={`/panel/reservas/planilla?fecha=${fecha}`} className={botonSecundario}>
            <ClipboardList className="size-4 text-panel-tostado" aria-hidden />
            Planilla del día
          </Link>
          {momento !== "pasado" && !busqueda ? <AccionesMasivas aConfirmar={aConfirmar} envios={envios} puedeConfirmar={puedeConfirmar} /> : null}
        </div>
        {busqueda ? null : <FiltrosDePuerta filtros={filtros} />}
        <LeyendaDeEstados />
      </div>

      {resultados ? <ResultadosDeBusqueda total={resultados.total} llegadas={encontradas} busqueda={busqueda} puedeConfirmar={puedeConfirmar} hoy={hoy} /> : null}

      {resultados ? null : (
        <section aria-labelledby="reservas-del-dia" className="mt-6">
          <h2 id="reservas-del-dia" className="font-display flex items-center gap-3 text-2xl tracking-tight">
            Reservas del día
            <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{llegadas.length}</span>
          </h2>
          {llegadas.length === 0 ? (
            <p className="mt-2 text-sm text-panel-muted">{llegadas.length !== delDia.length ? "Ninguna reserva coincide con los filtros." : "No hay reservas para ese día."}</p>
          ) : (
            <TablaDeReservas llegadas={llegadas} hoy={hoy} puedeConfirmar={puedeConfirmar} />
          )}
        </section>
      )}
    </main>
  )
}

function ResultadosDeBusqueda({ total, llegadas, busqueda, puedeConfirmar, hoy }: { total: number; llegadas: Llegada[]; busqueda: string; puedeConfirmar: boolean; hoy: string }) {
  return (
    <section aria-labelledby="resultados" className="mt-6">
      <h2 id="resultados" className="font-display flex flex-wrap items-center gap-3 text-2xl tracking-tight">
        Resultados en todas las fechas
        <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{total > llegadas.length ? `${llegadas.length} de ${total}` : total}</span>
        <Link href="/panel/puerta" className="font-sans text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
          Volver al día
        </Link>
      </h2>
      {llegadas.length === 0 ? (
        <p className="mt-2 text-sm text-panel-muted">No encontramos reservas con «{busqueda}». Probá con menos palabras o solo el apellido.</p>
      ) : (
        <TablaDeReservas llegadas={llegadas} hoy={hoy} puedeConfirmar={puedeConfirmar} conFecha />
      )}
    </section>
  )
}
