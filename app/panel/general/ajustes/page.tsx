import type { Metadata } from "next"

import { FormularioDeAjustes } from "@/components/panel/formulario-de-ajustes"
import { leerAjustes } from "@/lib/ajustes"
import { exigirPanel } from "@/lib/panel/sesion"
import { PALAPAS_CARGADAS, PALAPAS_EN_EL_PREDIO } from "@/lib/predio/inventario"

export const metadata: Metadata = { title: "Ajustes de la web" }

export default async function AjustesPage() {
  await exigirPanel("general")
  const ajustes = await leerAjustes()
  return (
    <div>
      <h2 className="font-display text-2xl tracking-tight">Ajustes de la web</h2>
      <p className="mb-4 text-sm text-panel-muted">Lo que se puede cambiar sin tocar el sistema.</p>
      <FormularioDeAjustes ajustes={ajustes} palapasCargadas={PALAPAS_CARGADAS} palapasEnElPredio={PALAPAS_EN_EL_PREDIO} />
    </div>
  )
}
