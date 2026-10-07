import { Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { InsigniaDeEstado, LeyendaDeEstados } from "@/components/panel/insignia-de-estado"
import { buscarReservas, contarPasadas, POR_PAGINA, type FiltroDeEstado, type FilaDeBusqueda } from "@/lib/panel/busqueda"
import { estilosDeEstado } from "@/lib/panel/estados"
import { fechaLargaPanel, rangoConMesPanel } from "@/lib/panel/formato"
import { esLinea, lineas, nombreDelModulo } from "@/lib/panel/reservas"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso, hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Reservas" }

const estados: { id: FiltroDeEstado; nombre: string }[] = [
  { id: "activas", nombre: "Todas" },
  { id: "PENDIENTE", nombre: "A confirmar" },
  { id: "CONFIRMADA", nombre: "Confirmadas" },
  { id: "CANCELADA", nombre: "Canceladas" },
]

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

const campo = "h-11 rounded-xl border border-panel-line bg-white px-3 text-sm"

export default async function PanelReservas({ searchParams }: PageProps<"/panel/reservas">) {
  await exigirPanel("reservas")
  const params = await searchParams
  const hoy = hoyEnElPredio()
  const texto = (primero(params.q) ?? "").slice(0, 80)
  const fechaPedida = primero(params.fecha)
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : undefined
  const estadoPedido = primero(params.estado)
  const estado = estados.find((item) => item.id === estadoPedido)?.id ?? "activas"
  const lineaPedida = primero(params.linea)
  const linea = esLinea(lineaPedida) ? lineaPedida : undefined
  const pasadas = primero(params.pasadas) === "1"
  const cantidad = Math.min(Math.max(Number(primero(params.ver)) || POR_PAGINA, POR_PAGINA), 500)

  const { total, filas } = await buscarReservas({ texto, fecha, estado, linea, pasadas, hoy }, cantidad)
  const filtrando = Boolean(texto || fecha || estado !== "activas" || linea || pasadas)
  const pasadasQueCoinciden = total === 0 && texto && !pasadas && !fecha ? await contarPasadas({ texto, estado, linea, pasadas, hoy }) : 0
  const conPasadas = new URLSearchParams({ q: texto, pasadas: "1" })

  const resumen = fecha
    ? `${total} ${total === 1 ? "reserva" : "reservas"} el ${fechaLargaPanel(fecha).toLowerCase()}`
    : `${total} ${total === 1 ? "reserva" : "reservas"} ${pasadas ? "en total" : "de hoy en adelante"}`

  const masParams = new URLSearchParams()
  for (const [clave, valor] of Object.entries({ q: texto, fecha, estado: estado === "activas" ? undefined : estado, linea, pasadas: pasadas ? "1" : undefined })) {
    if (valor) masParams.set(clave, valor)
  }
  masParams.set("ver", String(cantidad + POR_PAGINA))

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <header>
        <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Panel de Reservas</p>
        <h1 className="font-display mt-1 text-3xl tracking-tight md:mt-2 md:text-4xl">Buscar reservas</h1>
      </header>

      <form action="/panel/reservas" role="search" className="mt-5 rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={texto}
            placeholder="Nombre, DNI, teléfono o N.º de reserva"
            aria-label="Buscar por nombre, documento o número"
            className="h-12 w-full rounded-2xl border border-panel-line bg-panel/40 pr-4 pl-11"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-end md:gap-3">
          <label className="text-xs font-semibold text-panel-muted">
            Fecha
            <input type="date" name="fecha" defaultValue={fecha} className={cn(campo, "mt-1 block w-full text-panel-ink md:w-auto")} />
          </label>
          <label className="text-xs font-semibold text-panel-muted">
            Estado
            <select name="estado" defaultValue={estado} className={cn(campo, "mt-1 block w-full text-panel-ink md:w-auto")}>
              {estados.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-panel-muted">
            Propuesta
            <select name="linea" defaultValue={linea ?? ""} className={cn(campo, "mt-1 block w-full text-panel-ink md:w-auto")}>
              <option value="">Todas</option>
              {lineas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-11 items-center gap-2 self-end text-sm font-semibold">
            <input type="checkbox" name="pasadas" value="1" defaultChecked={pasadas} className="size-4 accent-[#a85e1c]" />
            Incluir pasadas
          </label>
          <div className="col-span-2 flex items-center gap-3 md:ml-auto">
            <button type="submit" className="h-11 flex-1 rounded-full bg-panel-ink px-6 text-sm font-semibold text-white hover:bg-panel-tostado md:flex-none">
              Buscar
            </button>
            {filtrando ? (
              <Link href="/panel/reservas" className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
                Limpiar
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      <div className="mt-4">
        <LeyendaDeEstados />
      </div>

      <section aria-label="Resultados" className="mt-6">
        <p className="text-sm text-panel-muted" role="status">
          {resumen}
          {texto ? ` para «${texto}»` : ""}
          {total > filas.length ? ` · mostrando ${filas.length}` : ""}
        </p>

        {filas.length === 0 ? (
          <div className="mt-3 rounded-3xl bg-white p-6 text-sm text-panel-muted shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
            {pasadasQueCoinciden ? (
              <>
                No hay reservas próximas con esos datos, pero {pasadasQueCoinciden === 1 ? "hay 1 pasada" : `hay ${pasadasQueCoinciden} pasadas`}.{" "}
                <Link href={`/panel/reservas?${conPasadas}`} className="font-semibold text-panel-tostado underline underline-offset-4">
                  {pasadasQueCoinciden === 1 ? "Verla" : "Verlas"}
                </Link>
              </>
            ) : filtrando
              ? pasadas || fecha
                ? "No encontramos reservas con esos datos. Probá con menos palabras o solo el apellido."
                : "No encontramos reservas próximas con esos datos. Si es una reserva vieja, marcá «Incluir pasadas»."
              : "Todavía no hay reservas de hoy en adelante."}
          </div>
        ) : (
          <>
            <div className="mt-3 hidden overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(58,42,24,0.06)] lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-panel-line text-xs font-bold tracking-wide text-panel-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-bold">N.º</th>
                    <th className="px-3 py-3 font-bold">Fecha</th>
                    <th className="px-3 py-3 font-bold">Quién reserva</th>
                    <th className="px-3 py-3 font-bold">Propuesta</th>
                    <th className="px-3 py-3 font-bold">Lugar</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                    <th className="px-5 py-3 text-right font-bold">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panel-line">
                  {filas.map((fila) => (
                    <tr key={fila.id} className={cn("relative border-l-8 hover:brightness-95", estilosDeEstado[fila.visible].tarjeta, estilosDeEstado[fila.visible].borde)}>
                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {fila.id}
                        <span className="block text-xs font-normal whitespace-nowrap text-panel-muted">{fila.codigo}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{rangoConMesPanel(fila.desde, fila.hasta)}</td>
                      <td className="px-3 py-3">
                        <Link href={`/panel/reservas/${fila.id}`} className="font-semibold after:absolute after:inset-0 hover:underline">
                          {fila.titular}
                        </Link>
                        <span className="block text-xs text-panel-muted">{[fila.contacto, fila.telefono].filter(Boolean).join(" · ")}</span>
                      </td>
                      <td className="px-3 py-3">
                        {nombreDelModulo[fila.modulo]}
                        <span className="block text-xs text-panel-muted">{fila.personas} pers.</span>
                      </td>
                      <td className="max-w-48 px-3 py-3 text-panel-muted">{fila.lugares.join(", ") || "—"}</td>
                      <td className="px-3 py-3">
                        <InsigniaDeEstado estado={fila.visible} />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                        <Saldo fila={fila} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-3 space-y-3 lg:hidden">
              {filas.map((fila) => (
                <li key={fila.id}>
                  <Link href={`/panel/reservas/${fila.id}`} className={cn("block rounded-2xl border-2 border-l-8 p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] active:brightness-95", estilosDeEstado[fila.visible].tarjeta, estilosDeEstado[fila.visible].borde)}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{fila.titular}</span>
                        <span className="block text-sm text-panel-muted">
                          {nombreDelModulo[fila.modulo]} · {fila.personas} pers.
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-xs font-semibold text-panel-muted">
                        N.º {fila.id}
                        <span className="block font-normal">{fila.codigo}</span>
                      </span>
                    </span>
                    <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                      <span className="font-semibold">{rangoConMesPanel(fila.desde, fila.hasta)}</span>
                      <InsigniaDeEstado estado={fila.visible} />
                      <span className="ml-auto font-semibold tabular-nums">
                        <Saldo fila={fila} />
                      </span>
                    </span>
                    {fila.lugares.length ? <span className="mt-1 block truncate text-xs text-panel-muted">{fila.lugares.join(", ")}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>

            {total > filas.length ? (
              <div className="mt-4 text-center">
                <Link
                  href={`/panel/reservas?${masParams}`}
                  scroll={false}
                  className="inline-block rounded-full border border-panel-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-panel-muted"
                >
                  Ver {Math.min(POR_PAGINA, total - filas.length)} más
                </Link>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  )
}

function Saldo({ fila }: { fila: FilaDeBusqueda }) {
  if (fila.estado === "CANCELADA") return <span className="text-panel-muted">—</span>
  if (fila.aConfirmar) return <span className="text-panel-muted">A presupuestar</span>
  if (fila.saldo === 0) return <span className="text-[#3f6b12]">Pagado</span>
  return <>{pesos(fila.saldo)}</>
}
