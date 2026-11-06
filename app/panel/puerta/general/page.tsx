import { CircleCheck, MapPin, TriangleAlert, Users, Wallet, type LucideIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { EncabezadoDelDia } from "@/components/panel/encabezado-del-dia"
import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { totalesPorForma } from "@/lib/panel/cobros"
import { estilosDeEstado, ordenDeEstados } from "@/lib/panel/estados"
import { llegadasDelDia, pagosDelDia } from "@/lib/panel/puerta"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { aFechaDb, esFechaIso, hoyEnElPredio } from "@/lib/predio/fechas"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { pesos } from "@/lib/predio/tarifas"
import { db } from "@/lib/prisma"
import { cn } from "cn"

export const metadata: Metadata = { title: "General · Puerta" }

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
const numero = new Intl.NumberFormat("es-AR")

/// Los colores de cada bloque: personas en azul, plata en verde, lugares y estados en naranja.
const colores = {
  personas: { borde: "border-t-[#1f6aa5]", icono: "bg-[#eaf3fb] text-[#1f6aa5]" },
  plata: { borde: "border-t-[#2e7d32]", icono: "bg-[#e6f5e4] text-[#2e7d32]" },
  lugares: { borde: "border-t-[#e07b1a]", icono: "bg-[#ffeedb] text-[#a85d00]" },
}

type Alerta = { texto: string; href?: string; grave?: boolean }

/// Los resultados del día en Puerta, separados por tema: personas (esperadas, adentro,
/// retiradas), plata (cobrado y pendiente) y lugares y estados. Arriba, lo que necesita
/// atención.
export default async function GeneralDePuerta({ searchParams }: PageProps<"/panel/puerta/general">) {
  await exigirPanel("puerta")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const pedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = pedida && esFechaIso(pedida) ? pedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const [reservas, pagos, pendientesDeConfirmar] = await Promise.all([
    llegadasDelDia(fecha),
    pagosDelDia(fecha),
    db().reserva.count({ where: { estado: "PENDIENTE", hasta: { gte: aFechaDb(hoy) } } }),
  ])
  const enPuerta = (filtros: Record<string, string>) => `/panel/puerta?${new URLSearchParams({ ...(momento === "hoy" ? {} : { fecha }), ...filtros })}`

  const esperadas = reservas.reduce((suma, item) => suma + item.personas, 0)
  const adentro = reservas.reduce((suma, item) => suma + item.adentro, 0)
  const salieron = reservas.reduce((suma, item) => suma + item.salieron, 0)
  const faltan = Math.max(esperadas - adentro - salieron, 0)

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

  const aConfirmarDelDia = reservas.filter((item) => item.visible === "a-confirmar").length
  const adentroConSaldo = reservas.filter((item) => item.adentro > 0 && (item.saldo ?? 0) > 0).length
  const sinLugar = reservas.filter((item) => item.modulo === "FINDE_FAMILIA" && item.unidades.length === 0).length
  const sinTicket = reservas.filter((item) => item.visible === "confirmada" && !item.ticketEnviadoEn).length
  const noVinieron = reservas.filter((item) => item.visible === "no-vino").length
  const posibles: (Alerta | null)[] = [
    aConfirmarDelDia ? { texto: `${aConfirmarDelDia} ${aConfirmarDelDia === 1 ? "reserva" : "reservas"} de este día sin confirmar`, href: enPuerta({ estado: "a-confirmar" }), grave: true } : null,
    adentroConSaldo ? { texto: `${adentroConSaldo} ${adentroConSaldo === 1 ? "grupo adentro" : "grupos adentro"} con saldo sin cobrar`, href: enPuerta({ estado: "adentro" }), grave: true } : null,
    sinLugar ? { texto: `${sinLugar} ${sinLugar === 1 ? "reserva" : "reservas"} de finde sin lugar asignado`, href: enPuerta({ lugar: "sin-lugar" }) } : null,
    momento !== "pasado" && sinTicket ? { texto: `${sinTicket} ${sinTicket === 1 ? "confirmada" : "confirmadas"} sin el ticket enviado por WhatsApp`, href: enPuerta({ estado: "confirmada" }) } : null,
    aPresupuestar ? { texto: `${aPresupuestar} ${aPresupuestar === 1 ? "grupo" : "grupos"} a presupuestar` } : null,
    noVinieron ? { texto: `${noVinieron} ${noVinieron === 1 ? "reserva no vino" : "reservas no vinieron"}`, href: enPuerta({ estado: "no-vino" }) } : null,
    pendientesDeConfirmar ? { texto: `${pendientesDeConfirmar} ${pendientesDeConfirmar === 1 ? "reserva pendiente" : "reservas pendientes"} de confirmación, contando todos los días que vienen`, href: "/panel/reservas/confirmaciones" } : null,
  ]
  const alertas = posibles.filter((alerta) => alerta !== null)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDelDia fecha={fecha} hoy={hoy} ruta="/panel/puerta/general" kicker="Resultados del día" />
      <PestanasDePuerta activa="general" fecha={momento === "hoy" ? undefined : fecha} />

      <Alertas alertas={alertas} />

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Bloque titulo="Personas" icono={Users} color="personas" detalle={`${numero.format(reservas.length)} ${reservas.length === 1 ? "grupo" : "grupos"}`}>
          <Barra
            partes={[
              { valor: salieron, clase: "bg-[#546170]", nombre: "Se retiraron" },
              { valor: adentro, clase: "bg-[#2e7d32]", nombre: "Adentro" },
              { valor: faltan, clase: "bg-[#c9d7e4]", nombre: momento === "pasado" ? "No vinieron" : "Por llegar" },
            ]}
          />
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
            <Cifra termino="Esperadas" valor={numero.format(esperadas)} />
            <Cifra termino={momento === "pasado" ? "Vinieron" : "Ingresadas"} valor={numero.format(momento === "pasado" ? adentro + salieron : adentro)} punto="bg-[#2e7d32]" />
            <Cifra termino="Retiradas" valor={numero.format(salieron)} punto="bg-[#546170]" />
            <Cifra termino={momento === "pasado" ? "No vinieron" : "Por llegar"} valor={numero.format(faltan)} punto="bg-[#c9d7e4]" />
          </dl>
        </Bloque>

        <Bloque titulo="Plata" icono={Wallet} color="plata" detalle={momento === "hoy" ? "Lo cobrado hoy en Puerta" : "Lo cobrado ese día en Puerta"}>
          <Barra
            partes={[
              { valor: cobrado, clase: "bg-[#2e7d32]", nombre: "Cobrado" },
              { valor: porCobrar, clase: "bg-[#f5a13a]", nombre: "Pendiente" },
            ]}
          />
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Cifra
              termino="Cobrado"
              valor={pesos(cobrado)}
              punto="bg-[#2e7d32]"
              href={`/panel/puerta/caja?desde=${fecha}&hasta=${fecha}`}
              pie={`Efectivo ${pesos(caja.EFECTIVO)} · Débito ${pesos(caja.DEBITO)} · Transf. ${pesos(caja.TRANSFERENCIA)}`}
            />
            <Cifra termino="Pendiente de cobro" valor={pesos(porCobrar)} punto="bg-[#f5a13a]" pie={aPresupuestar ? `Más ${aPresupuestar} a presupuestar` : "Saldo de las reservas del día"} />
          </dl>
        </Bloque>

        <Bloque titulo="Lugares y estados" icono={MapPin} color="lugares" className="xl:col-span-2">
          <div className="grid gap-5 md:grid-cols-3">
            <Lista titulo="Reservas por estado" vacio={!porEstado.length}>
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
            </Lista>
            <Lista titulo="Lugares ocupados" vacio={!porLugar.length}>
              {porLugar.map(([tipo, cantidad]) => (
                <Fila key={tipo} termino={nombreDeUnidad[tipo as keyof typeof nombreDeUnidad]} valor={String(cantidad)} />
              ))}
            </Lista>
            <Lista titulo="Por propuesta" vacio={!porPropuesta.length}>
              {porPropuesta.map(([modulo, fila]) => (
                <Fila key={modulo} termino={nombreDelModulo[modulo as keyof typeof nombreDelModulo]} valor={`${fila.grupos} · ${numero.format(fila.personas)} pers.`} />
              ))}
            </Lista>
          </div>
        </Bloque>
      </div>
    </main>
  )
}

function Alertas({ alertas }: { alertas: Alerta[] }) {
  if (!alertas.length) {
    return (
      <p className="mt-6 flex items-center gap-3 rounded-3xl border-2 border-[#8fcf88] bg-[#e6f5e4] px-5 py-4 font-semibold text-[#1b5e20]" role="status">
        <CircleCheck className="size-5 shrink-0" aria-hidden />
        Todo en orden: no hay nada pendiente para este día.
      </p>
    )
  }
  return (
    <section aria-label="Para revisar" className="mt-6 rounded-3xl border-2 border-[#f0b266] bg-[#fff6ea] px-5 py-4">
      <h2 className="flex items-center gap-2 font-bold text-[#7a4200]">
        <TriangleAlert className="size-5" aria-hidden />
        Para revisar
      </h2>
      <ul className="mt-2 grid gap-x-6 gap-y-1.5 md:grid-cols-2">
        {alertas.map((alerta) => (
          <li key={alerta.texto} className="flex items-start gap-2 text-sm">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", alerta.grave ? "bg-[#c62828]" : "bg-[#f5a13a]")} aria-hidden />
            {alerta.href ? (
              <Link href={alerta.href} className="font-semibold underline-offset-4 hover:underline">
                {alerta.texto}
              </Link>
            ) : (
              <span className="font-semibold">{alerta.texto}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Bloque({
  titulo,
  icono: Icono,
  color,
  detalle,
  className,
  children,
}: {
  titulo: string
  icono: LucideIcon
  color: keyof typeof colores
  detalle?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section aria-label={titulo} className={cn("rounded-3xl border-t-8 bg-white p-5", colores[color].borde, sombra, className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-3 font-display text-2xl tracking-tight">
          <span className={cn("grid size-10 place-items-center rounded-full", colores[color].icono)}>
            <Icono className="size-5" aria-hidden />
          </span>
          {titulo}
        </h2>
        {detalle ? <p className="text-sm text-panel-muted">{detalle}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/// Una barra repartida en partes, con sus nombres para lectores de pantalla.
function Barra({ partes }: { partes: { valor: number; clase: string; nombre: string }[] }) {
  const total = partes.reduce((suma, parte) => suma + parte.valor, 0)
  return (
    <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-panel" role="img" aria-label={partes.map((parte) => `${parte.nombre}: ${parte.valor}`).join(", ")}>
      {total ? partes.filter((parte) => parte.valor).map((parte) => <span key={parte.nombre} className={cn("h-full", parte.clase)} style={{ width: `${(parte.valor / total) * 100}%` }} />) : null}
    </div>
  )
}

function Cifra({ termino, valor, punto, pie, href }: { termino: string; valor: string; punto?: string; pie?: string; href?: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-panel px-4 py-3">
      <dt className="flex items-center gap-2 text-xs font-bold tracking-wide text-panel-muted uppercase">
        {punto ? <span className={cn("size-2.5 shrink-0 rounded-full", punto)} aria-hidden /> : null}
        {termino}
      </dt>
      <dd className="font-display mt-1 text-2xl leading-tight tracking-tight break-words tabular-nums sm:text-3xl">
        {href ? (
          <Link href={href} className="hover:underline">
            {valor}
          </Link>
        ) : (
          valor
        )}
      </dd>
      {pie ? <dd className="mt-0.5 text-xs text-panel-muted">{pie}</dd> : null}
    </div>
  )
}

function Lista({ titulo, vacio = false, children }: { titulo: string; vacio?: boolean; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold tracking-wide text-panel-muted uppercase">{titulo}</h3>
      {vacio ? <p className="mt-2 text-sm text-panel-muted">No hay reservas ese día.</p> : <dl className="mt-1 divide-y divide-panel-line text-sm">{children}</dl>}
    </div>
  )
}

function Fila({ termino, valor }: { termino: ReactNode; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt>{termino}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}
