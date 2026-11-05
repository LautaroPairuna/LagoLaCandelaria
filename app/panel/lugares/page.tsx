import type { Metadata } from "next"

import { VistaDeLugares } from "@/components/panel/vista-lugares"
import { exigirPanel } from "@/lib/panel/sesion"

export const metadata: Metadata = { title: "Lugares" }

export default async function PanelLugares({ searchParams }: PageProps<"/panel/lugares">) {
  await exigirPanel("lugares")
  return <VistaDeLugares params={await searchParams} ruta="/panel/lugares" />
}
