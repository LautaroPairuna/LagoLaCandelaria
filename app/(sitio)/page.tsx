import type { Metadata } from "next"
import { MapPin } from "lucide-react"

import { AboutPlace } from "@/components/about-place"
import { ActivityMosaic } from "@/components/activity-mosaic"
import { ButtonLink } from "@/components/button-link"
import { TextLink } from "@/components/text-link"
import { VideoFondo } from "@/components/video-fondo"
import { fotoUrl } from "@/lib/fotos"
import { seoDeInicio } from "@/lib/seo"
import { enlaceWhatsappDelPredio } from "@/lib/site"

export const metadata: Metadata = seoDeInicio()

export default function HomePage() {
  return (
    <main>
      <section className="hero-on-video sticky top-0 z-0 flex min-h-svh flex-col overflow-hidden text-cream">
        <VideoFondo
          src="/hero.mp4"
          poster={fotoUrl("/posters/hero.jpg", 1280)}
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
        <div aria-hidden className="hero-video-shade pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-1 flex-col items-center justify-center px-5 pt-24 text-center md:px-8">
          <div className="rise">
            <div className="mx-auto max-w-4xl">
              <h1 className="font-display text-[clamp(2.4rem,6vw,5.2rem)] leading-[0.98] tracking-[-0.03em] text-cream">
                Aventura y descanso entre amigos y familia
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold text-balance text-cream drop-shadow-[0_2px_10px_rgba(20,25,20,0.65)] sm:mt-6 sm:text-xl">
                <MapPin className="mr-1.5 inline size-5 align-[-0.18em]" aria-hidden />
                Estamos en Tristán Suárez, a tan solo 30 minutos de Capital Federal
              </p>
              <div className="mt-8 flex justify-center sm:mt-10">
                <ButtonLink
                  href="/#actividades"
                  className="h-14 bg-orange px-8 text-lg text-white shadow-[0_10px_28px_rgba(255,122,20,0.45)] hover:bg-orange-hover"
                >
                  Ver actividades
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <ActivityMosaic />

      <section id="como-reservar" data-nav="como-reservar" className="section-snap audience-water relative flex items-center overflow-hidden bg-[#0c4e58] text-cream max-md:!h-auto max-md:!overflow-visible">
        <VideoFondo
          src="/para-quien.mp4"
          poster={fotoUrl("/posters/para-quien.jpg", 1280)}
          className="pointer-events-none absolute inset-0 size-full object-cover"
          diferido
        />
        <div aria-hidden className="audience-water-shade pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto w-full max-w-[1120px] px-5 py-10 md:px-8">
          <h2 className="font-display max-w-3xl text-4xl leading-[1.02] tracking-tight text-cream md:text-6xl">
            ¿Cómo reservar?
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-0">
            <article className="md:pr-8">
              <h3 className="inline-block max-w-full rounded-md bg-orange/35 px-2.5 py-0.5 font-display text-3xl italic leading-tight tracking-tight text-cream md:text-4xl">Para familias</h3>
              <p className="mt-4 text-base leading-relaxed text-cream/90 md:text-lg">
                Entrá al panel de reservas, completá tus datos y elegí dónde se ubican. El valor de la entrada incluye todas las actividades que quieran hacer.
              </p>
              <div className="mt-5">
                <TextLink href="/reserva?propuesta=familia" light>
                  Reservar finde en familia
                </TextLink>
              </div>
            </article>
            <article className="md:border-x md:border-cream/25 md:px-8">
              <h3 className="inline-block max-w-full rounded-md bg-orange/35 px-2.5 py-0.5 font-display text-3xl italic leading-tight tracking-tight text-cream md:text-4xl">Para Grupo estudiantil</h3>
              <p className="mt-4 text-base leading-relaxed text-cream/90 md:text-lg">
                Entrá a reservas, mirá las propuestas y consultá con el equipo. Cuando decidan, traigan la planilla con los datos de todas las personas del grupo.
              </p>
              <div className="mt-5">
                <TextLink href="/reserva?propuesta=estudiantil" light>
                  Reservar propuesta estudiantil
                </TextLink>
              </div>
            </article>
            <article className="md:pl-8">
              <h3 className="inline-block max-w-full rounded-md bg-orange/35 px-2.5 py-0.5 font-display text-3xl italic leading-tight tracking-tight text-cream md:text-4xl">Para actividades de aventura</h3>
              <p className="mt-4 text-base leading-relaxed text-cream/90 md:text-lg">
                Organizamos actividades deportivas y de aventura: carreras de nado, de bicicleta, senderismo, escalada y más. Para coordinar una actividad puntual, escribinos.
              </p>
              <div className="mt-5">
                <TextLink
                  href={enlaceWhatsappDelPredio("Hola, quiero coordinar una actividad de aventura.")}
                  light
                  externo
                >
                  Comunicarse con nuestro equipo
                </TextLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <AboutPlace />
      </div>
    </main>
  )
}
