import type { Metadata } from "next"

import { PaginaDeCuentas } from "@/components/panel/local/paginas"
import { locales } from "@/lib/panel/local"

export const metadata: Metadata = { title: "Bar" }

export default async function CuentasDelBar({ searchParams }: PageProps<"/panel/bar">) {
  const { fecha } = await searchParams
  return <PaginaDeCuentas local={locales.BAR} fechaPedida={Array.isArray(fecha) ? fecha[0] : fecha} />
}
