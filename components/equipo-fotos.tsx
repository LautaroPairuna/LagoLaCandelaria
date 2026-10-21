"use client"

import { useEffect, useState } from "react"

import { Foto } from "@/components/foto"
import type { FotoConTexto } from "@/lib/contenido/campos"

const INTERVALO_MS = 1500

export function EquipoFotos({ fotos }: { fotos: FotoConTexto[] }) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      if (document.hidden) return
      setIndice((actual) => (actual + 1) % fotos.length)
    }, INTERVALO_MS)

    return () => window.clearInterval(timer)
  }, [fotos.length])

  return (
    <div className="team-print-stage">
      {fotos.map((foto, fotoIndice) => (
        <Foto
          key={`${fotoIndice}-${foto.src}`}
          src={foto.src}
          alt={fotoIndice === indice % fotos.length ? foto.alt : ""}
          sizes="(min-width: 1024px) 52vw, 100vw"
          className={`team-print-photo transition-opacity duration-500 ${
            fotoIndice === indice % fotos.length ? "opacity-100" : "opacity-0"
          }`}
          prioridad={fotoIndice === 0}
        />
      ))}
    </div>
  )
}
