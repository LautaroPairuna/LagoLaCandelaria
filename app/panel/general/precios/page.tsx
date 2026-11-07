import type { Metadata } from "next"

import { FormularioDePrecios } from "@/components/panel/formulario-de-precios"
import { exigirPanel } from "@/lib/panel/sesion"
import { leerPrecios } from "@/lib/precios"

export const metadata: Metadata = { title: "Precios" }

export default async function PreciosPage() {
  await exigirPanel("general")
  const precios = await leerPrecios()
  return (
    <div>
      <h2 className="font-display text-2xl tracking-tight">Precios</h2>
      <p className="mb-4 text-sm text-panel-muted">
        Los de la web, el cotizador y las reservas que se cargan en el panel. Rigen para las reservas nuevas: las que ya están tomadas conservan su precio. Los de la propuesta estudiantil se
        editan en Sitio web.
      </p>
      <FormularioDePrecios precios={precios} />
    </div>
  )
}
