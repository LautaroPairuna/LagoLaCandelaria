import type { Metadata } from "next"

import { PaginaDeMenu } from "@/components/panel/local/paginas"
import { locales } from "@/lib/panel/local"

export const metadata: Metadata = { title: "Menú del restaurante" }

export default function MenuDelRestaurante() {
  return <PaginaDeMenu local={locales.RESTAURANTE} />
}
