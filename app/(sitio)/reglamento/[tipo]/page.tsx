import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHero } from "@/components/page-hero"
import { ReglamentoVista } from "@/components/visita/reglamento"
import { esTipoDeReglamento, reglamentos } from "@/lib/reglamentos"

export function generateStaticParams() {
  return Object.keys(reglamentos).map((tipo) => ({ tipo }))
}

export async function generateMetadata({ params }: PageProps<"/reglamento/[tipo]">): Promise<Metadata> {
  const { tipo } = await params
  if (!esTipoDeReglamento(tipo)) return {}
  return {
    title: reglamentos[tipo].titulo,
    description: "Reglamento y horarios de Lago La Candelaria para leer antes de la visita.",
    alternates: { canonical: `/reglamento/${tipo}` },
  }
}

export default async function ReglamentoPage({ params }: PageProps<"/reglamento/[tipo]">) {
  const { tipo } = await params
  if (!esTipoDeReglamento(tipo)) notFound()
  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Antes de venir" title={reglamentos[tipo].titulo}>
        Leelo antes de la visita: vale para todos los integrantes de la reserva.
      </PageHero>
      <section className="mx-auto max-w-3xl px-5 pb-20 md:px-8">
        <ReglamentoVista tipo={tipo} titulo={false} />
      </section>
    </main>
  )
}
