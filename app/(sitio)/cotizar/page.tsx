import { PageHero } from "@/components/page-hero"
import { Cotizador } from "@/components/visita/cotizador"
import { seoDePagina, seoDePaginas } from "@/lib/seo"

export const metadata = seoDePagina({ ...seoDePaginas.cotizar, ruta: "/cotizar" })

export default function CotizarPage() {
  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Cotizar" title="¿Cuánto sale venir?">
        Elegí cuándo querés venir, cómo pagarías y cuántos son. No se cobra nada por adelantado: se paga al ingresar al predio.
      </PageHero>
      <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">
        <Cotizador />
      </section>
    </main>
  )
}
