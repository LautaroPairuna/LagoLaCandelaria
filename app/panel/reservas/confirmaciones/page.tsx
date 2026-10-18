import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { BotonesDeConfirmacion } from "@/components/panel/confirmacion"
import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado"
import { MENSAJE_DE_CONFIRMACION, paraConfirmar, type ParaConfirmar } from "@/lib/panel/confirmaciones"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { exigirPanel } from "@/lib/panel/sesion"
import { nombreDeFormaWeb } from "@/lib/predio/cotizacion"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { nombreDelModulo } from "@/lib/predio/nombres"
import { pesos } from "@/lib/predio/tarifas"
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
  const cuenta = (respuesta: ParaConfirmar["confirmacion"]) => reservas.filter((reserva) => reserva.confirmacion === respuesta).length
  const enlace = (dia: string) => `/panel/reservas/confirmaciones?fecha=${dia}`

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Link href="/panel/reservas" className="inline-flex items-center gap-2 text-sm font-semibold text-panel-muted hover:text-panel-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a reservas
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
          <form action="/panel/reservas/confirmaciones" className="flex items-center gap-2">
            <input type="date" name="fecha" defaultValue={fecha} aria-label="Fecha" className="h-11 rounded-xl border border-panel-line bg-white px-3 text-sm" />
            <button type="submit" className="h-11 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold">
              Ver
            </button>
          </form>
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
        <ul className="mt-5 grid gap-3 xl:grid-cols-2">
          {reservas.map((reserva) => {
            const respuesta = estadoDeRespuesta[reserva.confirmacion ?? "sin"]
            return (
              <li key={reserva.id} className={cn("min-w-0 rounded-3xl bg-white p-4 md:p-5", sombra, reserva.confirmacion === "CANCELO" && "opacity-70")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">
                      <Link href={`/panel/reservas/${reserva.id}`} className="hover:underline">
                        N.º {reserva.id} · {reserva.codigo}
                      </Link>{" "}
                      · {nombreDelModulo[reserva.modulo]}
                    </p>
                    <p className="font-display text-2xl tracking-tight">{reserva.titular}</p>
                    <p className="text-sm text-panel-muted tabular-nums">{reserva.telefono}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", respuesta.clase)}>{respuesta.nombre}</span>
                    {reserva.confirmacion !== "CANCELO" ? <InsigniaDeEstado estado={reserva.estado === "CONFIRMADA" ? "confirmada" : "a-confirmar"} /> : null}
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  {reserva.personas} {reserva.personas === 1 ? "persona" : "personas"}
                  {reserva.sinCargo ? ` (${reserva.sinCargo} ${reserva.sinCargo === 1 ? "menor" : "menores"} de 5)` : ""} · {reserva.lugares.join(", ") || (reserva.modulo === "NADO" ? `Nado de ${reserva.horario}` : "Sin lugar asignado")}
                  {reserva.formaPago && nombreDeFormaWeb[reserva.formaPago] ? ` · ${nombreDeFormaWeb[reserva.formaPago]}, ${pesos(reserva.total)}` : ""}
                </p>
                {reserva.confirmacion !== "CANCELO" ? (
                  <div className="mt-3">
                    <BotonesDeConfirmacion reserva={reserva} />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
