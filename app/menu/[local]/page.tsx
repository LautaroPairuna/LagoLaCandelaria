import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { LogoMark } from "@/components/logo-mark"
import { menuDelLocal } from "@/lib/panel/cuentas"
import { localDelSlug, porCategoria } from "@/lib/panel/local"
import { pesos } from "@/lib/predio/tarifas"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps<"/menu/[local]">): Promise<Metadata> {
  const local = localDelSlug((await params).local)
  if (!local) return {}
  return {
    title: `Menú del ${local.nombre.toLowerCase()}`,
    description: `La carta del ${local.nombre.toLowerCase()} de Lago La Candelaria, con precios del día.`,
    alternates: { canonical: `/menu/${local.slug}` },
  }
}

function ancla(categoria: string) {
  return categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/// El menú digital al que lleva el QR de las mesas. Muestra solo lo que hay.
export default async function MenuDigital({ params }: PageProps<"/menu/[local]">) {
  const local = localDelSlug((await params).local)
  if (!local) notFound()
  const grupos = porCategoria(await menuDelLocal(local.id, true))

  return (
    <main className="min-h-svh bg-foam text-ink">
      <header className="bg-[#3a2a18] px-5 pt-6 pb-5 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/" aria-label="Lago La Candelaria">
            <LogoMark className="size-12" />
          </Link>
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white/70 uppercase">Lago La Candelaria</p>
            <h1 className="font-display text-3xl leading-tight tracking-tight">Menú del {local.nombre.toLowerCase()}</h1>
          </div>
        </div>
      </header>

      {grupos.length > 1 ? (
        <nav aria-label="Categorías" className="sticky top-0 z-10 border-b border-ink/10 bg-foam/95 backdrop-blur">
          <ul className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-5 py-3">
            {grupos.map((grupo) => (
              <li key={grupo.categoria} className="shrink-0">
                <a href={`#${ancla(grupo.categoria)}`} className="block rounded-full border border-ink/15 bg-white px-4 py-1.5 text-sm font-semibold">
                  {grupo.categoria}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mx-auto max-w-2xl px-5 py-6">
        {grupos.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-ink/70">Estamos actualizando la carta. Pedila a quien te atiende.</p>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.categoria} id={ancla(grupo.categoria)} aria-label={grupo.categoria} className="scroll-mt-20 pb-6">
              <h2 className="font-display border-b-2 border-orange pb-1 text-2xl tracking-tight">{grupo.categoria}</h2>
              <ul className="divide-y divide-ink/10">
                {grupo.items.map((item) => (
                  <li key={item.id} className="flex items-baseline gap-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold">{item.nombre}</span>
                      {item.descripcion ? <span className="block text-sm text-ink/65">{item.descripcion}</span> : null}
                    </span>
                    <span className="text-lg font-bold whitespace-nowrap tabular-nums">{pesos(item.precio)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        <p className="pt-2 text-center text-xs text-ink/55">Precios en pesos. Pagando en el local se aceptan efectivo, débito y transferencia.</p>
      </div>
    </main>
  )
}
