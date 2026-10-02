import type { Metadata } from "next"
import Link from "next/link"

import { PageHero } from "@/components/page-hero"
import { stays } from "@/lib/categories"

export const metadata: Metadata = {
  title: "Estadía",
  description:
    "Bungalows, campamento y pasar el día en Lago La Candelaria. Cada opción tiene su ficha. La fecha se confirma con el equipo.",
}

export default function EstadiaPage() {
  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Estadía" title={<>Dormir en el predio, o pasar el día y volver.</>}>
        Bungalows para pocos, campamento para el curso, o el día sin quedarse. Cada ficha cuenta qué incluye, dónde está en el predio y cómo sigue la reserva.
      </PageHero>

      <div className="mx-auto max-w-[1120px] px-5 pb-20 md:px-8">
        <ul className="grid gap-6">
          {stays.map((stay) => (
            <li key={stay.slug}>
              <Link
                href={`/estadia/${stay.slug}`}
                className="group grid overflow-hidden rounded-[1.15rem] bg-cream md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
              >
                <img
                  src={stay.banner.src}
                  alt=""
                  className="h-52 w-full object-cover md:h-full md:min-h-56"
                  style={{ objectPosition: stay.banner.position ?? "center" }}
                />
                <span className="block px-6 py-6 md:px-8 md:py-8">
                  <span className="kicker">{stay.kicker}</span>
                  <span className="font-display mt-2 block text-4xl tracking-tight group-hover:text-lake-ink md:text-5xl">
                    {stay.title}
                  </span>
                  <span className="mt-3 block max-w-md text-lg leading-relaxed text-ink/75">
                    {stay.summary}
                  </span>
                  <span className="mt-4 flex flex-wrap gap-2">
                    {stay.subactivities.map((item) => (
                      <span
                        key={item.slug}
                        className="rounded-full bg-lake-soft px-3 py-1 text-sm font-semibold text-lake-ink"
                      >
                        {item.chip}
                      </span>
                    ))}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
