"use client"

import { useEffect, useRef } from "react"

export function VideoFondo({
  src,
  poster,
  className,
  diferido = false,
}: {
  src: string
  poster: string
  className?: string
  diferido?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const reproducir = () => {
      if (!video.getAttribute("src")) video.src = src
      video.play().catch(() => undefined)
    }
    if (!diferido) {
      reproducir()
      return
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) reproducir()
        else video.pause()
      },
      { rootMargin: "200px 0px" },
    )
    observador.observe(video)
    return () => observador.disconnect()
  }, [src, diferido])

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
    />
  )
}
