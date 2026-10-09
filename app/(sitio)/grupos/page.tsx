
import { ButtonLink } from "@/components/button-link"
import { PageHero } from "@/components/page-hero"
import { TextLink } from "@/components/text-link"
import { seoDePagina, seoDePaginas } from "@/lib/seo"

export const metadata = seoDePagina({ ...seoDePaginas.grupos, ruta: "/grupos" })

const script = [
  {
    label: "Mañana",
    text: "Llegan al predio. El equipo recibe al grupo. Sin reserva previa, el día no arranca.",
  },
  {
    label: "Mediodía",
    text: "Agua o altura, según lo que hayan pedido. El staff llama el turno: no es una fila que se arma sola.",
  },
  {
    label: "Tarde",
    text: "Parque aéreo, canchas, plaza o el fogón si el formato es campamento. El rato libre y el turno guiado no son lo mismo.",
  },
  {
    label: "Mesa",
    text: "Restaurante, parrilla, gazebo, bar de playa, o la comida que trajeron. El sector se había acordado antes.",
  },
]

export default function GruposPage() {
  return (
    <main>
      <PageHero kicker="Grupos" title={<>El curso, la familia, el finde.</>}>
        Somos un espacio recreativo. Lo que más hacemos son campamentos estudiantiles y findes en familia. El resto —egresados, salida educativa, bungalow— entra por el mismo lugar: una reserva.
      </PageHero>

      <section className="texture-wood text-ink">
        <div className="mx-auto grid max-w-[1120px] gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <article>
            <p className="kicker">Familias</p>
            <h2 className="font-display mt-3 text-5xl tracking-tight">Un día, no una excursión apurada.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/80">
              Vienen a pasar el día. Hay turno para lo guiado y rato libre para canchas y plaza. Si traen mascota, entra con correa y no paga entrada. Si alguien del grupo tiene certificado CUD, la entrada no se abona: eso se gestiona en la reserva, no en la puerta.
            </p>
          </article>
          <article>
            <p className="kicker">Estudiantes</p>
            <h2 className="font-display mt-3 text-5xl tracking-tight">El campamento es el oficio del predio.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/80">
              Jornada, carpa o dormis. Viaje de egresados o salida educativa, según el curso. En la consulta van cantidad, edades y qué no puede faltar: remo, tirolesa, parque aéreo, fogón. El equipo arma el día con eso.
            </p>
            <div className="mt-6">
              <TextLink href="/estadia/campamento">Ver los tres formatos</TextLink>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-cream text-ink">
        <div className="mx-auto max-w-[1120px] px-5 py-20 md:px-8 md:py-28">
          <p className="kicker">Cómo se arma la visita</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl tracking-tight md:text-6xl">
            Un guion, no un horario clavado.
          </h2>
          <ol className="mt-12 max-w-3xl">
            {script.map((step, index) => (
              <li key={step.label} className="grid grid-cols-[auto_1fr] gap-5 border-t border-ink/15 py-6">
                <span className="font-display text-earth-ink pt-1 text-sm">0{index + 1}</span>
                <div>
                  <h3 className="font-display text-3xl tracking-tight">{step.label}</h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <ButtonLink href="/reserva">Contar cómo es el grupo</ButtonLink>
          </div>
        </div>
      </section>
    </main>
  )
}
