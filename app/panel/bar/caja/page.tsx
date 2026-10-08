import type { Metadata } from "next"

import { CajaDelLocal } from "@/components/panel/local/caja-del-local"
import { locales } from "@/lib/panel/local"

export const metadata: Metadata = { title: "Caja del bar" }

export default async function Caja({ searchParams }: PageProps<"/panel/bar/caja">) {
  return <CajaDelLocal local={locales.BAR} contexto="local" params={await searchParams} />
}
