import { describe, expect, it } from "vitest"

import { categories, stays } from "@/lib/categories"
import { imagenDePagina, rutasConPortada, seoDeCategorias, seoDeEstadias, seoDeInicio, seoDelInicio, seoDePagina, seoDePaginas } from "@/lib/seo"

const todos = [
  { ruta: "/", ...seoDelInicioConSufijo() },
  ...Object.entries(seoDePaginas).map(([ruta, texto]) => ({ ruta: `/${ruta}`, ...texto })),
  ...Object.entries(seoDeCategorias).map(([slug, texto]) => ({ ruta: `/categorias/${slug}`, ...texto })),
  ...Object.entries(seoDeEstadias).map(([slug, texto]) => ({ ruta: `/estadia/${slug}`, ...texto })),
]

function seoDelInicioConSufijo() {
  return { titulo: seoDelInicio.titulo, descripcion: seoDelInicio.descripcion, completo: seoDelInicio.titulo }
}

const completo = (item: { ruta: string; titulo: string; completo?: string }) => item.completo ?? `${item.titulo} · Lago La Candelaria`

describe("textos de SEO", () => {
  it("cada categoría y cada estadía del sitio tiene los suyos", () => {
    expect(categories.map((categoria) => categoria.slug).sort()).toEqual(Object.keys(seoDeCategorias).sort())
    expect(stays.map((estadia) => estadia.slug).sort()).toEqual(Object.keys(seoDeEstadias).sort())
  })

  it("los títulos entran en el resultado de búsqueda (hasta 62 caracteres con el nombre)", () => {
    for (const item of todos) expect(completo(item).length, item.ruta).toBeLessThanOrEqual(62)
  })

  it("las descripciones tienen un largo útil (110 a 160 caracteres)", () => {
    for (const item of todos) {
      expect(item.descripcion.length, item.ruta).toBeGreaterThanOrEqual(110)
      expect(item.descripcion.length, item.ruta).toBeLessThanOrEqual(160)
    }
  })

  it("no hay dos páginas con el mismo título ni la misma descripción", () => {
    expect(new Set(todos.map(completo)).size).toBe(todos.length)
    expect(new Set(todos.map((item) => item.descripcion)).size).toBe(todos.length)
  })

  it("el inicio nombra el lugar y el rubro", () => {
    expect(seoDelInicio.titulo).toMatch(/Tristán Suárez/)
    expect(seoDelInicio.descripcion).toMatch(/Ezeiza/)
  })
})

describe("imágenes al compartir", () => {
  it("toda página trae imagen; las fichas, su portada", () => {
    expect(imagenDePagina("/actividades", "x").url).toBe("/opengraph-image.jpg")
    for (const ruta of rutasConPortada) expect(imagenDePagina(ruta, "x").url, ruta).toMatch(/^\/img\/.*\.jpg$/)
    expect(seoDePagina({ titulo: "A", descripcion: "B", ruta: "/categorias/lago" }).openGraph?.images).toHaveLength(1)
  })

  it("el inicio usa el nombre completo como título y su imagen", () => {
    const meta = seoDeInicio()
    expect(meta.title).toEqual({ absolute: seoDelInicio.titulo })
    expect(meta.alternates?.canonical).toBe("/")
    expect(meta.openGraph?.images).toHaveLength(1)
  })
})

describe("seoDePagina", () => {
  it("copia título y descripción a la vista previa y fija la canonical", () => {
    const meta = seoDePagina({ titulo: "Bungalows con vista al lago", descripcion: "Texto.", ruta: "/estadia/bungalows" })
    expect(meta.alternates?.canonical).toBe("/estadia/bungalows")
    expect(meta.openGraph).toMatchObject({ title: "Bungalows con vista al lago · Lago La Candelaria", description: "Texto.", url: "/estadia/bungalows", locale: "es_AR" })
    expect(meta.twitter).toMatchObject({ title: "Bungalows con vista al lago · Lago La Candelaria" })
  })
})
