import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { BarrasHorizontales, ColumnasApiladas } from "@/components/panel/graficos"
import { reportes, resumenDelDia, type Periodo } from "@/lib/panel/tablero"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "General" }

// Escala de un solo tono (del oscuro al claro) porque las franjas de edad son ordenadas.
const franjas = [
  { nombre: "Adultos y acompañantes", color: "#7a3f0e" },
  { nombre: "Menores y alumnos", color: "#c8741f" },
  { nombre: "Menores de 5", color: "#e9a456" },
]
const COLOR_UNICO = "#a85e1c"

const mesCorto = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" })
const mesLargo = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })
const numero = new Intl.NumberFormat("es-AR")

function inicioDeMes(hoy: string, mesesAtras: number) {
  const [anio, mes] = hoy.split("-").map(Number)
  return new Date(Date.UTC(anio, mes - 1 - mesesAtras, 1)).toISOString().slice(0, 10)
}

function finDeMes(hoy: string) {
  const [anio, mes] = hoy.split("-").map(Number)
  return new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10)
}

function atajos(hoy: string) {
  return [
    { id: "mes", nombre: "Este mes", periodo: { desde: inicioDeMes(hoy, 0), hasta: finDeMes(hoy) } },
    { id: "3m", nombre: "Últimos 3 meses", periodo: { desde: inicioDeMes(hoy, 2), hasta: finDeMes(hoy) } },
    { id: "6m", nombre: "Últimos 6 meses", periodo: { desde: inicioDeMes(hoy, 5), hasta: finDeMes(hoy) } },
    { id: "anio", nombre: "Este año", periodo: { desde: `${hoy.slice(0, 4)}-01-01`, hasta: `${hoy.slice(0, 4)}-12-31` } },
  ]
}

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export default async function PanelGeneral({ searchParams }: PageProps<"/panel/general">) {
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const opciones = atajos(hoy)
  const elegido = opciones.find((item) => item.id === primero(params.periodo))
  const desde = primero(params.desde)
  const hasta = primero(params.hasta)
  const personalizado =
    !elegido && desde && hasta && esFechaIso(desde) && esFechaIso(hasta) && desde <= hasta && hasta <= sumarDiasIso(desde, 800)
      ? { desde, hasta }
      : null
  const periodo: Periodo = elegido?.periodo ?? personalizado ?? opciones[2].periodo
  const activo = elegido?.id ?? (personalizado ? "otro" : "6m")

  const [dia, datos] = await Promise.all([resumenDelDia(hoy), reportes(periodo)])
  const cobradoHoy = dia.caja.EFECTIVO + dia.caja.DEBITO + dia.caja.TRANSFERENCIA

  return (
    <div className="space-y-8">
      <section aria-labelledby="hoy">
        <h2 id="hoy" className="font-display text-2xl tracking-tight">
          Hoy
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile etiqueta="Grupos que vienen" valor={numero.format(dia.grupos)} />
          <Tile etiqueta="Personas adentro" valor={`${numero.format(dia.adentro)} de ${numero.format(dia.esperadas)}`} />
          <Tile
            etiqueta="Cobrado hoy"
            valor={pesos(cobradoHoy)}
            pie={`Efectivo ${pesos(dia.caja.EFECTIVO)} · Débito ${pesos(dia.caja.DEBITO)} · Transf. ${pesos(dia.caja.TRANSFERENCIA)}`}
          />
          <Tile
            etiqueta="Reservas a confirmar"
            valor={numero.format(dia.pendientes)}
            pie={
              <Link href="/panel/reservas?estado=PENDIENTE" className="font-semibold text-panel-tostado underline-offset-4 hover:underline">
                Ver cuáles son
              </Link>
            }
          />
        </dl>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {dia.ocupacion.map((item) => {
            const porcentaje = item.total ? Math.round((item.ocupadas / item.total) * 100) : 0
            return (
              <div key={item.nombre} className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{item.nombre}</span>
                  <span className="text-panel-muted">
                    {item.ocupadas} de {item.total} · <strong className="text-panel-ink">{porcentaje} %</strong>
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-panel-claro"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={item.total}
                  aria-valuenow={item.ocupadas}
                  aria-label={`Ocupación de ${item.nombre.toLowerCase()}`}
                >
                  <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, background: COLOR_UNICO }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="reportes">
        <h2 id="reportes" className="font-display text-2xl tracking-tight">
          Reportes
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          {opciones.map((opcion) => (
            <Link
              key={opcion.id}
              href={`/panel/general?periodo=${opcion.id}`}
              aria-current={activo === opcion.id ? "true" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold",
                activo === opcion.id ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
              )}
            >
              {opcion.nombre}
            </Link>
          ))}
          <form className="flex flex-wrap items-end gap-2" action="/panel/general">
            <label className="text-xs font-semibold text-panel-muted">
              Desde
              <input type="date" name="desde" defaultValue={periodo.desde} className="mt-1 block h-10 rounded-lg border border-panel-line bg-white px-2 text-sm text-panel-ink" />
            </label>
            <label className="text-xs font-semibold text-panel-muted">
              Hasta
              <input type="date" name="hasta" defaultValue={periodo.hasta} className="mt-1 block h-10 rounded-lg border border-panel-line bg-white px-2 text-sm text-panel-ink" />
            </label>
            <button type="submit" className={cn("h-10 rounded-full border px-4 text-sm font-semibold", activo === "otro" ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white")}>
              Aplicar
            </button>
          </form>
        </div>
        <p className="mt-2 text-sm text-panel-muted">
          Reservas con llegada entre el {periodo.desde.split("-").reverse().join("/")} y el {periodo.hasta.split("-").reverse().join("/")}, sin las canceladas. Las
          variaciones comparan con el período anterior de la misma duración.
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile etiqueta="Reservas" valor={numero.format(datos.indicadores.reservas.valor)} delta={datos.indicadores.reservas.variacion} />
          <Tile etiqueta="Personas" valor={numero.format(datos.indicadores.personas.valor)} delta={datos.indicadores.personas.variacion} />
          <Tile etiqueta="Cobrado" valor={pesos(datos.indicadores.cobrado.valor)} delta={datos.indicadores.cobrado.variacion} />
          <Tile
            etiqueta="Clientes nuevos"
            valor={`${datos.indicadores.nuevos.valor} %`}
            pie={`${datos.indicadores.nuevos.cantidad} de ${datos.indicadores.nuevos.clientes} reservan por primera vez`}
          />
        </dl>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Tarjeta titulo="Personas por mes" subtitulo="Según la edad. En los grupos, los alumnos cuentan como menores. Pasá el mouse por cada mes.">
            <ColumnasApiladas
              titulo="Personas por mes según la edad"
              series={franjas}
              columnas={datos.porMes.map((fila) => ({
                etiqueta: capitalizar(mesCorto.format(new Date(`${fila.mes}-01T00:00:00Z`)).replace(".", "")),
                detalle: capitalizar(mesLargo.format(new Date(`${fila.mes}-01T00:00:00Z`))),
                valores: [fila.adultos, fila.menores, fila.sinCargo],
              }))}
            />
          </Tarjeta>
          <Tarjeta titulo="Reservas por propuesta" subtitulo="Cantidad de reservas y personas de cada línea.">
            <BarrasHorizontales
              titulo="Reservas por propuesta"
              color={COLOR_UNICO}
              filas={datos.porLinea.map((linea) => ({
                etiqueta: linea.nombre,
                valor: linea.reservas,
                detalle: `${numero.format(linea.personas)} personas`,
              }))}
            />
          </Tarjeta>
          <Tarjeta titulo="Edad de quien reserva" subtitulo="Responsables de las reservas familiares, por rango de edad.">
            <ColumnasApiladas
              titulo="Edad de quien reserva"
              series={[{ nombre: "Responsables", color: COLOR_UNICO }]}
              columnas={datos.edades.map((rango) => ({ etiqueta: rango.etiqueta, valores: [rango.cantidad] }))}
            />
          </Tarjeta>
        </div>
      </section>
    </div>
  )
}

function Tile({ etiqueta, valor, delta, pie }: { etiqueta: string; valor: string; delta?: number | null; pie?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
      <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{etiqueta}</dt>
      <dd className="mt-1 text-2xl font-semibold md:text-3xl">{valor}</dd>
      {delta !== undefined ? (
        <dd className="mt-1 flex items-center gap-1 text-xs font-semibold">
          {delta === null ? (
            <span className="text-panel-muted">Sin datos del período anterior</span>
          ) : (
            <>
              {delta > 0 ? (
                <ArrowUpRight className="size-3.5 text-[#2f7d32]" aria-hidden />
              ) : delta < 0 ? (
                <ArrowDownRight className="size-3.5 text-[#b3261e]" aria-hidden />
              ) : (
                <Minus className="size-3.5 text-panel-muted" aria-hidden />
              )}
              <span className="text-panel-ink">
                {delta > 0 ? "+" : ""}
                {delta} %
              </span>
              <span className="font-normal text-panel-muted">vs. período anterior</span>
            </>
          )}
        </dd>
      ) : null}
      {pie ? <dd className="mt-1 text-xs text-panel-muted">{pie}</dd> : null}
    </div>
  )
}

function Tarjeta({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
      <h3 className="font-display text-xl tracking-tight">{titulo}</h3>
      <p className="mt-0.5 mb-4 text-sm text-panel-muted">{subtitulo}</p>
      {children}
    </section>
  )
}
