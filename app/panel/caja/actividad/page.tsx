import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { accionesDePlata } from "@/lib/panel/actividad"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { exigirPanel } from "@/lib/panel/sesion"
import { pesos } from "@/lib/predio/tarifas"
import { db } from "@/lib/prisma"
import { cn } from "cn"

export const metadata: Metadata = { title: "Actividad de la caja" }

const MAXIMO = 300

const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

const colorDeAccion: Record<string, string> = {
  cobro: "bg-[#e6f5e4] text-[#24622a]",
  "cobro anulado": "bg-[#fde9e7] text-[#a32020]",
  movimiento: "bg-[#eaf3fb] text-[#1f5a8a]",
  "movimiento borrado": "bg-[#fde9e7] text-[#a32020]",
}

export default async function ActividadDeCaja() {
  await exigirPanel("caja")
  const filas = await db().actividad.findMany({ where: { accion: { in: accionesDePlata } }, orderBy: { creadoEn: "desc" }, take: MAXIMO })
  const porDia = new Map<string, typeof filas>()
  for (const fila of filas) {
    const clave = dia.format(fila.creadoEn)
    porDia.set(clave, [...(porDia.get(clave) ?? []), fila])
  }

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Link href="/panel/caja" className="inline-flex items-center gap-2 text-sm font-semibold text-panel-muted hover:text-panel-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a la Caja
      </Link>
      <header className="mt-4">
        <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Caja</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight md:mt-2 md:text-4xl">Actividad</h1>
        <p className="mt-2 max-w-2xl text-sm text-panel-muted">
          Quién cobró, quién dio de baja un cobro y quién cargó o borró movimientos. Se muestran los últimos {MAXIMO} registros.
        </p>
      </header>

      {filas.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-white p-6 text-sm text-panel-muted shadow-[0_8px_28px_rgba(58,42,24,0.06)]">Todavía no hay actividad registrada.</p>
      ) : (
        <div className="mt-6 space-y-5">
          {[...porDia].map(([fecha, lista]) => (
            <section key={fecha} aria-label={fechaLargaPanel(fecha)} className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
              <h2 className="font-display text-xl tracking-tight">{fechaLargaPanel(fecha)}</h2>
              <ul className="mt-2 divide-y divide-panel-line">
                {lista.map((fila) => (
                  <li key={fila.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 text-sm">
                    <span className="w-12 shrink-0 pt-0.5 font-semibold tabular-nums text-panel-muted">{hora.format(fila.creadoEn)}</span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize", colorDeAccion[fila.accion] ?? "bg-panel text-panel-muted")}>{fila.accion}</span>
                    <span className="min-w-0 flex-1">
                      <strong>{fila.usuario}</strong> · {fila.detalle}
                      {fila.reservaId ? (
                        <>
                          {" "}
                          <Link href={`/panel/reservas/${fila.reservaId}`} className="font-semibold text-panel-tostado underline-offset-4 hover:underline">
                            Ver reserva
                          </Link>
                        </>
                      ) : null}
                    </span>
                    {fila.monto ? <span className="shrink-0 font-semibold tabular-nums">{pesos(fila.monto)}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
