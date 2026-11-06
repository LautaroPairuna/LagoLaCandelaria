import type { Metadata } from "next"
import Link from "next/link"

import { EncabezadoDelDia } from "@/components/panel/encabezado-del-dia"
import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { totalesPorForma } from "@/lib/panel/cobros"
import { estilosDeEstado, ordenDeEstados } from "@/lib/panel/estados"
import { llegadasDelDia, pagosDelDia } from "@/lib/panel/puerta"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, hoyEnElPredio } from "@/lib/predio/fechas"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "General · Puerta" }

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

/// Los resultados del día en Puerta: cuántos vienen, cuántos entraron, lo cobrado y lo que
/// falta cobrar. Más adelante cada jerarquía de usuario puede tener su propio tablero acá.
export default async function GeneralDePuerta({ searchParams }: PageProps<"/panel/puerta/general">) {
  await exigirPanel("puerta")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const pedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = pedida && esFechaIso(pedida) ? pedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const [reservas, pagos] = await Promise.all([llegadasDelDia(fecha), pagosDelDia(fecha)])

  const personas = reservas.reduce((suma, item) => suma + item.personas, 0)
  const adentro = reservas.reduce((suma, item) => suma + item.adentro, 0)
  const salieron = reservas.reduce((suma, item) => suma + item.salieron, 0)
  const caja = totalesPorForma(pagos)
  const cobrado = caja.EFECTIVO + caja.DEBITO + caja.TRANSFERENCIA
  const porCobrar = reservas.reduce((suma, item) => suma + (item.saldo ?? 0), 0)
  const aPresupuestar = reservas.filter((item) => item.aConfirmar).length

  const porEstado = ordenDeEstados.map((estado) => ({ estado, cantidad: reservas.filter((item) => item.visible === estado).length })).filter((fila) => fila.cantidad)
  const porPropuesta = Object.entries(
    reservas.reduce<Record<string, { grupos: number; personas: number }>>((tabla, item) => {
      const fila = (tabla[item.modulo] ??= { grupos: 0, personas: 0 })
      fila.grupos += 1
      fila.personas += item.personas
      return tabla
    }, {}),
  )
  const porLugar = Object.entries(
    reservas.flatMap((item) => item.unidades).reduce<Record<string, number>>((tabla, unidad) => ({ ...tabla, [unidad.tipo]: (tabla[unidad.tipo] ?? 0) + 1 }), {}),
  )

  const datos = [
    { termino: "Grupos", valor: String(reservas.length) },
    { termino: "Personas esperadas", valor: String(personas) },
    momento === "pasado" ? { termino: "Vinieron", valor: `${adentro + salieron} de ${personas}` } : { termino: "Adentro ahora", valor: `${adentro} de ${personas}` },
    { termino: "Ya se fueron", valor: String(salieron) },
    { termino: momento === "hoy" ? "Cobrado hoy" : "Cobrado ese día", valor: pesos(cobrado), href: `/panel/puerta/caja?desde=${fecha}&hasta=${fecha}` },
    { termino: "Por cobrar", valor: pesos(porCobrar), detalle: aPresupuestar ? `Más ${aPresupuestar} a presupuestar` : undefined },
  ]

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDelDia fecha={fecha} hoy={hoy} ruta="/panel/puerta/general" kicker="Resultados del día" />
      <PestanasDePuerta activa="general" fecha={momento === "hoy" ? undefined : fecha} />

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {datos.map((dato) => (
          <div key={dato.termino} className={cn("rounded-2xl bg-white px-4 py-3", sombra)}>
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{dato.termino}</dt>
            <dd className="font-display mt-1 text-2xl tracking-tight break-words tabular-nums md:text-3xl xl:text-2xl 2xl:text-3xl">
              {"href" in dato && dato.href ? (
                <Link href={dato.href} className="hover:underline">
                  {dato.valor}
                </Link>
              ) : (
                dato.valor
              )}
            </dd>
            {"detalle" in dato && dato.detalle ? <dd className="text-xs text-panel-muted">{dato.detalle}</dd> : null}
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Tarjeta titulo="Cobrado por forma de pago">
          {(["EFECTIVO", "DEBITO", "TRANSFERENCIA"] as const).map((forma) => (
            <Fila key={forma} termino={forma === "DEBITO" ? "Débito" : forma === "EFECTIVO" ? "Efectivo" : "Transferencia"} valor={pesos(caja[forma])} />
          ))}
        </Tarjeta>
        <Tarjeta titulo="Reservas por estado" vacio={!porEstado.length}>
          {porEstado.map(({ estado, cantidad }) => (
            <Fila
              key={estado}
              termino={
                <span className="flex items-center gap-2">
                  <span className={cn("size-3 rounded-full", estilosDeEstado[estado].insignia)} aria-hidden />
                  {estilosDeEstado[estado].nombre}
                </span>
              }
              valor={String(cantidad)}
            />
          ))}
        </Tarjeta>
        <Tarjeta titulo="Por propuesta" vacio={!porPropuesta.length}>
          {porPropuesta.map(([modulo, fila]) => (
            <Fila key={modulo} termino={nombreDelModulo[modulo as keyof typeof nombreDelModulo]} valor={`${fila.grupos} · ${fila.personas} pers.`} />
          ))}
        </Tarjeta>
        <Tarjeta titulo="Lugares ocupados" vacio={!porLugar.length}>
          {porLugar.map(([tipo, cantidad]) => (
            <Fila key={tipo} termino={nombreDeUnidad[tipo as keyof typeof nombreDeUnidad]} valor={String(cantidad)} />
          ))}
        </Tarjeta>
      </div>
    </main>
  )
}

function Tarjeta({ titulo, vacio = false, children }: { titulo: string; vacio?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-3xl bg-white p-5", sombra)} aria-label={titulo}>
      <h2 className="font-display text-xl tracking-tight">{titulo}</h2>
      {vacio ? <p className="mt-2 text-sm text-panel-muted">No hay reservas ese día.</p> : <dl className="mt-3 divide-y divide-panel-line text-sm">{children}</dl>}
    </section>
  )
}

function Fila({ termino, valor }: { termino: React.ReactNode; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt>{termino}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}
