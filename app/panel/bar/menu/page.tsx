import type { Metadata } from "next"

import { PaginaDeMenu } from "@/components/panel/local/paginas"
import { locales } from "@/lib/panel/local"

export const metadata: Metadata = { title: "Menú del bar" }

export default function MenuDelBar() {
  return <PaginaDeMenu local={locales.BAR} />
}
