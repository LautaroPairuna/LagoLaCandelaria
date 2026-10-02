"use client"

import { useEffect, useRef, useState } from "react"

import { OfferLines } from "@/components/offer-lines"
import { getCategory, getStay } from "@/lib/categories"

type Card = {
  title: string
  chips: string[]
  image: string
  href: string
  span?: string
  side?: "left" | "right"
}

const activityLayout: { slug: string; side: "left" | "right" }[] = [
  { slug: "lago", side: "left" },
  { slug: "parque-aereo", side: "right" },
  { slug: "canchas", side: "left" },
  { slug: "playa", side: "right" },
  { slug: "parrillas", side: "left" },
  { slug: "bar", side: "right" },
]

const activities: Card[] = activityLayout.map(({ slug, side }) => {
  const category = getCategory(slug)
  if (!category) throw new Error(`Falta la ficha ${slug}`)
  return {
    title: category.title,
    chips: category.subactivities.map((item) => item.chip),
    image: category.banner.src,
    href: `/categorias/${slug}`,
    side,
  }
})

const stayLayout = ["bungalows", "campamento", "pasar-el-dia"]

const stays: Card[] = stayLayout.map((slug) => {
  const stay = getStay(slug)
  if (!stay) throw new Error(`Falta la ficha ${slug}`)
  return {
    title: stay.title,
    chips: stay.subactivities.map((item) => item.chip),
    image: stay.banner.src,
    href: `/estadia/${slug}`,
    span: "span-stay",
  }
})

function SideCard({ card }: { card: Card }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true)
      return
    }

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
        <img src={card.image} alt="" className="offer-photo" />
        <span className="offer-shade" />
      </span>
      <span className="offer-copy">
        <span className="offer-title">{card.title}</span>
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

function Stage({
  id,
  title,
  cards,
  fieldClass,
  lead = false,
}: {
  id: string
  title: string
  cards: Card[]
  fieldClass: string
  lead?: boolean
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      data-nav={id}
      className={lead ? "offer-stage offer-stage-lead wave-top" : "offer-stage"}
      aria-labelledby={id}
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
        <h2 id={id} className="offer-heading font-display">
          {title}
        </h2>
        <div className={`offer-field ${fieldClass} ${shown ? "is-in" : ""}`}>
          {cards.map((card, index) => (
            <a
              key={card.title}
              href={card.href}
              className={`offer-card ${card.span}`}
              style={{ ["--i" as string]: index }}
            >
              <span className="offer-media">
                <img src={card.image} alt="" className="offer-photo" />
                <span className="offer-shade" />
              </span>
              <span className="offer-copy">
                <span className="offer-index">0{index + 1}</span>
                <span className="offer-title">{card.title}</span>
                <span className="offer-chips">
                  {card.chips.map((chip) => (
                    <span key={chip} className="offer-chip">
                      {chip}
                    </span>
                  ))}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ActivityMosaic() {
  return (
    <div className="offer-world wave-top">
      <OfferLines />
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
      <Stage
        id="estadia"
        title="¡Hospedate como gustes!"
        cards={stays}
        fieldClass="offer-stays"
      />
    </div>
  )
}
