import type { CSSProperties } from "react"

import { fotoGenerada } from "@/lib/fotos"

export function Foto({
  src,
  alt,
  sizes = "100vw",
  className,
  style,
  prioridad = false,
}: {
  src: string
  alt: string
  sizes?: string
  className?: string
  style?: CSSProperties
  prioridad?: boolean
}) {
  const foto = fotoGenerada(src)
  const variantes = (formato: "avif" | "webp") =>
    foto.anchos.map((ancho) => `${foto.base}-${ancho}.${formato} ${ancho}w`).join(", ")

  return (
    <picture className="contents">
      <source type="image/avif" srcSet={variantes("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={variantes("webp")} sizes={sizes} />
      <img
        src={foto.respaldo}
        width={foto.ancho}
        height={foto.alto}
        alt={alt}
        className={className}
        style={style}
        loading={prioridad ? "eager" : "lazy"}
        fetchPriority={prioridad ? "high" : undefined}
        decoding="async"
      />
    </picture>
  )
}
