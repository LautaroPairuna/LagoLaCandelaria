import { MapPin } from "lucide-react"

import { AboutPlace } from "@/components/about-place"
import { ActivityMosaic } from "@/components/activity-mosaic"
import { ButtonLink } from "@/components/button-link"
import { TextLink } from "@/components/text-link"
import { VideoFondo } from "@/components/video-fondo"
import { Wave } from "@/components/wave"
import { fotoUrl } from "@/lib/fotos"

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
        <Wave />
        <ActivityMosaic />

      <section id="como-reservar" data-nav="como-reservar" className="section-snap audience-water relative flex items-center overflow-hidden bg-[#0c4e58] text-cream">
        <VideoFondo
          src="/para-quien.mp4"
          poster={fotoUrl("/posters/para-quien.jpg", 1280)}
          className="pointer-events-none absolute inset-0 size-full object-cover"
          diferido
        />
        <div aria-hidden className="audience-water-shade pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto w-full max-w-[1120px] px-5 py-10 md:px-8">
          <h2 className="font-display max-w-3xl text-4xl leading-[1.02] tracking-tight text-cream md:text-6xl">
            ¿Cómo queres reservar?
          </h2>
          <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-0">
            <article className="md:pr-14">
              <h3 className="font-display text-5xl italic tracking-tight text-cream">Familia</h3>
              <p className="mt-5 text-lg leading-relaxed text-cream/90">
                El finde en familia es un día de predio, no una entrada suelta. Las actividades con staff tienen turno. Las canchas y la plaza, no. Si vienen con mascota, entra con correa y no paga. El sector —parrilla, gazebo, restaurante o bar de playa— se acuerda al reservar. También pueden traer la comida.
              </p>
              <div className="mt-6">
                <TextLink href="/grupos" light>
                  Cómo es el día en familia
                </TextLink>
              </div>
            </article>
            <article className="md:border-l md:border-cream/25 md:pl-14">
              <h3 className="font-display text-5xl italic tracking-tight text-cream">Grupo Estudiantil</h3>
              <p className="mt-5 text-lg leading-relaxed text-cream/90">
                Los campamentos estudiantiles son el centro del lugar. Hay tres formas: jornada de aventura, carpa o dormis. Tirolesa, parque aéreo, palestra, péndulo, remo y caminata los guía el personal. Si es un viaje de egresados o una salida educativa, se arma igual: con fecha, cantidad y edades.
              </p>
              <div className="mt-6">
                <TextLink href="/grupos" light>
                  Armar una salida
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
