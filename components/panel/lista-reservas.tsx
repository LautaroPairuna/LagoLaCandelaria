import Link from "next/link";
import type { ReactNode } from "react";

import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado";
import { estilosDeEstado } from "@/lib/panel/estados";
import { rangoPanel } from "@/lib/panel/formato";
import { nombreDelModulo, type ReservaDelMes } from "@/lib/panel/reservas";
import { cn } from "cn";

export function ListaReservas({
  titulo,
  reservas,
  vacio,
  mostrarEstado = false,
  accion,
}: {
  titulo: string;
  reservas: ReservaDelMes[];
  vacio: string;
  mostrarEstado?: boolean;
  accion?: ReactNode;
}) {
  return (
    <section
      aria-label={titulo}
      className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-3 font-display text-xl tracking-tight md:text-2xl">
          {titulo}
          <span className="rounded-full bg-panel px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">
            {reservas.length}
          </span>
        </h2>
        {accion}
      </div>
      {reservas.length === 0 ? (
        <p className="mt-3 text-sm text-panel-muted">{vacio}</p>
      ) : (
        <ul className="mt-2">
          {reservas.map((reserva) => (
            <li key={reserva.id}>
              <Link
                href={`/panel/reservas/${reserva.id}`}
                className={cn(
                  "my-2 flex items-start gap-3 rounded-2xl border-2 border-l-8 px-3 py-3 hover:brightness-95",
                  estilosDeEstado[reserva.visible].tarjeta,
                  estilosDeEstado[reserva.visible].borde,
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {nombreDelModulo[reserva.modulo]} · {reserva.personas} pers.
                  </span>
                  <span className="flex items-center gap-2 text-sm text-panel-muted">
                    <span className="truncate">{reserva.titular}</span>
                    {mostrarEstado ? (
                      <InsigniaDeEstado
                        estado={reserva.visible}
                        className="shrink-0"
                      />
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs font-semibold text-panel-muted">
                  {rangoPanel(reserva.desde, reserva.hasta)}
                  <span className="block font-normal">N.º {reserva.id}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
