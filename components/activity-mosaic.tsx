"use client"

import { useEffect, useRef, useState } from "react"

import { Foto } from "@/components/foto"
import { OfferPaper } from "@/components/offer-paper"
import { getCategory, getStay } from "@/lib/categories"

type Card = {
  title: string
  chips: string[]
  image: string
  href: string
  side: "left" | "right"
  position?: string
  compact?: boolean
}

const activityLayout: { slug: string; side: "left" | "right"; stay?: boolean; title?: string }[] = [
  { slug: "lago", side: "left" },
  { slug: "parque-aereo", side: "right" },
  { slug: "canchas", side: "left" },
  { slug: "playa", side: "right" },
  { slug: "parrillas", side: "left" },
  { slug: "bar", side: "right" },
  { slug: "bungalows", side: "left", stay: true },
  { slug: "campamento", side: "right", stay: true, title: "Propuestas estudiantiles" },
]

const activities: Card[] = activityLayout.map(({ slug, side, stay, title }) => {
  const item = stay ? getStay(slug) : getCategory(slug)
  if (!item) throw new Error(`Falta la ficha ${slug}`)
  return {
    title: title ?? item.title,
    chips: item.subactivities.map((sub) => sub.chip),
    image: item.banner.src,
    href: stay ? `/estadia/${slug}` : `/categorias/${slug}`,
    side,
    position: slug === "parrillas" ? item.banner.position : undefined,
    compact: stay,
  }
})

function SideCard({ card }: { card: Card }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.28, rootMargin: "0px 0px -10% 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <a
      ref={ref}
      href={card.href}
      className={`offer-card from-${card.side} ${shown ? "is-in" : ""}`}
      style={{ ["--pair" as string]: card.side === "right" ? 1 : 0 }}
    >
      <span className="offer-media">
        <Foto
          src={card.image}
          alt=""
          sizes="(min-width: 768px) 50vw, 100vw"
          className="offer-photo"
          style={card.position ? { objectPosition: card.position } : undefined}
        />
        <span className="offer-shade" />
      </span>
      <span className="offer-copy">
        <span className={card.compact ? "offer-title is-compact" : "offer-title"}>{card.title}</span>
        <span className="offer-chips">
          {card.chips.map((chip) => (
            <span key={chip} className="offer-chip">
              {chip}
            </span>
          ))}
        </span>
      </span>
    </a>
  )
}

export function ActivityMosaic() {
  return (
    <div className="offer-world wave-top">
      <OfferPaper />
      <section className="offer-stage offer-stage-lead" data-nav="actividades" aria-labelledby="actividades">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
          <h2 id="actividades" className="offer-heading font-display">
            Una entrada, todas las actividades
          </h2>
          <div className="offer-field offer-activities">
            {activities.map((card) => (
              <SideCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
