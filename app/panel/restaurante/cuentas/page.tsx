import type { Metadata } from "next"

import { PaginaDeCuentas } from "@/components/panel/local/paginas"
import { locales } from "@/lib/panel/local"

export const metadata: Metadata = { title: "Cuentas del restaurante" }

export default async function CuentasDelRestaurante({ searchParams }: PageProps<"/panel/restaurante/cuentas">) {
  const { fecha } = await searchParams
  return <PaginaDeCuentas local={locales.RESTAURANTE} fechaPedida={Array.isArray(fecha) ? fecha[0] : fecha} />
}
