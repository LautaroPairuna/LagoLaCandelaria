import type { Metadata } from "next"
import { MapPin } from "lucide-react"
import { Suspense } from "react"

import { AboutPlace } from "@/components/about-place"
import { ActivityMosaic } from "@/components/activity-mosaic"
import { PortalesInicio } from "@/components/portales-inicio"
import { RecuadroReservas, RecuadroReservasDelEnlace } from "@/components/reserva-nueva/recuadro-reservas"
import { VideoFondo } from "@/components/video-fondo"
import { fotoUrl } from "@/lib/fotos"
import { seoDeInicio } from "@/lib/seo"

export const metadata: Metadata = seoDeInicio()

// La portada se pregenera: la propuesta que llega por el enlace (?propuesta=...) la lee
// el recuadro de reservas en el navegador.
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
            <div className="relative">
              <div
                id="home-logo-anchor"
                aria-hidden
                className="absolute bottom-[calc(100%+1.25rem)] left-1/2 h-32 w-[min(82vw,22rem)] -translate-x-1/2 sm:bottom-[calc(100%+1.5rem)] sm:h-36 sm:w-[28rem] lg:w-[32rem]"
              />
              <h1 className="font-display mx-auto max-w-4xl text-[clamp(2.4rem,6vw,5.2rem)] leading-[0.98] tracking-[-0.03em] text-cream">
                Aventura y descanso entre amigos y familia
              </h1>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold text-balance text-cream drop-shadow-[0_2px_10px_rgba(20,25,20,0.65)] sm:mt-6 sm:text-xl">
              <MapPin className="mr-1.5 inline size-5 align-[-0.18em]" aria-hidden />
              Estamos en Tristán Suárez, a tan solo 30 minutos de Capital Federal
            </p>
            <div className="mt-8 sm:mt-10">
              <PortalesInicio />
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <ActivityMosaic />

        <section
          id="como-reservar"
          data-nav="como-reservar"
          aria-labelledby="como-reservar-titulo"
          className="audience-water relative snap-start bg-[#0c4e58] text-cream"
        >
          <div className="pointer-events-none sticky top-[calc(var(--site-header)-2px)] z-0 h-[calc(100svh-var(--site-header)+2px)]">
            <VideoFondo
              src="/para-quien.mp4"
              poster={fotoUrl("/posters/para-quien.jpg", 1280)}
              className="absolute inset-0 size-full object-cover"
              diferido
            />
            <div aria-hidden className="audience-water-shade absolute inset-0" />
          </div>
          <div className="relative z-10 mx-auto -mt-[calc(100svh-var(--site-header)+2px)] w-full max-w-[1180px] px-5 py-12 md:px-8 md:py-16">
            <div data-scroll-focus>
              <h2 id="como-reservar-titulo" className="font-display max-w-3xl text-4xl leading-[1.02] tracking-tight text-cream md:text-6xl">
                ¿Cómo reservar?
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-cream/90">
                Elegí la propuesta, completá los datos y al confirmar te queda el ticket con el QR del ingreso.
              </p>
            </div>
            <Suspense fallback={<RecuadroReservas />}>
              <RecuadroReservasDelEnlace />
            </Suspense>
          </div>
        </section>

        <AboutPlace />
      </div>
    </main>
  )
}
