import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesMesa } from "@/components/panel/acciones-mesa"
import { InsigniaDeEstado, LeyendaDeEstados } from "@/components/panel/insignia-de-estado"
import { PestanasDelLocal } from "@/components/panel/local/pestanas"
import { locales } from "@/lib/panel/local"
import { estilosDeEstado } from "@/lib/panel/estados"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { restauranteDelDia, type ReservaDeMesa } from "@/lib/panel/restaurante"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, horaEnElPredio, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { HORARIO_RESTAURANTE, textoDeHora } from "@/lib/predio/horario"
import type { UnidadPredio } from "@/lib/predio/inventario"
import { cn } from "cn"

export const metadata: Metadata = { title: "Restaurante" }

const horas = Array.from({ length: HORARIO_RESTAURANTE.cierra - HORARIO_RESTAURANTE.abre }, (_, indice) => HORARIO_RESTAURANTE.abre + indice)

function apellidoDe(titular: string) {
  return titular.split(" ").at(-1) ?? titular
}

export default async function PanelRestaurante({ searchParams }: PageProps<"/panel/restaurante">) {
  const sesion = await exigirPanel("restaurante")
  const veDetalle = puedeVer(sesion.user.role, "reservas") || puedeVer(sesion.user.role, "puerta")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const fechaPedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const enlace = (dia: string) => (dia === hoy ? "/panel/restaurante" : `/panel/restaurante?fecha=${dia}`)
  const horaActual = momento === "hoy" ? horaEnElPredio() : null

  const { reservas, mesas, bloques } = await restauranteDelDia(fecha)
  const porId = new Map(reservas.map((reserva) => [reserva.id, reserva]))
  const esperadas = reservas.reduce((suma, reserva) => suma + reserva.personas, 0)
  const llegaron = reservas.reduce((suma, reserva) => suma + reserva.adentro + reserva.salieron, 0)
  const enLaMesa = reservas.reduce((suma, reserva) => suma + reserva.adentro, 0)
  const conReserva = mesas.filter((mesa) => bloques.get(mesa.id)?.length).length

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Restaurante</p>
          {momento !== "hoy" ? (
            <Link href="/panel/restaurante" className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
              Hoy
            </Link>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-2 md:mt-2 md:gap-x-2">
          <Link href={enlace(sumarDiasIso(fecha, -1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día anterior">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <h1 className="font-display min-w-0 text-center text-2xl leading-tight tracking-tight md:text-4xl">{fechaLargaPanel(fecha)}</h1>
          <Link href={enlace(sumarDiasIso(fecha, 1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día siguiente">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
          <form action="/panel/restaurante" className="flex items-center gap-2 md:ml-3">
            <input type="date" name="fecha" defaultValue={fecha} aria-label="Elegir otro día" className="h-10 rounded-xl border border-panel-line bg-white px-3 text-sm" />
            <button type="submit" className="h-10 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted">
              Ir
            </button>
          </form>
        </div>
        <PestanasDelLocal local={locales.RESTAURANTE} activa="salon" />
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { termino: "Reservas", valor: String(reservas.length) },
          { termino: "Personas esperadas", valor: String(esperadas) },
          momento === "hoy" ? { termino: "En la mesa ahora", valor: `${enLaMesa} de ${esperadas}` } : { termino: "Llegaron", valor: `${llegaron} de ${esperadas}` },
          { termino: "Mesas con reserva", valor: `${conReserva} de ${mesas.length}` },
        ].map((dato) => (
          <div key={dato.termino} className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{dato.termino}</dt>
            <dd className="font-display mt-1 text-2xl tracking-tight md:text-3xl">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="El salón por horario" className="mt-6 rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="font-display text-2xl tracking-tight">El salón</h2>
          <p className="text-sm text-panel-muted">Cada fila es una mesa; tocá una reserva para ver el detalle.</p>
        </div>
        <Salon mesas={mesas} bloques={bloques} porId={porId} horaActual={horaActual} />
      </section>

      <div className="mt-6">
        <LeyendaDeEstados estados={["a-confirmar", "confirmada", "parcial", "ingresada", "finalizada", "no-vino"]} />
      </div>

      <section aria-label="Reservas del día" className="mt-6">
        <h2 className="font-display flex items-center gap-3 text-2xl tracking-tight">
          Reservas del día
          <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{reservas.length}</span>
        </h2>
        {reservas.length === 0 ? (
          <p className="mt-2 text-sm text-panel-muted">No hay reservas de mesa para este día.</p>
        ) : (
          <ul className="mt-3 grid gap-3 xl:grid-cols-2">
            {reservas.map((reserva) => (
              <Tarjeta key={reserva.id} reserva={reserva} veDetalle={veDetalle} bloqueada={momento === "futuro"} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function Salon({
  mesas,
  bloques,
  porId,
  horaActual,
}: {
  mesas: UnidadPredio[]
  bloques: Map<string, { reservaId: number; desde: number; hasta: number }[]>
  porId: Map<number, ReservaDeMesa>
  horaActual: number | null
}) {
  const columna = (hora: number) => hora - HORARIO_RESTAURANTE.abre + 2
  return (
    <div className="relative -mx-4 mt-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="grid min-w-[46rem] gap-y-1.5" style={{ gridTemplateColumns: `6.5rem repeat(${horas.length}, minmax(4rem, 1fr))` }}>
        <span aria-hidden />
        {horas.map((hora) => (
          <span
            key={hora}
            className={cn(
              "relative border-l border-panel-line px-1.5 pb-1 text-xs font-bold tabular-nums text-panel-muted",
              hora === horaActual && "rounded-t-lg bg-panel-ink text-white",
            )}
          >
            {textoDeHora(hora)}
            {hora === horaActual ? <span className="sr-only"> (ahora)</span> : null}
          </span>
        ))}

        {mesas.map((mesa, fila) => {
          const deLaMesa = bloques.get(mesa.id) ?? []
          return [
            <span
              key={`${mesa.id}-nombre`}
              className="sticky left-0 z-20 flex h-14 flex-col justify-center bg-white pr-2"
              style={{ gridRow: fila + 2, gridColumn: 1 }}
            >
              <span className="font-bold">Mesa {mesa.etiqueta}</span>
              <span className="text-xs text-panel-muted">{mesa.capacidad} personas</span>
            </span>,
            ...horas.map((hora) => (
              <span
                key={`${mesa.id}-${hora}`}
                aria-hidden
                className={cn("h-14 border-l border-panel-line", hora === horaActual ? "bg-panel-claro/60" : fila % 2 ? "bg-panel/40" : "")}
                style={{ gridRow: fila + 2, gridColumn: columna(hora) }}
              />
            )),
            ...deLaMesa.map((bloque) => {
              const reserva = porId.get(bloque.reservaId)
              if (!reserva) return null
              const estilo = estilosDeEstado[reserva.visible]
              return (
                <a
                  key={`${mesa.id}-${bloque.reservaId}-${bloque.desde}`}
                  href={`#reserva-${reserva.id}`}
                  title={`${reserva.titular} · ${reserva.personas} personas · ${textoDeHora(bloque.desde)} a ${textoDeHora(bloque.hasta)} · ${estilo.nombre}`}
                  aria-label={`Mesa ${mesa.etiqueta}, de ${textoDeHora(bloque.desde)} a ${textoDeHora(bloque.hasta)}: ${reserva.titular}, ${reserva.personas} personas, ${estilo.nombre}`}
                  className={cn(
                    "z-10 mx-0.5 flex h-14 min-w-0 flex-col justify-center rounded-lg border-2 border-l-8 px-2 text-xs leading-tight hover:brightness-95",
                    estilo.tarjeta,
                    estilo.borde,
                  )}
                  style={{ gridRow: fila + 2, gridColumn: `${columna(bloque.desde)} / ${columna(bloque.hasta)}` }}
                >
                  <span className="truncate font-bold">{apellidoDe(reserva.titular)}</span>
                  <span className="truncate">
                    {reserva.personas} pers. · {estilo.nombre}
                  </span>
                </a>
              )
            }),
          ]
        })}
      </div>
    </div>
  )
}

function Tarjeta({ reserva, veDetalle, bloqueada }: { reserva: ReservaDeMesa; veDetalle: boolean; bloqueada: boolean }) {
  const estilo = estilosDeEstado[reserva.visible]
  const importantes = reserva.integrantes.filter((persona) => persona.notas)
  const mesas = reserva.lugares.length ? reserva.lugares.join(" · ") : "Sin mesa asignada"
  return (
    <li id={`reserva-${reserva.id}`} className={cn("scroll-mt-6 rounded-3xl border-2 border-l-8 p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5", estilo.tarjeta, estilo.borde)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-3xl tracking-tight tabular-nums">{reserva.horario}</p>
          <p className="mt-0.5 text-base font-semibold">{mesas}</p>
        </div>
        <InsigniaDeEstado estado={reserva.visible} grande />
      </div>
      <p className="mt-3 text-xl font-semibold">
        {veDetalle ? (
          <Link href={`/panel/reservas/${reserva.id}`} className="hover:underline">
            {reserva.titular}
          </Link>
        ) : (
          reserva.titular
        )}
      </p>
      <p className="text-base text-panel-ink/80">
        {reserva.personas} {reserva.personas === 1 ? "persona" : "personas"} · Reserva N.º {reserva.id}
        {reserva.adentro + reserva.salieron > 0 ? ` · llegaron ${reserva.adentro + reserva.salieron} de ${reserva.total}` : ""}
      </p>

      {importantes.length ? (
        <div className="mt-3 flex gap-2.5 rounded-2xl border border-panel-ambar bg-white/80 px-3 py-2.5 text-sm">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-panel-tostado" aria-hidden />
          <ul className="space-y-0.5">
            {importantes.map((persona) => (
              <li key={persona.id}>
                <strong>
                  {persona.nombre} {persona.apellido}
                </strong>{" "}
                <span className="text-panel-muted">({persona.edad} años)</span>: {persona.notas}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        {bloqueada ? (
          <p className="text-sm text-panel-ink/70">La llegada se marca ese día.</p>
        ) : (
          <AccionesMesa
            id={reserva.id}
            titular={reserva.titular}
            asistencia={{ porPersona: reserva.porPersona, estado: reserva.asistencia, adentro: reserva.adentro, salieron: reserva.salieron, total: reserva.total }}
            integrantes={reserva.integrantes}
          />
        )}
      </div>
    </li>
  )
}
