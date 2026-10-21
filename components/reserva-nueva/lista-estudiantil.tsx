"use client"

import { ArrowRight, ChevronDown, Sun } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Foto } from "@/components/foto"
import styles from "@/components/student-options.module.css"
import { seccionesEstudiantiles, type FichaEstudiantil, type ItemEstudiantil, type SeccionEstudiantil } from "@/lib/propuestas"

const iconoDeSeccion = {
  campamento: { Icono: Carpa, fondo: "bg-green-soft text-green" },
  dormitorios: { Icono: Cucheta, fondo: "bg-earth-soft text-earth-ink" },
  jornada: { Icono: Sun, fondo: "bg-sand text-orange" },
} as const

export function ListaEstudiantil({ onReservar }: { onReservar?: (id: string) => void }) {
  const [seccionAbierta, setSeccionAbierta] = useState<SeccionEstudiantil["id"] | null>(null)

  return (
    <div className={`${styles.layout} ${seccionAbierta ? styles.expanded : styles.compact}`}>
      <div className={styles.drawer}>
        <p className="mb-4 text-sm leading-relaxed text-ink/65 sm:text-base">
          Elegí una categoría para comparar propuestas y precios por alumno.
        </p>
        <div className="space-y-3">
          {seccionesEstudiantiles.map((grupo) => (
            <Seccion
              key={grupo.id}
              grupo={grupo}
              abierta={seccionAbierta === grupo.id}
              onCambiar={() => setSeccionAbierta((actual) => (actual === grupo.id ? null : grupo.id))}
              onReservar={onReservar}
            />
          ))}
        </div>
      </div>
      <CollageEstudiantil oculto={seccionAbierta !== null} />
    </div>
  )
}

function Seccion({
  grupo,
  abierta,
  onCambiar,
  onReservar,
}: {
  grupo: SeccionEstudiantil
  abierta: boolean
  onCambiar: () => void
  onReservar?: (id: string) => void
}) {
  const { Icono, fondo } = iconoDeSeccion[grupo.id]
  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-ink/10 bg-white shadow-[0_10px_28px_rgba(58,53,48,0.06)]">
      <button
        type="button"
        aria-expanded={abierta}
        onClick={onCambiar}
        className="group grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-cream/55 sm:px-5"
      >
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${fondo}`}>
          <Icono className="size-6" />
        </span>
        <span className="min-w-0">
          <span className="font-display block text-[1.75rem] leading-none tracking-tight sm:text-3xl">{grupo.nombre}</span>
          <span className="mt-1.5 block text-xs font-semibold text-text-muted sm:text-sm">
            {grupo.propuestas.length} opciones
          </span>
        </span>
        <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-orange text-sobre-naranja shadow-[0_8px_18px_rgba(226,95,17,0.22)] transition-transform duration-300 group-hover:translate-x-1 ${abierta ? "rotate-90" : ""}`}>
          <ArrowRight className="size-7" strokeWidth={2.4} aria-hidden />
        </span>
      </button>
      {abierta ? (
        <div className={`${styles.options} space-y-2 border-t border-ink/10 px-3 py-3 sm:px-4`}>
          {grupo.propuestas.map((item) => (
            <Solapa key={item.id} item={item} onReservar={onReservar} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function Solapa({ item, onReservar }: { item: ItemEstudiantil; onReservar?: (id: string) => void }) {
  const tarifa = item.ficha.tarifas.find((item) => item.concepto === "Por alumno")

  return (
    <details className="group rounded-2xl bg-cream/70 open:bg-cream">
      <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-lake-ink">{item.numero}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{item.nombre}</span>
          <span className="mt-0.5 block text-sm text-text-muted">{item.horario}</span>
        </span>
        <span className="flex items-center gap-2 sm:gap-3">
          <span className="text-right">
            <span className="font-display block text-lg leading-none tracking-tight sm:text-2xl">{tarifa?.importe ?? "A consultar"}</span>
            <span className="mt-1 block text-[0.64rem] font-bold tracking-[0.11em] text-text-muted uppercase">
              {tarifa ? "por alumno" : "precio"}
            </span>
          </span>
          <ChevronDown className="size-5 shrink-0 text-ink/40 transition group-open:rotate-180" aria-hidden />
        </span>
      </summary>
      <Ficha ficha={item.ficha} id={item.id} onReservar={onReservar} />
    </details>
  )
}

const fotosEstudiantiles = [
  { src: "/covers/grupos-estudiantiles.jpg", alt: "Grupo estudiantil participando de una jornada en el predio." },
  { src: "/covers/campamento.jpg", alt: "Campamento estudiantil al aire libre." },
  { src: "/activities/campamentos.jpg", alt: "Espacio de encuentro y fogón para los grupos." },
]

function CollageEstudiantil({ oculto }: { oculto: boolean }) {
  return (
    <div className={`${styles.collage} ${oculto ? styles.collageHidden : ""}`} aria-hidden={oculto}>
      {fotosEstudiantiles.map((foto, index) => (
        <figure key={foto.src} className={`${styles.photoFrame} ${styles[`photo${index + 1}`]}`}>
          <span className={styles.tape} aria-hidden />
          <Foto src={foto.src} alt={foto.alt} sizes="(min-width: 1024px) 34vw, 80vw" className={styles.photo} />
        </figure>
      ))}
    </div>
  )
}

function Ficha({ ficha, id, onReservar }: { ficha: FichaEstudiantil; id: string; onReservar?: (id: string) => void }) {
  return (
    <div className="px-3 pb-4 text-[0.98rem] leading-relaxed sm:px-4">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:gap-5">
        <div className="space-y-4">
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
          <p className="text-sm font-semibold">
            {ficha.notas[0]} {ficha.notas[1]}
          </p>
        </div>
        <PreciosPorTemporada tarifas={ficha.tarifas} />
      </div>
      {onReservar ? (
        <button
          type="button"
          onClick={() => onReservar(id)}
          className="mt-5 inline-flex h-12 items-center rounded-full bg-orange px-6 font-bold text-sobre-naranja hover:bg-orange-hover"
        >
          Reservar esta propuesta
        </button>
      ) : (
        <Link
          href={`/?propuesta=estudiantil&opcion=${id}#como-reservar`}
          className="mt-5 inline-flex h-12 items-center rounded-full bg-orange px-6 font-bold text-sobre-naranja hover:bg-orange-hover"
        >
          Reservar esta propuesta
        </Link>
      )}
    </div>
  )
}

function PreciosPorTemporada({ tarifas }: { tarifas: FichaEstudiantil["tarifas"] }) {
  const temporadaBaja = tarifas.find((tarifa) => tarifa.concepto.toLocaleLowerCase("es").includes("temporada baja"))
  const temporadaAlta = tarifas.find((tarifa) => tarifa !== temporadaBaja)
  const temporadas = [
    { nombre: "Temporada alta", tarifa: temporadaAlta, color: "bg-[#fff3df] text-[#9a4a16]" },
    { nombre: "Temporada baja", tarifa: temporadaBaja, color: "bg-green-soft text-green" },
  ]

  return (
    <aside className="rounded-[1.35rem] border border-ink/10 bg-white p-4 shadow-[0_12px_28px_rgba(58,53,48,0.07)]" aria-label="Precios por temporada">
      <p className="text-xs font-bold tracking-[0.14em] text-lake-ink uppercase">Precios por alumno</p>
      <h4 className="font-display mt-1 text-2xl tracking-tight">Tarifas por temporada</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {temporadas.map(({ nombre, tarifa, color }) => (
          <section key={nombre} className="rounded-2xl border border-ink/10 bg-foam p-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-wide uppercase ${color}`}>
              {nombre}
            </span>
            <p className="font-display mt-2 text-3xl leading-none tracking-tight">{tarifa?.importe ?? "A definir"}</p>
            <p className="mt-1 text-sm text-text-muted">{tarifa?.cuotas ?? "La información se cargará próximamente."}</p>
            <div className="mt-3 border-t border-ink/10 pt-3">
              <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Pago en efectivo</p>
              <p className="mt-1 font-semibold">{tarifa?.efectivo ?? "A definir"}</p>
              {tarifa?.cuotasEfectivo ? <p className="text-sm text-text-muted">{tarifa.cuotasEfectivo}</p> : null}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-text-muted">
        Los valores y las fechas de cada temporada se podrán actualizar sin modificar la propuesta.
      </p>
    </aside>
  )
}

function Comidas({ ficha }: { ficha: FichaEstudiantil }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <h4 className="text-xs font-bold tracking-wide text-text-muted uppercase">Comidas</h4>
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
