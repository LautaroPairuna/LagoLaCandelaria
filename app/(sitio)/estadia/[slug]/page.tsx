import { MigasJsonLd } from "@/components/migas-json-ld"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryDetail } from "@/components/category-detail"
import { getStay, stays } from "@/lib/categories"
import { seoDeEstadias, seoDePagina } from "@/lib/seo"

export function generateStaticParams() {
  return stays.map((stay) => ({ slug: stay.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const stay = getStay(slug)
  if (!stay) return { title: "Estadía" }
  return seoDePagina({
    ...(seoDeEstadias[slug] ?? { titulo: stay.title, descripcion: stay.summary }),
    ruta: `/estadia/${slug}`,
  })
}

export default async function StayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const stay = getStay(slug)
  if (!stay) notFound()

  const others = stays.filter((item) => item.slug !== stay.slug)

  return (
    <main>
      <MigasJsonLd
        migas={[
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Estadía", ruta: "/estadia" },
          { nombre: stay.title, ruta: `/estadia/${stay.slug}` },
        ]}
      />
      <CategoryDetail
        category={stay}
        others={others}
        collectionHref="/estadia"
        collectionLabel="Estadía"
        othersLabel="Otras formas de quedarse"
        otherBase="/estadia"
        compact
      />
    </main>
  )
}
