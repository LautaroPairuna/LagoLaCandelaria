"use client"

import Link from "next/link"
import { Search, UtensilsCrossed } from "lucide-react"
import { useMemo, useState } from "react"

import { pesos } from "@/lib/predio/tarifas"

export type RestaurantMenuItem = {
  id: number
  categoria: string
  nombre: string
  descripcion: string | null
  precio: number
}

const ALL = "Toda la carta"

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
}

export function RestaurantCatalog({ items }: { items: RestaurantMenuItem[] }) {
  const [category, setCategory] = useState(ALL)
  const [query, setQuery] = useState("")
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categoria))).filter(Boolean),
    [items],
  )
  const visibleItems = useMemo(() => {
    const term = searchable(query.trim())
    return items.filter((item) => {
      const matchesCategory = category === ALL || item.categoria === category
      const text = searchable(`${item.nombre} ${item.descripcion ?? ""} ${item.categoria}`)
      return matchesCategory && (!term || text.includes(term))
    })
  }, [category, items, query])

  return (
    <section
      id="carta"
      className="bg-[#512f32] px-5 py-14 text-cream md:px-8 md:py-20"
      aria-labelledby="carta-titulo"
    >
      <div className="mx-auto max-w-[1180px]">
        <p className="text-xs font-bold tracking-[0.18em] text-[#e5c69a] uppercase">
          Para comer
        </p>
        <h2 id="carta-titulo" className="font-display mt-2 text-4xl tracking-tight md:text-6xl">
          Carta del restaurante
        </h2>
        <p className="mt-3 max-w-2xl text-cream/80">
          Explorá la carta por categoría o buscá un producto. El menú del bar se consulta presencialmente.
        </p>

        <div className="mt-8 rounded-[1.7rem] bg-cream p-4 text-ink shadow-[0_24px_65px_rgba(22,8,10,0.3)] sm:p-7">
          <div className="grid gap-4 border-b border-ink/10 pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold tracking-[0.13em] text-[#7b343b] uppercase">
                Buscar en la carta
              </span>
              <span className="flex min-h-12 items-center gap-3 rounded-full bg-white px-4 ring-1 ring-ink/15 focus-within:ring-2 focus-within:ring-[#7b343b]">
                <Search className="size-5 shrink-0 text-[#7b343b]" aria-hidden />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej.: hamburguesa, bebida…"
                  className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-ink/40"
                  type="search"
                />
              </span>
            </label>
            <Link
              href="/menu/restaurante"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#7b343b] px-5 text-center text-sm font-bold text-white transition-colors hover:bg-[#64282e]"
            >
              Abrir carta completa
            </Link>
          </div>

          <nav className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Categorías de la carta">
            {[ALL, ...categories].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                  category === item
                    ? "bg-[#7b343b] text-white"
                    : "bg-[#eadcc7] text-ink hover:bg-[#dfccb0]"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-text-muted" aria-live="polite">
              {visibleItems.length} {visibleItems.length === 1 ? "producto" : "productos"}
            </p>
            {category !== ALL || query ? (
              <button
                type="button"
                onClick={() => {
                  setCategory(ALL)
                  setQuery("")
                }}
                className="text-sm font-bold text-[#7b343b] underline-offset-4 hover:underline"
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>

          {visibleItems.length > 0 ? (
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {visibleItems.map((item) => (
                <li key={item.id} className="rounded-[1.15rem] bg-white p-4 ring-1 ring-ink/10">
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eadcc7] text-[#7b343b]">
                      <UtensilsCrossed className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.67rem] font-bold tracking-[0.13em] text-[#8a603c] uppercase">
                        {item.categoria}
                      </p>
                      <div className="mt-1 flex items-baseline justify-between gap-3">
                        <h3 className="font-semibold leading-tight">{item.nombre}</h3>
                        <span className="shrink-0 font-bold text-[#7b343b] tabular-nums">
                          {pesos(item.precio)}
                        </span>
                      </div>
                      {item.descripcion ? (
                        <p className="mt-1.5 text-sm leading-snug text-text-muted">{item.descripcion}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-[1.15rem] bg-white px-5 py-8 text-center ring-1 ring-ink/10">
              <p className="font-semibold">
                {items.length === 0
                  ? "Estamos actualizando la carta del restaurante."
                  : "No encontramos productos con esos filtros."}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {items.length === 0
                  ? "Podés consultarla nuevamente más tarde."
                  : "Probá otra categoría o una búsqueda más corta."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
