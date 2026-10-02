import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryDetail } from "@/components/category-detail"
import { getStay, stays } from "@/lib/categories"

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
  return {
    title: stay.title,
    description: stay.summary,
  }
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
