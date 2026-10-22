import { z } from "zod"

import { esFotoValida } from "@/lib/fotos"
import { normalizarTelefono } from "@/lib/predio/contacto"

/// Cómo se edita cada dato del sitio. De la misma descripción salen el formulario del
/// panel y la validación del servidor, así no se desacomodan.

type Comun = { clave: string; etiqueta: string; ayuda?: string }

export type CampoDeTexto = Comun & {
  tipo: "texto"
  max: number
  multilinea?: boolean
  formato?: "telefono" | "email" | "usuario" | "numero" | "estrellas"
  /// Puede quedar vacío: lo que muestra se saltea.
  opcional?: boolean
}
export type CampoDeFoto = Comun & { tipo: "foto" }
export type CampoDeVideo = Comun & { tipo: "video" }
/// Varios campos que van juntos en una tarjeta (el plano de una ficha, un reglamento).
export type CampoDeGrupo = Comun & { tipo: "grupo"; campos: Campo[] }
export type CampoDeLista = Comun & {
  tipo: "lista"
  campos: Campo[]
  /// Cómo se llama cada elemento ("Foto", "Profe").
  item: string
  min: number
  max: number
  /// Si es fija no se agregan ni se quitan elementos: cada uno es una pieza del sitio.
  fija?: boolean
  /// Cómo se llama cada elemento de una lista fija, en orden.
  nombres?: string[]
  /// La clave del campo de texto que nombra a cada elemento en el panel.
  titulo?: string
}

export type Campo = CampoDeTexto | CampoDeFoto | CampoDeVideo | CampoDeGrupo | CampoDeLista

export type FotoConTexto = { src: string; alt: string }
export type VideoDeFondo = { src: string; poster: string }

/// Los videos que ya trae el sitio en public/. Los subidos se llaman /subidas/<id>.mp4.
export const videosDelSitio = ["/hero.mp4", "/para-quien.mp4", "/ubicacion.mp4?v=5"]

export function esVideoValido(src: string) {
  return videosDelSitio.includes(src) || /^\/subidas\/[a-z0-9]{16}\.mp4$/.test(src)
}

/// Los teléfonos del predio se escriben como en la web; los de 8 cifras son de CABA y GBA (11).
export function telefonoDelPredio(texto: string) {
  const digitos = texto.replace(/\D/g, "")
  return normalizarTelefono(digitos.length === 8 ? `11${digitos}` : digitos)
}

function esquemaDeTexto(campo: CampoDeTexto) {
  const largo = z.string(`Completá «${campo.etiqueta}».`).trim().max(campo.max, `«${campo.etiqueta}» es muy largo: hasta ${campo.max} letras.`)
  if (campo.opcional) return largo
  const base = largo.min(1, `Completá «${campo.etiqueta}».`)
  if (campo.formato === "numero") return base.refine((valor) => /^\d+([.,]\d+)?$/.test(valor), `«${campo.etiqueta}» tiene que ser un número.`)
  if (campo.formato === "estrellas") return base.refine((valor) => /^[1-5]$/.test(valor), "Las estrellas van de 1 a 5.")
  if (campo.formato === "telefono") return base.refine((valor) => telefonoDelPredio(valor) !== null, "Escribí el número con característica, por ejemplo 11 3009-1020.")
  if (campo.formato === "email") return base.pipe(z.email("Revisá el correo."))
  if (campo.formato === "usuario") return base.transform((valor) => valor.replace(/^[@/]+/, "")).refine((valor) => /^[\w.-]+$/.test(valor), "Escribí solo el usuario, sin espacios ni enlaces.")
  return base
}

const esquemaDeFoto = z.object({
  src: z.string().refine(esFotoValida, "Elegí una foto del sitio o subí una nueva."),
  alt: z.string().trim().min(1, "Describí la foto en pocas palabras: la leen quienes no la ven.").max(200, "La descripción es muy larga: hasta 200 letras."),
})

const esquemaDeVideo = z.object({
  src: z.string().refine(esVideoValido, "Elegí uno de los videos del sitio o subí uno nuevo."),
  poster: z.string().refine(esFotoValida, "Falta la imagen que se ve mientras carga el video."),
})

function esquemaDeCampo(campo: Campo): z.ZodType {
  if (campo.tipo === "texto") return esquemaDeTexto(campo)
  if (campo.tipo === "foto") return esquemaDeFoto
  if (campo.tipo === "video") return esquemaDeVideo
  if (campo.tipo === "grupo") return esquemaDe(campo.campos)
  const item = esquemaDe(campo.campos)
  return z
    .array(item)
    .min(campo.min, `Tiene que haber al menos ${campo.min} en «${campo.etiqueta}».`)
    .max(campo.max, `Hasta ${campo.max} en «${campo.etiqueta}».`)
}

export function esquemaDe(campos: Campo[]) {
  return z.object(Object.fromEntries(campos.map((campo) => [campo.clave, esquemaDeCampo(campo)])))
}
