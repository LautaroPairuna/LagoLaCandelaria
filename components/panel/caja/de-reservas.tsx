import Link from "next/link"

import { fechaCorta, sombra } from "@/components/panel/caja/partes"
import { CobrarPendiente } from "@/components/panel/caja/cobrar-pendiente"
import type { Anticipado, Pendiente } from "@/lib/panel/caja"
import { rangoConMesPanel } from "@/lib/panel/formato"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export function PendientesDeCobro({ pendientes, adeudado, urgente }: { pendientes: Pendiente[]; adeudado: number; urgente: number }) {
  return (
    <section aria-label="Pendiente de cobro" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl tracking-tight">Pendiente de cobro</h2>
        <p className="text-sm text-panel-muted">Reservas confirmadas que todavía deben plata, de cualquier fecha.</p>
      </div>
      {pendientes.length === 0 ? (
        <p className="mt-3 text-sm text-panel-muted">No hay reservas confirmadas con saldo.</p>
      ) : (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-panel px-4 py-3">
              <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">Total adeudado</dt>
              <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{pesos(adeudado)}</dd>
              <dd className="text-xs text-panel-muted">
                {pendientes.length} {pendientes.length === 1 ? "reserva" : "reservas"}, a precio de lista
              </dd>
            </div>
            <div className="rounded-2xl border-2 border-[#f0b266] bg-[#ffeedb] px-4 py-3">
              <dt className="text-xs font-bold tracking-wide text-[#7a4200] uppercase">De grupos que ya vinieron</dt>
              <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{pesos(urgente)}</dd>
              <dd className="text-xs text-[#7a4200]">Están o estuvieron en el predio: son los más urgentes</dd>
            </div>
          </dl>
          <ul className="mt-4 divide-y divide-panel-line">
            {pendientes.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link href={`/panel/reservas/${item.id}`} className="font-semibold hover:underline">
                      {item.titular}
                    </Link>
                    {item.vino ? (
                      <span className="rounded-full bg-[#f5a13a] px-2 py-0.5 text-xs font-bold text-[#2e1900]">Ya vino</span>
                    ) : (
                      <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-bold text-panel-muted">Todavía no vino</span>
                    )}
                  </span>
                  <span className="block text-sm text-panel-muted">
                    N.º {item.id} · {item.codigo} · {rangoConMesPanel(item.desde, item.hasta)}
                    {item.cobrado ? ` · ya pagó ${pesos(item.cobrado)}` : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold tabular-nums">Debe {pesos(item.saldo)}</span>
                  <span className="block text-xs text-panel-muted">
                    {item.pierdeDescuento ? "Sin descuento: ya pagó una parte por banco" : `En efectivo: ${pesos(item.efectivo)}`}
                  </span>
                </span>
                <CobrarPendiente id={item.id} titular={item.titular} saldo={item.saldo} efectivo={item.efectivo} vino={item.vino} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export function CobrosAnticipados({ anticipados }: { anticipados: Anticipado[] }) {
  const total = (cajon: "EFECTIVO" | "BANCO") => anticipados.filter((item) => item.cajon === cajon).reduce((suma, item) => suma + item.importe, 0)
  return (
    <section aria-label="Cobrado por adelantado" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl tracking-tight">Cobrado por adelantado</h2>
        <p className="text-sm text-panel-muted">Señas y pagos de grupos que todavía no llegaron. Entran a la caja el día que llegan.</p>
      </div>
      <p className="mt-3 text-sm">
        En efectivo <strong className="tabular-nums">{pesos(total("EFECTIVO"))}</strong> · Por banco <strong className="tabular-nums">{pesos(total("BANCO"))}</strong>
      </p>
      <ul className="mt-2 divide-y divide-panel-line">
        {anticipados.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
            <span className="min-w-0 flex-1">
              <Link href={`/panel/reservas/${item.reservaId}`} className="font-semibold hover:underline">
                {item.titular} · N.º {item.reservaId}
              </Link>
              <span className="block text-xs text-panel-muted">
                Cobrado el {fechaCorta(item.fecha)} en {item.forma === "DEBITO" ? "débito" : item.forma.toLowerCase()}
                {item.registradoPor ? ` por ${item.registradoPor}` : ""} · llega el {fechaCorta(item.llega)}
              </span>
            </span>
            <span className="font-semibold tabular-nums">{pesos(item.importe)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
