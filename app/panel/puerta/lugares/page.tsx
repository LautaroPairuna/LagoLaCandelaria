import type { Metadata } from "next"

import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { VistaDeLugares } from "@/components/panel/vista-lugares"
import { exigirPanel } from "@/lib/panel/sesion"
import { esFechaIso } from "@/lib/predio/fechas"

export const metadata: Metadata = { title: "Lugares · Puerta" }

export default async function LugaresDePuerta({ searchParams }: PageProps<"/panel/puerta/lugares">) {
  await exigirPanel("puerta", "lugares")
  const params = await searchParams
  const fecha = typeof params.fecha === "string" && esFechaIso(params.fecha) ? params.fecha : undefined
  return <VistaDeLugares params={params} ruta="/panel/puerta/lugares" arriba={<PestanasDePuerta activa="lugares" fecha={fecha} />} />
}
