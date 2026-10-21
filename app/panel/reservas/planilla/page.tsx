import { ArrowLeft, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { BotonImprimir } from "@/components/panel/boton-imprimir"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { columnasDePlanilla, planillaDelDia } from "@/lib/panel/planilla"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"

export const metadata: Metadata = { title: "Planilla del día" }

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

// Renglones vacíos al imprimir, para anotar a mano a quien llega sin reserva.
const RENGLONES_EN_BLANCO = 8

// A4 vertical con 3 cm libres arriba, como la pidió el predio.
const hojaA4 = "@page { size: A4 portrait; margin: 3cm 1cm 1.2cm; }"

const celda = "border border-panel-ink/40 px-2 py-1.5 print:border-black print:px-1.5 print:py-1"

export default async function Planilla({ searchParams }: PageProps<"/panel/reservas/planilla">) {
  await exigirPanel("reservas", "puerta")
  const params = await searchParams
  const pedida = primero(params.fecha)
  const fecha = pedida && esFechaIso(pedida) ? pedida : hoyEnElPredio()
  const filas = await planillaDelDia(fecha)
  const enlace = (dia: string) => `/panel/reservas/planilla?fecha=${dia}`

  return (
    <main className="px-4 py-6 md:px-8 md:py-8 print:p-0">
      <style>{hojaA4}</style>
      <div className="print:hidden">
        <Link href="/panel/reservas" className="inline-flex items-center gap-2 text-sm font-semibold text-panel-muted hover:text-panel-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Volver a reservas
        </Link>
        <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Reservas · Planilla</p>
            <h1 className="font-display mt-1 text-3xl tracking-tight md:text-4xl">{fechaLargaPanel(fecha)}</h1>
            <p className="mt-1 text-sm text-panel-muted">
              {filas.length} {filas.length === 1 ? "reserva" : "reservas"} de finde en familia, bungalows y nado
            </p>
          </div>
          <nav aria-label="Elegir el día" className="flex items-center gap-2">
            <Link href={enlace(sumarDiasIso(fecha, -1))} aria-label="Día anterior" className="grid size-11 place-items-center rounded-full border border-panel-line bg-white">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <form action="/panel/reservas/planilla" className="flex items-center gap-2">
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
        <div className="mt-4 flex flex-wrap gap-3">
          <BotonImprimir />
          <a
            href={`/panel/reservas/planilla/csv?fecha=${fecha}`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-panel-line bg-white px-5 text-sm font-semibold hover:border-panel-muted"
          >
            <FileSpreadsheet className="size-4 text-[#1d6f42]" aria-hidden />
            Descargar para Excel
          </a>
        </div>
      </div>

      <section className="mt-6 overflow-x-auto rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] print:mt-0 print:overflow-visible print:rounded-none print:p-0 print:shadow-none">
        <h2 className="mb-2 hidden text-sm font-bold print:block">Lago La Candelaria · Reservas del {fechaLargaPanel(fecha).toLowerCase()}</h2>
        <table className="w-full border-collapse text-left text-sm print:text-[8.5pt] print:leading-tight">
          <thead className="bg-panel/60 print:bg-transparent">
            <tr>
              {columnasDePlanilla.map((columna) => (
                <th key={columna} scope="col" className={`${celda} text-xs font-bold uppercase print:text-[7.5pt]`}>
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id} className="break-inside-avoid">
                <td className={`${celda} font-semibold whitespace-nowrap tabular-nums`}>
                  <Link href={`/panel/reservas/${fila.id}`} className="hover:underline">
                    {fila.id}
                  </Link>
                  <span className="block text-xs font-normal text-panel-muted print:text-[7pt] print:text-black">{fila.codigo}</span>
                </td>
                <td className={celda}>{fila.titular}</td>
                <td className={`${celda} whitespace-nowrap tabular-nums`}>{fila.telefono}</td>
                <td className={`${celda} text-center tabular-nums`}>{fila.adultos}</td>
                <td className={`${celda} text-center tabular-nums`}>{fila.menores}</td>
                <td className={`${celda} text-center tabular-nums`}>{fila.sinCargo}</td>
                <td className={celda}>{fila.lugar}</td>
                <td className={celda}>{fila.formaPago}</td>
                <td className={`${celda} text-center`}>{fila.confirmo ? "Sí" : "Pendiente"}</td>
              </tr>
            ))}
            {Array.from({ length: RENGLONES_EN_BLANCO }, (_, indice) => (
              <tr key={`blanco-${indice}`} className="hidden h-7 break-inside-avoid print:table-row" aria-hidden>
                {columnasDePlanilla.map((columna) => (
                  <td key={columna} className={celda} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filas.length === 0 ? <p className="mt-3 text-sm text-panel-muted print:hidden">No hay reservas de la web para ese día.</p> : null}
      </section>
    </main>
  )
}
