import Link from "next/link"

import { Foto } from "@/components/foto"
import { PredioMap } from "@/components/predio-map"
import type { Grounds } from "@/lib/categories"
import type { ZoneId } from "@/lib/offers"

const zoneBySpot: Record<string, ZoneId> = {
  bungalows: "bungalows",
  parque: "parque",
  palapas: "palapas",
  parrillas: "parrillas",
  canchas: "canchas",
  restaurante: "mesa",
  bar: "mesa",
  playa: "playa",
  lago: "lago",
  carpas: "carpas",
  dormis: "dormis",
}

export function GroundsPlan({ grounds }: { grounds: Grounds }) {
  const label = `${grounds.total} ${grounds.lede}`
  const whole = grounds.primary.includes("predio")
  const spots = grounds.spots.filter((spot) => {
    const zone = zoneBySpot[spot.id]
    if (!zone || whole) return true
    return grounds.primary.includes(zone) || grounds.context?.includes(zone)
  })

  return (
    <section id="plano" className="scroll-mt-24 border-t border-ink/10 bg-[#e7f4dc] py-16 text-ink md:py-24">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <p className="kicker">Plano</p>
        <h2 className="font-display mt-3 max-w-3xl text-4xl tracking-tight md:text-6xl">{grounds.title}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">{grounds.lede}</p>
        <p className="font-display mt-6 max-w-3xl text-2xl leading-snug tracking-tight md:text-3xl">
          {grounds.total}
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {grounds.highlights.map((item) => (
            <li key={item.label} className="rounded-[1.15rem] bg-cream px-5 py-5">
              <p className="font-display text-4xl tracking-tight text-lake-ink">{item.count}</p>
              <p className="mt-1 text-sm leading-snug">{item.label}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <PredioMap primary={grounds.primary} context={grounds.context} label={label} />
          <figure className="overflow-hidden rounded-[1.25rem] bg-cream">
            <Foto
              src={grounds.photo.src}
              alt={grounds.photo.alt}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="aspect-[4/3] w-full object-cover"
              style={{ objectPosition: grounds.photo.position ?? "center" }}
            />
            <figcaption className="px-4 py-3 text-sm leading-relaxed text-ink/70">
              El predio desde arriba: el agua, las carpas y un gazebo del sector de palapas.
            </figcaption>
          </figure>
        </div>

        <ul className="mt-8 grid gap-x-8 sm:grid-cols-2">
          {spots.map((spot) => (
            <li key={spot.id} className="border-t border-ink/15 py-4">
              <Link href={spot.href} className="group grid grid-cols-[5.5rem_1fr] gap-3">
                <span className="font-display text-2xl tracking-tight text-lake-ink">{spot.count}</span>
                <span>
                  <span className="font-display text-2xl tracking-tight group-hover:text-lake-ink">
                    {spot.name}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink/70">{spot.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
