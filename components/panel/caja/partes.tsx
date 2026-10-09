import { ArrowDownLeft, ArrowUpRight, Download, History, Landmark, Wallet } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { atajosDeCaja } from "@/app/panel/caja/periodo"
import { BorrarMovimiento } from "@/components/panel/caja/borrar-movimiento"
import { tipoDeRenglon, type FiltroDeCajon, type Resumen } from "@/lib/panel/caja"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { nombreDelCajon, nombreDeSeccion, type Renglon } from "@/lib/panel/libro-caja"
import { locales } from "@/lib/panel/local"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

export function fechaCorta(iso: string) {
  return iso.split("-").reverse().join("/")
}

export function textoDelPeriodo(desde: string, hasta: string) {
  return desde === hasta ? fechaLargaPanel(desde) : `Del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`
}

export type PestanaDeCaja = "general" | "reservas" | "restaurante" | "bar"

const pestanas: { id: PestanaDeCaja; nombre: string; href: string }[] = [
  { id: "general", nombre: "General", href: "/panel/caja" },
  { id: "reservas", nombre: "Reservas", href: "/panel/caja/reservas" },
  { id: "restaurante", nombre: "Restaurante", href: "/panel/caja/restaurante" },
  { id: "bar", nombre: "Bar", href: "/panel/caja/bar" },
]

/// La caja general y las de cada sección, con el período elegido.
export function PestanasDeCaja({ activa, desde, hasta }: { activa: PestanaDeCaja; desde: string; hasta: string }) {
  return (
    <nav aria-label="Cajas" className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-white p-1 md:inline-flex">
      {pestanas.map((pestana) => (
        <Link
          key={pestana.id}
          href={`${pestana.href}?${new URLSearchParams({ desde, hasta })}`}
          aria-current={pestana.id === activa ? "page" : undefined}
          className={cn("shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap", pestana.id === activa ? "bg-panel-ink text-white" : "hover:bg-panel")}
        >
          {pestana.nombre}
        </Link>
      ))}
    </nav>
  )
}

export function BotonesDeCaja({ csv, actividad = true }: { csv: string; actividad?: boolean }) {
  const clase = "inline-flex h-10 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"
  return (
    <div className="flex flex-wrap gap-2">
      {actividad ? (
        <Link href="/panel/caja/actividad" className={clase}>
          <History className="size-4" aria-hidden />
          Actividad
        </Link>
      ) : null}
      <a href={csv} className={clase}>
        <Download className="size-4" aria-hidden />
        Exportar a Excel
      </a>
    </div>
  )
}

/// Atajos de período y fechas Desde / Hasta. Conserva los demás filtros de la página.
export function SelectorDePeriodo({ ruta, hoy, desde, hasta, extras = {} }: { ruta: string; hoy: string; desde: string; hasta: string; extras?: Record<string, string> }) {
  const atajos = atajosDeCaja(hoy)
  const activo = atajos.find((atajo) => atajo.desde === desde && atajo.hasta === hasta)?.id
  return (
    <div className="mt-5 flex flex-wrap items-end gap-2">
      <nav aria-label="Períodos" className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-auto md:overflow-visible md:px-0 md:pb-0">
        {atajos.map((atajo) => (
          <Link
            key={atajo.id}
            href={`${ruta}?${new URLSearchParams({ ...extras, desde: atajo.desde, hasta: atajo.hasta })}`}
            aria-current={activo === atajo.id ? "true" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
              activo === atajo.id ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
            )}
          >
            {atajo.nombre}
          </Link>
        ))}
      </nav>
      <form action={ruta} className="flex flex-wrap items-end gap-2">
        {Object.entries(extras).map(([clave, valor]) => (
          <input key={clave} type="hidden" name={clave} value={valor} />
        ))}
        <label className="text-xs font-semibold text-panel-muted">
          Desde
          <input type="date" name="desde" defaultValue={desde} className="mt-1 block h-10 rounded-xl border border-panel-line bg-white px-3 text-sm text-panel-ink" />
        </label>
        <label className="text-xs font-semibold text-panel-muted">
          Hasta
          <input type="date" name="hasta" defaultValue={hasta} className="mt-1 block h-10 rounded-xl border border-panel-line bg-white px-3 text-sm text-panel-ink" />
        </label>
        <button type="submit" className="h-10 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted">
          Ver
        </button>
      </form>
    </div>
  )
}

/// Las tarjetas de los dos cajones. Las cajas de sección no tienen egresos: esos son del
/// predio y se ven en la general.
export function TarjetasDeCajones({ resumen, hasta, conEgreso, nota }: { resumen: Resumen; hasta: string; conEgreso: boolean; nota: string }) {
  return (
    <>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {resumen.map((cajon) => {
          const Icono = cajon.id === "EFECTIVO" ? Wallet : Landmark
          return (
            <section key={cajon.id} aria-label={cajon.nombre} className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}>
              <h2 className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-panel">
                  <Icono className="size-5 text-panel-tostado" aria-hidden />
                </span>
                <span>
                  <span className="font-display block text-xl leading-tight tracking-tight">{cajon.nombre}</span>
                  <span className="block text-xs text-panel-muted">{cajon.detalle}</span>
                </span>
              </h2>
              <dl className={cn("mt-4 grid gap-2 md:gap-3", conEgreso ? "grid-cols-3" : "grid-cols-2")}>
                <div className="rounded-2xl bg-[#e6f5e4] px-3 py-2.5">
                  <dt className="text-xs font-bold tracking-wide text-[#24622a] uppercase">Ingreso</dt>
                  <dd className="font-display mt-1 text-lg tracking-tight tabular-nums md:text-2xl">{pesos(cajon.ingreso)}</dd>
                </div>
                {conEgreso ? (
                  <div className="rounded-2xl bg-[#fde9e7] px-3 py-2.5">
                    <dt className="text-xs font-bold tracking-wide text-[#a32020] uppercase">Egreso</dt>
                    <dd className="font-display mt-1 text-lg tracking-tight tabular-nums md:text-2xl">{pesos(cajon.egreso)}</dd>
                  </div>
                ) : null}
                <div className="rounded-2xl bg-panel-ink px-3 py-2.5 text-white">
                  <dt className="text-xs font-bold tracking-wide text-white/75 uppercase">{conEgreso ? "Balance" : "Acumulado"}</dt>
                  <dd className={cn("font-display mt-1 text-lg tracking-tight tabular-nums md:text-2xl", cajon.balance < 0 && "text-[#ffb4ab]")}>{pesos(cajon.balance)}</dd>
                  <dd className="text-[0.7rem] text-white/70">al {fechaCorta(hasta)}</dd>
                </div>
              </dl>
            </section>
          )
        })}
      </div>
      <p className="mt-2 px-1 text-xs text-panel-muted">{nota}</p>
    </>
  )
}

const filtros: { id: FiltroDeCajon; nombre: string }[] = [
  { id: "todos", nombre: "Todos" },
  { id: "EFECTIVO", nombre: "Efectivo" },
  { id: "BANCO", nombre: "Banco" },
]

/// La lista de renglones con el filtro de cajón (y, en la general, el de sección).
export function ListaDeRenglones({
  titulo,
  renglones,
  filtro,
  enlace,
  vacio,
  arriba,
  filtrosExtra,
  conSeccion = false,
}: {
  titulo: string
  renglones: Renglon[]
  filtro: FiltroDeCajon
  enlace: (cajon: FiltroDeCajon) => string
  vacio: string
  arriba?: ReactNode
  filtrosExtra?: ReactNode
  conSeccion?: boolean
}) {
  const visibles = filtro === "todos" ? renglones : renglones.filter((renglon) => renglon.cajon === filtro)
  return (
    <section aria-label={titulo} className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight">{titulo}</h2>
        <nav aria-label="Cajón" className="flex gap-1.5">
          {filtros.map((item) => (
            <Link
              key={item.id}
              href={enlace(item.id)}
              aria-current={filtro === item.id ? "true" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold",
                filtro === item.id ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
              )}
            >
              {item.nombre}
            </Link>
          ))}
        </nav>
      </div>
      {filtrosExtra}
      {arriba ? <div className="mt-4 flex">{arriba}</div> : null}
      {visibles.length === 0 ? (
        <p className="mt-4 text-sm text-panel-muted">
          {vacio}
          {filtro !== "todos" ? ` en ${nombreDelCajon[filtro].toLowerCase()}` : ""}.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-panel-line">
          {visibles.map((renglon) => (
            <RenglonDeCaja key={renglon.clave} renglon={renglon} conSeccion={conSeccion} />
          ))}
        </ul>
      )}
    </section>
  )
}

const colorDeSeccion = {
  reservas: "bg-[#eaf3fb] text-[#1f5a8a]",
  restaurante: "bg-[#ffeedb] text-[#7a4200]",
  bar: "bg-[#efe6fb] text-[#5b2d91]",
  predio: "bg-panel text-panel-muted",
} as const

function RenglonDeCaja({ renglon, conSeccion }: { renglon: Renglon; conSeccion: boolean }) {
  const ingreso = renglon.sentido === "ingreso"
  const Flecha = ingreso ? ArrowDownLeft : ArrowUpRight
  const enlace =
    renglon.origen === "cobro"
      ? `/panel/reservas/${renglon.reservaId}`
      : renglon.origen === "cuenta"
        ? `${renglon.local === "RESTAURANTE" ? `${locales.RESTAURANTE.base}/cuentas` : locales.BAR.base}?fecha=${renglon.fecha}`
        : null
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", ingreso ? "bg-[#e6f5e4] text-[#24622a]" : "bg-[#fde9e7] text-[#a32020]")}>
        <Flecha className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          {conSeccion ? <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", colorDeSeccion[renglon.seccion])}>{nombreDeSeccion[renglon.seccion]}</span> : null}
          <span className="truncate font-semibold">
            {enlace ? (
              <Link href={enlace} className="hover:underline">
                {renglon.concepto}
                {renglon.origen === "cobro" ? ` · N.º ${renglon.reservaId}` : ""}
              </Link>
            ) : (
              renglon.concepto
            )}
          </span>
        </span>
        <span className="block text-xs text-panel-muted">
          {fechaCorta(renglon.fecha)} {hora.format(renglon.hora)} · {nombreDelCajon[renglon.cajon]} · {tipoDeRenglon(renglon)}
          {renglon.registradoPor ? ` · ${renglon.registradoPor}` : ""}
        </span>
      </span>
      <span className={cn("shrink-0 text-right font-semibold tabular-nums", ingreso ? "text-[#24622a]" : "text-[#a32020]")}>
        {ingreso ? "+" : "−"}
        {pesos(renglon.monto)}
        {renglon.origen === "cobro" && renglon.descuento ? <span className="block text-xs font-normal text-panel-muted">−{pesos(renglon.descuento)} desc.</span> : null}
      </span>
      <span className="w-9 shrink-0">
        {renglon.origen === "movimiento" ? <BorrarMovimiento id={renglon.movimientoId} descripcion={`«${renglon.concepto}» por ${pesos(renglon.monto)}`} /> : null}
      </span>
    </li>
  )
}
