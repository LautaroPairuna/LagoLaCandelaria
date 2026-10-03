import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryDetail } from "@/components/category-detail"
import { categories, getCategory } from "@/lib/categories"

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return { title: "Actividades" }
  return {
    title: category.title,
    description: category.summary,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const others = categories.filter((item) => item.slug !== category.slug)

  return (
    <main>
      <CategoryDetail category={category} others={others} compact />
    </main>
  )
}
