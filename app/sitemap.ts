import type { MetadataRoute } from "next"

import { categories, stays } from "@/lib/categories"
import { urlSitio } from "@/lib/url-sitio"

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = [
    "/",
    "/actividades",
    "/estadia",
    "/restaurante",
    "/grupos",
    "/reserva",
    ...categories.map((category) => `/categorias/${category.slug}`),
    ...stays.map((stay) => `/estadia/${stay.slug}`),
  ]
  return rutas.map((ruta) => ({ url: `${urlSitio}${ruta}` }))
}
