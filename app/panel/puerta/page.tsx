import { ClipboardList, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesMasivas } from "@/components/panel/acciones-masivas"
import { EncabezadoDelDia } from "@/components/panel/encabezado-del-dia"
import { FiltrosDePuerta } from "@/components/panel/filtros-puerta"
import { LeyendaDeEstados } from "@/components/panel/insignia-de-estado"
import { NuevaReserva } from "@/components/panel/nueva-reserva"
import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { TablaDeReservas } from "@/components/panel/tabla-de-reservas"
import { feriadosDelAnio } from "@/lib/disponibilidad"
import { buscarReservas } from "@/lib/panel/busqueda"
import { filtrarYOrdenar, filtrosDeTipo, leerFiltros, modulosDe } from "@/lib/panel/filtros-puerta"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { llegadasDelDia, llegadasPorIds, type Llegada } from "@/lib/panel/puerta"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { leerPrecios } from "@/lib/precios"
import { esFechaIso, hoyEnElPredio } from "@/lib/predio/fechas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Puerta" }


const botonSecundario = "inline-flex h-11 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"

export default async function PanelPuerta({ searchParams }: PageProps<"/panel/puerta">) {
  const sesion = await exigirPanel("puerta")
  const params = await searchParams
  const busqueda = (Array.isArray(params.q) ? params.q[0] : params.q)?.slice(0, 60) ?? ""
  const hoy = hoyEnElPredio()
  const fechaPedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const filtros = leerFiltros(params)
  // La búsqueda es en el día elegido; con "Buscar en todas las fechas", en todas.
  const enTodas = Boolean(busqueda) && params.todas === "1"
  const [delDia, resultados] = await Promise.all([
    enTodas ? Promise.resolve([]) : llegadasDelDia(fecha, busqueda),
    enTodas ? buscarReservas({ texto: busqueda, estado: "activas", pasadas: true, hoy }, 100) : null,
  ])
  const encontradas = resultados ? await llegadasPorIds(resultados.filas.map((fila) => fila.id)) : []
  const llegadas = filtrarYOrdenar(delDia, filtros)
  const sinTipo = filtrarYOrdenar(delDia, { ...filtros, tipo: "todas" })
  const enlace = (cambios: Record<string, string | null>) => {
    const nuevos = new URLSearchParams()
    for (const [clave, valor] of Object.entries(params)) if (typeof valor === "string") nuevos.set(clave, valor)
    for (const [clave, valor] of Object.entries(cambios)) if (valor === null) nuevos.delete(clave)
    else nuevos.set(clave, valor)
    return `/panel/puerta${nuevos.size ? `?${nuevos}` : ""}`
  }
  const diaCorto = fechaLargaPanel(fecha).replace(/ de [a-z]+$/i, "").toLowerCase()
  const puedeConfirmar = puedeVer(sesion.user.role, "reservas")
  const [feriados, precios] = await Promise.all([feriadosDelAnio(hoy), leerPrecios()])

  const aConfirmar = llegadas.filter((item) => item.visible === "a-confirmar").map((item) => item.id)

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDelDia fecha={fecha} hoy={hoy} ruta="/panel/puerta" kicker="Ingreso y cobranza" />
      <PestanasDePuerta activa="reservas" fecha={momento === "hoy" ? undefined : fecha} />


      <div className="mt-6 space-y-4">
        <form className="relative" role="search">
          {momento !== "hoy" ? <input type="hidden" name="fecha" value={fecha} /> : null}
          {enTodas ? <input type="hidden" name="todas" value="1" /> : null}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder={`Buscar en las reservas del ${diaCorto}: N.º, código, apellido, institución, DNI o teléfono`}
            aria-label="Buscar reserva"
            className="h-12 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-11"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <NuevaReserva hoy={hoy} puedeCobrar puedeMarcarIngreso={puedeVer(sesion.user.role, "puerta") || puedeConfirmar} feriados={feriados} precios={precios} />
          <Link href={`/panel/reservas/planilla?fecha=${fecha}`} className={botonSecundario}>
            <ClipboardList className="size-4 text-panel-tostado" aria-hidden />
            Planilla del día
          </Link>
          {momento !== "pasado" && !enTodas ? <AccionesMasivas aConfirmar={aConfirmar} envios={[]} puedeConfirmar={puedeConfirmar} /> : null}
        </div>
        {enTodas ? null : (
          <nav aria-label="Filtrar por propuesta" className="flex flex-wrap gap-2">
            {filtrosDeTipo.map((tipo) => {
              const cantidad = tipo.id === "todas" ? sinTipo.length : sinTipo.filter((item) => modulosDe[tipo.id as Exclude<typeof tipo.id, "todas">].includes(item.modulo)).length
              const activo = filtros.tipo === tipo.id
              if (!cantidad && !activo && tipo.id !== "todas") return null
              return (
                <Link
                  key={tipo.id}
                  href={enlace({ tipo: tipo.id === "todas" ? null : tipo.id })}
                  scroll={false}
                  aria-current={activo ? "true" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
                    activo ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
                  )}
                >
                  {tipo.nombre}
                  <span className={cn("text-xs font-bold", activo ? "text-white/75" : "text-panel-muted")}>{cantidad}</span>
                </Link>
              )
            })}
          </nav>
        )}
        {enTodas ? null : <FiltrosDePuerta filtros={filtros} />}
        <LeyendaDeEstados />
      </div>

      {resultados ? <ResultadosDeBusqueda volver={enlace({ todas: null })} total={resultados.total} llegadas={encontradas} busqueda={busqueda} puedeConfirmar={puedeConfirmar} hoy={hoy} /> : null}

      {resultados ? null : (
        <section aria-labelledby="reservas-del-dia" className="mt-6">
          <h2 id="reservas-del-dia" className="font-display flex flex-wrap items-center gap-3 text-2xl tracking-tight">
            Reservas {diaCorto}
            <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{llegadas.length}</span>
            {busqueda ? (
              <>
                <span className="font-sans text-base font-normal text-panel-muted">con «{busqueda}»</span>
                <Link href={enlace({ todas: "1", tipo: null })} className="rounded-full border border-panel-line bg-white px-4 py-1.5 font-sans text-sm font-semibold hover:border-panel-muted">
                  Buscar en todas las fechas
                </Link>
                <Link href={enlace({ q: null })} className="font-sans text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
                  Ver todas las del día
                </Link>
              </>
            ) : null}
          </h2>
          {llegadas.length === 0 ? (
            <p className="mt-2 text-sm text-panel-muted">
              {busqueda ? `No hay reservas con «${busqueda}» ese día: probá buscar en todas las fechas.` : llegadas.length !== delDia.length ? "Ninguna reserva coincide con los filtros." : "No hay reservas para ese día."}
            </p>
          ) : (
            <TablaDeReservas llegadas={llegadas} hoy={hoy} puedeConfirmar={puedeConfirmar} />
          )}
        </section>
      )}
    </main>
  )
}

function ResultadosDeBusqueda({ volver, total, llegadas, busqueda, puedeConfirmar, hoy }: { volver: string; total: number; llegadas: Llegada[]; busqueda: string; puedeConfirmar: boolean; hoy: string }) {
  return (
    <section aria-labelledby="resultados" className="mt-6">
      <h2 id="resultados" className="font-display flex flex-wrap items-center gap-3 text-2xl tracking-tight">
        Resultados en todas las fechas
        <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{total > llegadas.length ? `${llegadas.length} de ${total}` : total}</span>
        <Link href={volver} className="font-sans text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
          Buscar solo en el día
        </Link>
      </h2>
      {llegadas.length === 0 ? (
        <p className="mt-2 text-sm text-panel-muted">No encontramos reservas con «{busqueda}». Probá con menos palabras o solo el apellido.</p>
      ) : (
        <TablaDeReservas llegadas={llegadas} hoy={hoy} puedeConfirmar={puedeConfirmar} conFecha />
      )}
    </section>
  )
}
