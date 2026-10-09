import { ChevronLeft, ChevronRight, Download, ExternalLink, QrCode } from "lucide-react"
import Link from "next/link"
import QRCode from "qrcode"

import { AbrirCuenta, TarjetaDeCuenta, type MesaReservada } from "@/components/panel/local/cuentas"
import { EditorDeMenu } from "@/components/panel/local/editor-de-menu"
import { PestanasDelLocal } from "@/components/panel/local/pestanas"
import { cuentasDelDia, menuDelLocal } from "@/lib/panel/cuentas"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { resumenDeCuentas, type DatosDelLocal } from "@/lib/panel/local"
import { restauranteDelDia } from "@/lib/panel/restaurante"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { urlSitio } from "@/lib/url-sitio"
import { cn } from "cn"

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

/// Las cuentas del día del local: qué mesas están activas, qué pidió cada una y qué está
/// cobrado o pendiente. Es la caja propia del local, aparte de la del predio.
export async function PaginaDeCuentas({ local, fechaPedida }: { local: DatosDelLocal; fechaPedida?: string }) {
  await exigirPanel(local.panel)
  const hoy = hoyEnElPredio()
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const ruta = local.id === "RESTAURANTE" ? `${local.base}/cuentas` : local.base
  const enlace = (dia: string) => (dia === hoy ? ruta : `${ruta}?fecha=${dia}`)
  const sePuedeAbrir = fecha <= sumarDiasIso(hoy, 1) && fecha >= sumarDiasIso(hoy, -7)

  const [cuentas, menu, delDia] = await Promise.all([
    cuentasDelDia(local.id, fecha),
    menuDelLocal(local.id),
    local.id === "RESTAURANTE" ? restauranteDelDia(fecha) : Promise.resolve(null),
  ])
  const resumen = resumenDeCuentas(cuentas)
  const conCuenta = new Set(cuentas.map((cuenta) => cuenta.reservaId))
  const reservadas: MesaReservada[] = (delDia?.reservas ?? [])
    .filter((reserva) => !conCuenta.has(reserva.id))
    .map((reserva) => ({ reservaId: reserva.id, mesa: reserva.lugares.join(" y ") || "Sin mesa", titular: reserva.titular, horario: reserva.horario }))
  const abiertas = cuentas.filter((cuenta) => cuenta.estado === "ABIERTA")
  const cobradas = cuentas.filter((cuenta) => cuenta.estado === "COBRADA")

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">{local.nombre} · Cuentas</p>
          {fecha !== hoy ? (
            <Link href={ruta} className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
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
        </div>
        <PestanasDelLocal local={local} activa="cuentas" />
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 rounded-2xl bg-panel-ink px-4 py-3 text-white lg:col-span-1">
          <dt className="text-xs font-bold tracking-wide text-white/75 uppercase">Cobrado</dt>
          <dd className="font-display mt-1 text-3xl tracking-tight tabular-nums">{pesos(resumen.totalCobrado)}</dd>
          <dd className="text-xs text-white/75">
            Efectivo {pesos(resumen.cobrado.EFECTIVO)} · Débito {pesos(resumen.cobrado.DEBITO)} · Transf. {pesos(resumen.cobrado.TRANSFERENCIA)}
          </dd>
        </div>
        <div className="rounded-2xl border-2 border-[#f0b266] bg-[#ffeedb] px-4 py-3">
          <dt className="text-xs font-bold tracking-wide text-[#7a4200] uppercase">Pendiente de cobro</dt>
          <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{pesos(resumen.pendiente)}</dd>
        </div>
        <div className={cn("rounded-2xl bg-white px-4 py-3", sombra)}>
          <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">Mesas abiertas</dt>
          <dd className="font-display mt-1 text-2xl tracking-tight md:text-3xl">{resumen.abiertas}</dd>
        </div>
        <div className={cn("rounded-2xl bg-white px-4 py-3", sombra)}>
          <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">Cuentas del día</dt>
          <dd className="font-display mt-1 text-2xl tracking-tight md:text-3xl">{cuentas.length}</dd>
        </div>
      </dl>

      {sePuedeAbrir ? (
        <section aria-label="Abrir cuenta" className={cn("mt-6 rounded-3xl bg-white p-4 md:p-5", sombra)}>
          <h2 className="font-display text-2xl tracking-tight">Abrir una cuenta</h2>
          <div className="mt-3">
            <AbrirCuenta local={local.id} fecha={fecha} mesas={local.mesas} reservadas={reservadas} />
          </div>
          {menu.length === 0 ? (
            <p className="mt-3 text-sm text-panel-muted">
              La carta está vacía: cargala en{" "}
              <Link href={`${local.base}/menu`} className="font-semibold text-panel-tostado underline underline-offset-4">
                Menú
              </Link>{" "}
              para elegir los platos con un toque.
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Mesas activas" className="mt-6">
        <h2 className="font-display flex items-center gap-3 text-2xl tracking-tight">
          Mesas activas
          <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{abiertas.length}</span>
        </h2>
        {abiertas.length === 0 ? (
          <p className="mt-2 text-sm text-panel-muted">No hay cuentas abiertas.</p>
        ) : (
          <ul className="mt-3 grid gap-3 xl:grid-cols-2">
            {abiertas.map((cuenta) => (
              <TarjetaDeCuenta key={cuenta.id} cuenta={cuenta} menu={menu} />
            ))}
          </ul>
        )}
      </section>

      {cobradas.length ? (
        <section aria-label="Cobradas" className="mt-6">
          <h2 className="font-display flex items-center gap-3 text-2xl tracking-tight">
            Cobradas
            <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{cobradas.length}</span>
          </h2>
          <ul className="mt-3 grid gap-3 xl:grid-cols-2">
            {cobradas.map((cuenta) => (
              <TarjetaDeCuenta key={cuenta.id} cuenta={cuenta} menu={menu} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}

/// La carta del local y el QR del menú digital.
export async function PaginaDeMenu({ local }: { local: DatosDelLocal }) {
  await exigirPanel(local.panel)
  const items = await menuDelLocal(local.id)
  const enlace = `${urlSitio}/menu/${local.slug}`
  const qr = await QRCode.toDataURL(enlace, { margin: 2, width: 520, color: { dark: "#3a2a18", light: "#ffffff" } })

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">{local.nombre} · Menú</p>
        <h1 className="font-display mt-1 text-3xl tracking-tight md:mt-2 md:text-4xl">La carta</h1>
        <PestanasDelLocal local={local} activa="menu" />
      </header>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Carta" className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}>
          <EditorDeMenu local={local.id} items={items} />
        </section>

        <aside aria-label="Menú digital" className={cn("rounded-3xl bg-white p-5 xl:sticky xl:top-6", sombra)}>
          <h2 className="font-display flex items-center gap-2 text-2xl tracking-tight">
            <QrCode className="size-6 text-panel-tostado" aria-hidden />
            Menú digital
          </h2>
          <p className="mt-1 text-sm text-panel-muted">
            Imprimí este QR y ponelo en las mesas: abre la carta en el celular. Muestra solo lo que tiene «Hay» tildado.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- es un data URL generado acá */}
          <img src={qr} alt={`Código QR del menú de ${local.nombre.toLowerCase()}`} className="mx-auto mt-4 w-full max-w-64 rounded-2xl border border-panel-line" />
          <p className="mt-2 text-center text-xs break-all text-panel-muted">{enlace}</p>
          <div className="mt-4 grid gap-2">
            <a
              href={qr}
              download={`qr-menu-${local.slug}.png`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-panel-ink px-4 text-sm font-semibold text-white hover:bg-panel-tostado"
            >
              <Download className="size-4" aria-hidden />
              Descargar QR para imprimir
            </a>
            <a
              href={`/menu/${local.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-panel-line px-4 text-sm font-semibold hover:border-panel-muted"
            >
              <ExternalLink className="size-4" aria-hidden />
              Ver el menú como lo ve el cliente
            </a>
          </div>
        </aside>
      </div>
    </main>
  )
}
