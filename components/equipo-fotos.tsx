"use client"

import { useEffect, useState } from "react"

import { Foto } from "@/components/foto"

const INTERVALO_MS = 1500

const fotos = [
  {
    src: "/equipo-predio.jpg",
    alt: "Equipo de Lago La Candelaria en el césped del predio, con remos, frente a la casa amarilla.",
  },
  {
    src: "/equipo-palestra.jpg",
    alt: "Equipo de Lago La Candelaria en la palestra, sobre la colchoneta roja.",
  },
  {
    src: "/equipo-juegos.jpg",
    alt: "Equipo de Lago La Candelaria junto a los juegos de madera del predio.",
  },
] as const

export function EquipoFotos() {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      if (document.hidden) return
      setIndice((actual) => (actual + 1) % fotos.length)
    }, INTERVALO_MS)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="team-print-stage">
      {fotos.map((foto, fotoIndice) => (
        <Foto
          key={foto.src}
          src={foto.src}
          alt={fotoIndice === indice ? foto.alt : ""}
          sizes="(min-width: 1024px) 52vw, 100vw"
          className={`team-print-photo transition-opacity duration-500 ${
            fotoIndice === indice ? "opacity-100" : "opacity-0"
          }`}
          prioridad={fotoIndice === 0}
        />
      ))}
    </div>
  )
}
