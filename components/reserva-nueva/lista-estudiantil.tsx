import { ChevronDown, Sun } from "lucide-react"
import Link from "next/link"

import { seccionesEstudiantiles, type FichaEstudiantil, type ItemEstudiantil, type SeccionEstudiantil } from "@/lib/propuestas"

const iconoDeSeccion = {
  campamento: { Icono: Carpa, fondo: "bg-green-soft text-green" },
  dormitorios: { Icono: Cucheta, fondo: "bg-earth-soft text-earth-ink" },
  jornada: { Icono: Sun, fondo: "bg-sand text-orange" },
} as const

export function ListaEstudiantil() {
  return (
    <div className="space-y-4">
      <p className="text-ink/70">Abrí una propuesta para ver qué incluye y cuánto sale.</p>
      {seccionesEstudiantiles.map((grupo) => (
        <Seccion key={grupo.id} grupo={grupo} />
      ))}
    </div>
  )
}

function Seccion({ grupo }: { grupo: SeccionEstudiantil }) {
  const { Icono, fondo } = iconoDeSeccion[grupo.id]
  return (
    <details open className="group/seccion rounded-[1.6rem] border border-ink/10 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${fondo}`}>
          <Icono className="size-6" />
        </span>
        <span className="font-display min-w-0 flex-1 text-3xl tracking-tight">{grupo.nombre}</span>
        <ChevronDown className="size-5 shrink-0 text-ink/40 transition group-open/seccion:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 border-t border-ink/10 px-3 py-3 sm:px-4">
        {grupo.propuestas.map((item) => (
          <Solapa key={item.id} item={item} />
        ))}
      </div>
    </details>
  )
}

function Solapa({ item }: { item: ItemEstudiantil }) {
  return (
    <details className="group rounded-2xl bg-cream/70 open:bg-cream">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-lake-ink">{item.numero}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{item.nombre}</span>
          <span className="mt-0.5 block text-sm text-ink/60">{item.horario}</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-ink/40 transition group-open:rotate-180" aria-hidden />
      </summary>
      <Ficha ficha={item.ficha} id={item.id} />
    </details>
  )
}

function Ficha({ ficha, id }: { ficha: FichaEstudiantil; id: string }) {
  return (
    <div className="space-y-4 px-3 pb-4 text-[0.98rem] leading-relaxed sm:px-4">
      <p>{ficha.cierre}</p>
      <ul className="space-y-2">
        {ficha.incluye.map((linea) => (
          <li key={linea} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lake" aria-hidden />
            <span>{linea}</span>
          </li>
        ))}
      </ul>
      {ficha.comidas ? <Comidas ficha={ficha} /> : null}
      {ficha.aviso ? <p className="rounded-2xl bg-sand px-4 py-3 font-semibold">{ficha.aviso}</p> : null}
      <div className="border-l-2 border-earth px-4 text-sm text-ink/80">
        {ficha.condiciones.map((condicion) => (
          <p key={condicion} className="mt-2 first:mt-0">
            {condicion}
          </p>
        ))}
      </div>
      {ficha.tarifas.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {ficha.tarifas.map((tarifa) => (
            <article key={tarifa.concepto} className="rounded-2xl bg-white px-4 py-3">
              <h4 className="text-xs font-bold tracking-wide text-ink/55 uppercase">{tarifa.concepto}</h4>
              <p className="font-display mt-1 text-3xl tracking-tight">{tarifa.importe}</p>
              <p className="text-sm text-ink/60">{tarifa.cuotas}</p>
              <p className="mt-3 border-t border-ink/10 pt-3 font-semibold">En efectivo, en el predio: {tarifa.efectivo}</p>
              <p className="text-sm text-ink/60">{tarifa.cuotasEfectivo}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-white px-4 py-3 text-ink/70">La tarifa de esta propuesta no figura en la planilla.</p>
      )}
      <p className="text-sm font-semibold">
        {ficha.notas[0]} {ficha.notas[1]}
      </p>
      <Link
        href={`/reserva?propuesta=estudiantil&opcion=${id}`}
        className="inline-flex h-12 items-center rounded-full bg-orange px-6 font-bold text-white hover:bg-orange-hover"
      >
        Reservar esta propuesta
      </Link>
    </div>
  )
}

function Comidas({ ficha }: { ficha: FichaEstudiantil }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <h4 className="text-xs font-bold tracking-wide text-ink/55 uppercase">Comidas</h4>
      {ficha.comidas?.map((dia) => (
        <div key={dia.dia || "dia"} className="mt-3">
          {dia.dia ? <p className="font-semibold">{dia.dia}</p> : null}
          <dl className="mt-1">
            {dia.comidas.map((comida) => (
              <div key={`${dia.dia}-${comida.momento}`} className="mt-1.5 grid grid-cols-[5.6rem_1fr] gap-x-3 text-sm">
                <dt className="font-semibold text-lake-ink">{comida.momento}</dt>
                <dd>{comida.detalle}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      {ficha.notaComidas ? <p className="mt-3 text-sm text-ink/70">{ficha.notaComidas}</p> : null}
    </div>
  )
}

function Carpa({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="currentColor" fillRule="evenodd" d="M12 2.5 1.5 21.5h21L12 2.5Zm0 9.2 3.1 9.8h-6.2L12 11.7Z" />
    </svg>
  )
}

function Cucheta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21V3" />
      <path d="M3 7h15a2 2 0 0 1 2 2v2H3" />
      <path d="M3 15h15a2 2 0 0 1 2 2v4H3" />
      <path d="M7 7V4.5" />
      <path d="M7 15v-2.5" />
    </svg>
  )
}
