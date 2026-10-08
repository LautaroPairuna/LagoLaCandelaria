import type { Metadata } from "next"

import { CajaDelLocal } from "@/components/panel/local/caja-del-local"
import { locales } from "@/lib/panel/local"

export const metadata: Metadata = { title: "Caja del restaurante" }

export default async function Caja({ searchParams }: PageProps<"/panel/caja/restaurante">) {
  return <CajaDelLocal local={locales.RESTAURANTE} contexto="general" params={await searchParams} />
}
