import type { Metadata } from "next"

import { CajaDelLocal } from "@/components/panel/local/caja-del-local"
import { locales } from "@/lib/panel/local"

export const metadata: Metadata = { title: "Caja del restaurante" }

export default async function Caja({ searchParams }: PageProps<"/panel/restaurante/caja">) {
  return <CajaDelLocal local={locales.RESTAURANTE} contexto="local" params={await searchParams} />
}
