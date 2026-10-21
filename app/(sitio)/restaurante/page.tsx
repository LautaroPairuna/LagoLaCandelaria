
import { ButtonLink } from "@/components/button-link"
import { PageHero } from "@/components/page-hero"
import { seoDePagina, seoDePaginas } from "@/lib/seo"

export const metadata = seoDePagina({ ...seoDePaginas.restaurante, ruta: "/restaurante" })

const sectors = [
  {
    name: "Restaurante",
    text: "La mesa del predio. La carta digital muestra los productos y valores publicados por el restaurante.",
  },
  {
    name: "Bar de playa",
    text: "Un sector cerca del agua, para el grupo que quiere quedarse afuera. Su menú se consulta presencialmente.",
  },
  {
    name: "Parrilla",
    text: "Hay sector parrilla. Si la quieren, se pide junto con la visita, no se ocupa al llegar.",
  },
  {
    name: "Gazebo",
    text: "Sombra y mesa para el grupo. También se reserva el sector, no se da por sentado.",
  },
]

export default function RestaurantePage() {
  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Restaurante" title={<>La mesa también es parte del día.</>}>
        Se puede comer en el predio o traer la comida y la bebida. Las dos cosas conviven. El sector —restaurante, parrilla, gazebo o bar de playa— se define cuando reservan.
      </PageHero>

      <section className="mx-auto max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <ol>
          {sectors.map((sector, index) => (
            <li key={sector.name} className="grid gap-3 border-t border-ink/15 py-8 md:grid-cols-[6rem_0.8fr_1.2fr] md:items-baseline md:gap-8">
              <span className="font-display text-earth-ink">0{index + 1}</span>
              <h2 className="font-display text-4xl tracking-tight md:text-5xl">{sector.name}</h2>
              <p className="text-lg leading-relaxed text-ink/75">{sector.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 grid gap-8 border-t border-ink/15 pt-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <p className="font-display max-w-xl text-3xl leading-snug tracking-tight md:text-4xl">
            Si prefieren, traen lo de ustedes. El predio no obliga a sentarse a la mesa.
          </p>
          <div>
            <p className="text-ink/75">
              Para un grupo grande, conviene decirlo en la reserva: cuántos comen, si usan parrilla y si el restaurante entra en el día.
            </p>
            <div className="mt-6">
              <ButtonLink href="/categorias/bar#carta">Ver la carta del restaurante</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
