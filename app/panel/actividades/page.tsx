import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { MarcarActividad } from "@/components/panel/actividades/marcar"
import { PestanasDeActividades } from "@/components/panel/actividades/pestanas"
import { actividadDelDia } from "@/lib/panel/actividad-del-dia"
import { actividadesConProfesor } from "@/lib/panel/actividades"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { rolesDe } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

export const metadata: Metadata = { title: "Actividades" }

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

export default async function PanelActividades({ searchParams }: PageProps<"/panel/actividades">) {
  const sesion = await exigirPanel("actividades")
  const esAdmin = rolesDe(sesion.user.role).includes("admin")
  const asignadas = esAdmin
    ? actividadesConProfesor
    : await db()
        .profesorDeActividad.findMany({ where: { userId: sesion.user.id }, select: { actividad: true } })
        .then((filas) => actividadesConProfesor.filter((actividad) => filas.some((fila) => fila.actividad === actividad.slug)))

  if (asignadas.length === 0) {
    return (
      <main className="px-4 py-6 md:px-8 md:py-8">
        <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Actividades</p>
        <h1 className="font-display mt-2 text-3xl tracking-tight">Todavía no tenés actividades a cargo</h1>
        <p className="mt-2 text-panel-muted">Pedile a administración que te asigne la tuya en General → Usuarios.</p>
      </main>
    )
  }

  const params = await searchParams
  const pedida = primero(params.actividad)
  const actividad = asignadas.find((item) => item.slug === pedida) ?? asignadas[0]
  const hoy = hoyEnElPredio()
  const fechaPedida = primero(params.fecha)
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const enlace = (dia: string) => `/panel/actividades?${new URLSearchParams({ actividad: actividad.slug, ...(dia !== hoy ? { fecha: dia } : {}) })}`
  const { reservas, hicieron, adentro, esperadas } = await actividadDelDia(actividad.slug, fecha)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Actividades · {actividad.nombre}</p>
          {fecha !== hoy ? (
            <Link href={enlace(hoy)} className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
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
        {asignadas.length > 1 || esAdmin ? <PestanasDeActividades actividades={asignadas} activa={actividad.slug} conEstadisticas={esAdmin} /> : null}
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="col-span-2 rounded-2xl bg-panel-ink px-4 py-3 text-white md:col-span-1">
          <dt className="text-xs font-bold tracking-wide text-white/75 uppercase">Hicieron {actividad.nombre.toLowerCase()}</dt>
          <dd className="font-display mt-1 text-3xl tracking-tight tabular-nums">
            {hicieron} <span className="text-lg text-white/70">de {esperadas}</span>
          </dd>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
          <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">En el predio ahora</dt>
          <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{adentro}</dd>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
          <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">Reservas del día</dt>
          <dd className="font-display mt-1 text-2xl tracking-tight tabular-nums md:text-3xl">{reservas.length}</dd>
        </div>
      </dl>

      {fecha !== hoy ? (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-panel-muted">Estás viendo otro día: las actividades se marcan solo el día de la visita.</p>
      ) : null}

      <div className="mt-6">
        <MarcarActividad actividad={actividad.slug} nombre={actividad.nombre} reservas={reservas} puedeMarcar={fecha === hoy} />
      </div>
    </main>
  )
}
