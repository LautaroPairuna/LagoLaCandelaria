import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { activities } from "@/lib/activities"
import { activityRedirects } from "@/lib/categories"

export function generateStaticParams() {
  return activities.map((activity) => ({ slug: activity.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const activity = activities.find((item) => item.slug === slug)
  if (!activity) return { title: "Actividad" }
  return {
    title: activity.name,
    description: activity.summary,
  }
}

export default async function LegacyActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const href = activityRedirects[slug]
  if (!href) notFound()
  redirect(href)
}
