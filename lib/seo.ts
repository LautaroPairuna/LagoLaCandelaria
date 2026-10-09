import type { Metadata } from "next"

import { fotoGenerada } from "@/lib/fotos"

export const NOMBRE_DEL_SITIO = "Lago La Candelaria"

type Texto = { titulo: string; descripcion: string }
type Imagen = { url: string; width: number; height: number; alt: string }

// Al definir la vista previa de una página, Next no hereda la imagen general: hay que
// indicarla siempre. Las fichas usan su propia portada; el resto, la imagen del sitio.
const imagenGeneral: Imagen = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "Lago La Candelaria, predio recreativo en Tristán Suárez" }

const portadas: Record<string, string> = {
  "/restaurante": "/covers/restaurante.jpg",
  "/categorias/lago": "/covers/lago.jpg",
  "/categorias/parque-aereo": "/covers/parque-aereo.jpg",
  "/categorias/canchas": "/covers/canchas.jpg",
  "/categorias/playa": "/covers/playa.jpg",
  "/categorias/parrillas": "/covers/parrillas.jpg",
  "/categorias/bar": "/covers/restaurante.jpg",
  "/estadia/bungalows": "/covers/bungalows.jpg",
  "/estadia/pasar-el-dia": "/covers/lago.jpg",
}

export function imagenDePagina(ruta: string, alt: string): Imagen {
  const portada = portadas[ruta]
  if (!portada) return imagenGeneral
  const foto = fotoGenerada(portada)
  return { url: foto.respaldo, width: foto.ancho, height: foto.alto, alt }
}

export const rutasConPortada = Object.keys(portadas)

/// Metadatos de una página: título, descripción, canonical y vista previa al compartir
/// (Open Graph y Twitter). Next no copia el título a la vista previa, así que se arma acá.
export function seoDePagina({ titulo, descripcion, ruta }: Texto & { ruta: string }): Metadata {
  const completo = `${titulo} · ${NOMBRE_DEL_SITIO}`
  const imagen = imagenDePagina(ruta, titulo)
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: { type: "website", locale: "es_AR", siteName: NOMBRE_DEL_SITIO, title: completo, description: descripcion, url: ruta, images: [imagen] },
    twitter: { card: "summary_large_image", title: completo, description: descripcion, images: [imagen] },
  }
}

/// El inicio lleva el nombre completo como título, sin repetir el sufijo.
export function seoDeInicio(): Metadata {
  const { titulo, descripcion } = seoDelInicio
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "es_AR", siteName: NOMBRE_DEL_SITIO, title: titulo, description: descripcion, url: "/", images: [imagenGeneral] },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion, images: [imagenGeneral] },
  }
}

export const seoDelInicio: Texto = {
  titulo: `${NOMBRE_DEL_SITIO} · Predio recreativo en Tristán Suárez`,
  descripcion:
    "Predio recreativo de 27 hectáreas en Tristán Suárez, Ezeiza, a 30 minutos de Capital. Lago, parque aéreo, parrillas, bungalows y campamentos. Con reserva.",
}

export const seoDePaginas = {
  actividades: {
    titulo: "Actividades: kayak, tirolesa y canchas",
    descripcion:
      "Todas las actividades del predio en Tristán Suárez: lago, parque aéreo, canchas, playa, parrillas y palapas, bar y restaurante. La entrada es al predio.",
  },
  estadia: {
    titulo: "Bungalows, campamento y pasar el día",
    descripcion:
      "Quedate a dormir en bungalows o en campamento, o pasá el día en el predio de Tristán Suárez. Cada opción tiene su ficha y la fecha se confirma con el equipo.",
  },
  restaurante: {
    titulo: "Restaurante y bar de playa",
    descripcion:
      "Restaurante, bar de playa, parrilla, gazebo y proveeduría en el predio de Tristán Suárez, junto al lago. También se puede traer la comida.",
  },
  grupos: {
    titulo: "Grupos, egresados y salidas educativas",
    descripcion:
      "Findes en familia, campamentos estudiantiles, viajes de egresados y salidas educativas en el predio de Tristán Suárez. La visita es con reserva.",
  },
  reserva: {
    titulo: "Reservá tu visita",
    descripcion:
      "Reservá tu visita a Lago La Candelaria: parrilla, playa o bungalow para el finde, campamentos para colegios y aventura. Te queda un ticket con QR.",
  },
} satisfies Record<string, Texto>

export const seoDeCategorias: Record<string, Texto> = {
  lago: {
    titulo: "Kayak, canoa y nado en el lago",
    descripcion:
      "Kayak triplo, canoa y nado en aguas abiertas en el lago del predio de Tristán Suárez, siempre con el personal en el agua. Para familias, colegios y grupos.",
  },
  "parque-aereo": {
    titulo: "Parque aéreo y tirolesa",
    descripcion:
      "Tirolesas, palestra, péndulo y puentes en el parque aéreo de Tristán Suárez. El personal coloca el arnés y marca cada turno. Para familias y grupos.",
  },
  canchas: {
    titulo: "Canchas de fútbol, vóley y tejo",
    descripcion:
      "Fútbol, vóley, fútbol tenis, tejo y plaza infantil, de uso libre, y caminatas guiadas por el personal, en el predio de Tristán Suárez.",
  },
  playa: {
    titulo: "Playa artificial, palapas y pileta",
    descripcion:
      "Playa artificial, pileta y juegos acuáticos en temporada, junto al lago, con palapas y gazebos para pasar el día en Tristán Suárez.",
  },
  parrillas: {
    titulo: "Parrillas y palapas para pasar el día",
    descripcion:
      "Parrillas numeradas, palapas del sector gazebo y una parrilla en cada bungalow, en el predio de Tristán Suárez. Para más de 18 personas, quincho.",
  },
  bar: {
    titulo: "Bar de playa, proveeduría y restaurante",
    descripcion:
      "Restaurante, bar de playa y proveeduría en el mismo predio que las parrillas, en Tristán Suárez. También se puede traer la comida.",
  },
}

export const seoDeEstadias: Record<string, Texto> = {
  bungalows: {
    titulo: "Bungalows con vista al lago",
    descripcion:
      "Cuatro casas para cuatro personas, con vista al lago, parrilla propia y pileta compartida, en Tristán Suárez. Se reservan por noche.",
  },
  campamento: {
    titulo: "Campamentos para colegios y grupos",
    descripcion:
      "Campamento para colegios y grupos en Tristán Suárez: jornada de aventura, carpa o dormis, con el lago, el parque aéreo y las canchas del predio.",
  },
  "pasar-el-dia": {
    titulo: "Pasar el día en el predio",
    descripcion:
      "Pasá el día en el predio de Tristán Suárez, de mañana a tarde y sin bungalow, carpa ni dormi: lago, parque aéreo, canchas y parrillas.",
  },
}
