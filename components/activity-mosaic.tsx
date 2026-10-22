"use client"

import { useEffect, useRef, useState } from "react"

import { Foto } from "@/components/foto"

export type Card = {
  title: string
  chips: string[]
  image: string
  href: string
  side: "left" | "right"
  position?: string
  compact?: boolean
}

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

export function ActivityMosaic({ titulo, tarjetas }: { titulo: string; tarjetas: Card[] }) {
  return (
    <div className="offer-world wave-top">
      <section className="offer-stage offer-stage-lead" data-nav="actividades" aria-labelledby="actividades">
        <div className="mx-auto w-full max-w-[1440px] px-3 md:px-6">
          <h2 id="actividades" className="offer-heading font-display">
            {titulo}
          </h2>
          <div className="offer-field offer-activities">
            {tarjetas.map((card) => (
              <SideCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
