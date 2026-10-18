import { PageHero } from "@/components/page-hero"
import { BuscarMiReserva } from "@/components/visita/buscar-mi-reserva"
import { seoDePagina, seoDePaginas } from "@/lib/seo"

export const metadata = seoDePagina({ ...seoDePaginas["mi-reserva"], ruta: "/mi-reserva" })

export default function MiReservaPage() {
  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Ver mi reserva" title="Tu reserva, a mano.">
        Con el código del ticket y el celular con que reservaste podés ver tu reserva, cambiar el día, el lugar o la cantidad de personas, o cancelarla.
      </PageHero>
      <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">
        <BuscarMiReserva />
      </section>
    </main>
  )
}
