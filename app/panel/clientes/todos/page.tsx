import { Download, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EnviarWhatsapp } from "@/components/panel/enviar-whatsapp"
import { EncabezadoDeClientes } from "@/components/panel/pestanas-clientes"
import { exigirPanel } from "@/lib/panel/sesion"
import { clientesConHistorial, ordenesDeClientes, plantillasWhatsapp, type OrdenDeClientes } from "@/lib/panel/whatsapp"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Clientes" }

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
const numero = new Intl.NumberFormat("es-AR")

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

/// La base de clientes: cada responsable de una reserva, cuántas veces vino, cuándo fue la
/// última y lo que pagó. Sirve para ver quién vuelve y para escribirles.
export default async function Clientes({ searchParams }: PageProps<"/panel/clientes/todos">) {
  await exigirPanel("clientes")
  const params = await searchParams
  const texto = (primero(params.q) ?? "").slice(0, 60)
  const pedido = primero(params.orden)
  const orden: OrdenDeClientes = ordenesDeClientes.some((item) => item.id === pedido) ? (pedido as OrdenDeClientes) : "recientes"
  const pagina = Math.max(1, Math.min(Number(primero(params.pagina)) || 1, 1000))
  const [{ total, paginas, clientes }, plantillas] = await Promise.all([clientesConHistorial({ texto, orden, pagina }), plantillasWhatsapp()])
  const enlace = (cambios: Record<string, string | number>) => {
    const nuevos = new URLSearchParams({ ...(texto ? { q: texto } : {}), ...(orden !== "recientes" ? { orden } : {}), ...Object.fromEntries(Object.entries(cambios).map(([clave, valor]) => [clave, String(valor)])) })
    if (nuevos.get("pagina") === "1") nuevos.delete("pagina")
    if (nuevos.get("orden") === "recientes") nuevos.delete("orden")
    return `/panel/clientes/todos${nuevos.size ? `?${nuevos}` : ""}`
  }

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDeClientes activa="clientes" titulo="Clientes" bajada={`${numero.format(total)} ${total === 1 ? "cliente" : "clientes"}${texto ? ` con «${texto}»` : ""}: quien hizo cada reserva, con su historial.`}>
        <a href={`/panel/clientes/todos/csv${texto ? `?q=${encodeURIComponent(texto)}` : ""}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted">
          <Download className="size-4" aria-hidden />
          Exportar a Excel
        </a>
      </EncabezadoDeClientes>

      <form className="mt-5 flex flex-wrap gap-2" role="search">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={texto}
            placeholder="Buscar por nombre, DNI, teléfono o correo"
            aria-label="Buscar cliente"
            className="h-12 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-11"
          />
        </div>
        {orden !== "recientes" ? <input type="hidden" name="orden" value={orden} /> : null}
        <button type="submit" className="h-12 rounded-full bg-panel-ink px-5 text-sm font-bold text-white hover:bg-panel-tostado">
          Buscar
        </button>
      </form>
      <nav aria-label="Ordenar" className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-panel-muted">Ordenar por</span>
        {ordenesDeClientes.map((item) => (
          <Link
            key={item.id}
            href={enlace({ orden: item.id, pagina: 1 })}
            aria-current={item.id === orden ? "true" : undefined}
            className={cn("rounded-full border px-3 py-1.5 font-semibold", item.id === orden ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted")}
          >
            {item.nombre}
          </Link>
        ))}
      </nav>

      {clientes.length === 0 ? (
        <p className={cn("mt-5 rounded-3xl bg-white p-6 text-panel-muted", sombra)}>{texto ? "No encontramos clientes con esa búsqueda." : "Todavía no hay clientes."}</p>
      ) : (
        <div className={cn("mt-5 overflow-x-auto rounded-3xl bg-white", sombra)}>
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-panel-line text-xs font-bold tracking-wide text-panel-muted uppercase">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-3 py-3">Contacto</th>
                <th className="px-3 py-3 text-right">Reservas</th>
                <th className="px-3 py-3">Última</th>
                <th className="px-3 py-3 text-right">Pagó</th>
                <th className="px-4 py-3">
                  <span className="sr-only">WhatsApp</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-line">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-panel/50">
                  <td className="px-4 py-3">
                    <Link href={`/panel/clientes/todos/${cliente.id}`} className="font-semibold hover:underline">
                      {cliente.nombre}
                    </Link>
                    {cliente.dni ? <span className="block text-xs text-panel-muted">DNI {cliente.dni}</span> : null}
                  </td>
                  <td className="px-3 py-3">
                    <span className="block tabular-nums">{cliente.telefono ?? "—"}</span>
                    {cliente.email ? <span className="block max-w-56 truncate text-xs text-panel-muted">{cliente.email}</span> : null}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {cliente.reservas}
                    {cliente.reservas > 1 ? <span className="ml-1.5 rounded-full bg-[#e6f5e4] px-2 py-0.5 text-xs text-[#1b5e20]">vuelve</span> : null}
                    {cliente.canceladas ? <span className="block text-xs font-normal text-panel-muted">{cliente.canceladas} canceladas</span> : null}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{cliente.ultima ? cliente.ultima.split("-").reverse().join("/") : "—"}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{pesos(cliente.pagado)}</td>
                  <td className="px-4 py-3 text-right">
                    <EnviarWhatsapp
                      tipo="libre"
                      plantillas={plantillas}
                      destinatario={{ clienteId: cliente.id, titular: cliente.nombre, whatsapp: cliente.whatsapp, datos: { nombre: cliente.nombreDePila } }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-center gap-3 text-sm font-semibold">
          {pagina > 1 ? (
            <Link href={enlace({ pagina: pagina - 1 })} className="rounded-full border border-panel-line bg-white px-4 py-2 hover:border-panel-muted">
              Anterior
            </Link>
          ) : null}
          <span className="text-panel-muted">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link href={enlace({ pagina: pagina + 1 })} className="rounded-full border border-panel-line bg-white px-4 py-2 hover:border-panel-muted">
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  )
}
