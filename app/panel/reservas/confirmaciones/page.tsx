import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { BotonesDeConfirmacion } from "@/components/panel/confirmacion"
import { ElegirFecha } from "@/components/panel/elegir-fecha"
import { TablaDeReservas } from "@/components/panel/tabla-de-reservas"
import { MENSAJE_DE_CONFIRMACION, paraConfirmar, type ParaConfirmar } from "@/lib/panel/confirmaciones"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { llegadasPorIds } from "@/lib/panel/puerta"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { nombreDelModulo } from "@/lib/predio/nombres"
import { cn } from "cn"

export const metadata: Metadata = { title: "Confirmaciones" }

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

const estadoDeRespuesta = {
  CONFIRMO: { nombre: "Confirmó", clase: "bg-[#e3f1e4] text-[#1b5e20]" },
  CANCELO: { nombre: "No viene · cancelada", clase: "bg-[#fde8e4] text-[#a0261b]" },
  sin: { nombre: "Sin respuesta", clase: "bg-panel text-panel-ink" },
}

export default async function Confirmaciones({ searchParams }: PageProps<"/panel/reservas/confirmaciones">) {
  await exigirPanel("reservas")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const pedida = primero(params.fecha)
  const fecha = pedida && esFechaIso(pedida) ? pedida : sumarDiasIso(hoy, 1)
  const reservas = await paraConfirmar(fecha)
  const vigentes = reservas.filter((reserva) => reserva.estado !== "CANCELADA")
  const canceladas = reservas.filter((reserva) => reserva.estado === "CANCELADA")
  const llegadas = await llegadasPorIds(vigentes.map((reserva) => reserva.id))
  const porId = new Map(vigentes.map((reserva) => [reserva.id, reserva]))
  const cuenta = (respuesta: ParaConfirmar["confirmacion"]) => reservas.filter((reserva) => reserva.confirmacion === respuesta).length
  const enlace = (dia: string) => `/panel/reservas/confirmaciones?fecha=${dia}`

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Link href="/panel/puerta" className="inline-flex items-center gap-2 text-sm font-semibold text-panel-muted hover:text-panel-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a Puerta
      </Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Reservas · Confirmaciones</p>
          <h1 className="font-display mt-1 text-3xl tracking-tight md:text-4xl">{fecha === sumarDiasIso(hoy, 1) ? "Las de mañana" : fechaLargaPanel(fecha)}</h1>
          <p className="mt-1 text-sm text-panel-muted">
            {fechaLargaPanel(fecha)} · {reservas.length} {reservas.length === 1 ? "reserva" : "reservas"} de finde en familia, bungalows y nado
          </p>
        </div>
        <nav aria-label="Elegir el día" className="flex items-center gap-2">
          <Link href={enlace(sumarDiasIso(fecha, -1))} aria-label="Día anterior" className="grid size-11 place-items-center rounded-full border border-panel-line bg-white">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <ElegirFecha fecha={fecha} />
          <Link href={enlace(sumarDiasIso(fecha, 1))} aria-label="Día siguiente" className="grid size-11 place-items-center rounded-full border border-panel-line bg-white">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </nav>
      </header>

      <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-xl">
        {[
          { termino: "Sin respuesta", valor: cuenta(null) },
          { termino: "Confirmaron", valor: cuenta("CONFIRMO") },
          { termino: "No vienen", valor: cuenta("CANCELO") },
        ].map((dato) => (
          <div key={dato.termino} className={cn("rounded-2xl bg-white px-4 py-3", sombra)}>
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{dato.termino}</dt>
            <dd className="font-display mt-1 text-3xl tabular-nums">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <details className={cn("mt-4 rounded-2xl bg-white px-4 py-3 text-sm", sombra)}>
        <summary className="cursor-pointer font-semibold">El mensaje que se manda</summary>
        <p className="mt-2 text-panel-muted">{MENSAJE_DE_CONFIRMACION}</p>
        <p className="mt-1 text-panel-muted">Va con el enlace a su reserva, por si quieren cancelarla ellos mismos.</p>
      </details>

      {reservas.length === 0 ? (
        <p className={cn("mt-5 rounded-3xl bg-white p-6 text-panel-muted", sombra)}>No hay reservas para confirmar ese día.</p>
      ) : (
        <TablaDeReservas
          llegadas={llegadas}
          hoy={hoy}
          puedeConfirmar
          extra={{
            titulo: "Confirmación",
            celda: (llegada) => {
              const reserva = porId.get(llegada.id)
              if (!reserva) return null
              const respuesta = estadoDeRespuesta[reserva.confirmacion ?? "sin"]
              return (
                <div className="w-60 space-y-1.5">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", respuesta.clase)}>{respuesta.nombre}</span>
                  <BotonesDeConfirmacion reserva={reserva} />
                </div>
              )
            },
          }}
        />
      )}

      {canceladas.length ? (
        <section aria-label="Avisaron que no vienen" className={cn("mt-5 rounded-3xl bg-white p-4 md:p-5", sombra)}>
          <h2 className="font-display text-xl tracking-tight">Avisaron que no vienen</h2>
          <ul className="mt-2 divide-y divide-panel-line">
            {canceladas.map((reserva) => (
              <li key={reserva.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                <Link href={`/panel/reservas/${reserva.id}`} className="font-semibold hover:underline">
                  {reserva.titular} · {reserva.codigo}
                </Link>
                <span className="text-panel-muted">
                  {nombreDelModulo[reserva.modulo]} · {reserva.personas} {reserva.personas === 1 ? "persona" : "personas"} · cancelada
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
