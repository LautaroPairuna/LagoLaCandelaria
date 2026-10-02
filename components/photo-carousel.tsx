"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

import type { Photo } from "@/lib/categories"

const INTERVAL_MS = 4500

export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const signature = photos.map((photo) => photo.src).join("|")
  const count = photos.length

  useEffect(() => {
    setIndex(0)
  }, [signature])

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      if (document.hidden) return
      setIndex((current) => (current + 1) % count)
    }, INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [count, paused, signature, index])

  const current = photos[index] ?? photos[0]
  if (!current) return null

  function go(next: number) {
    if (count < 2) return
    setIndex((next + count) % count)
  }

  return (
    <div
      className="group relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-ink/5 shadow-[0_18px_40px_rgba(42,32,22,0.12)] outline-none focus-visible:ring-2 focus-visible:ring-lake-ink"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Fotos de la actividad"
      tabIndex={count > 1 ? 0 : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        const next = event.relatedTarget
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setPaused(false)
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault()
          go(index + 1)
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          go(index - 1)
        }
      }}
    >
      {photos.map((photo, photoIndex) => (
        <img
          key={`${photo.src}-${photoIndex}`}
          src={photo.src}
          alt={photoIndex === index ? photo.alt : ""}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            photoIndex === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ objectPosition: photo.position ?? "center" }}
        />
      ))}
      {count > 1 ? (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/92 text-ink shadow-md transition hover:bg-cream"
            aria-label="Foto anterior"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/92 text-ink shadow-md transition hover:bg-cream"
            aria-label="Foto siguiente"
            onClick={() => go(index + 1)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {photos.map((photo, photoIndex) => (
              <button
                key={`${photo.src}-dot-${photoIndex}`}
                type="button"
                aria-label={`Foto ${photoIndex + 1} de ${count}`}
                aria-current={photoIndex === index ? "true" : undefined}
                className={`h-2 rounded-full bg-cream shadow-sm transition ${
                  photoIndex === index ? "w-6" : "w-2 opacity-75 hover:opacity-100"
                }`}
                onClick={() => go(photoIndex)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
