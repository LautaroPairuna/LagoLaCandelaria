import { redirect } from "next/navigation"

import { salir } from "@/app/ingresar/acciones"
import { panelesDe } from "@/lib/panel/roles"
import { exigirSesion } from "@/lib/panel/sesion"

export default async function PanelInicio() {
  const sesion = await exigirSesion()
  const primero = panelesDe(sesion.user.role).find((panel) => panel.listo)
  if (primero) redirect(primero.href)

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-display text-4xl tracking-tight">Todavía no tenés un panel habilitado</h1>
      <p className="mt-3 text-panel-muted">
        Tu usuario existe, pero el panel que te toca todavía está en construcción o no tenés uno asignado. Pedile a la
        administración que lo revise.
      </p>
      <form action={salir} className="mt-6">
        <button type="submit" className="font-semibold underline underline-offset-4">
          Salir
        </button>
      </form>
    </main>
  )
}
