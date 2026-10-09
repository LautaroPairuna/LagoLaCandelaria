import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { FormularioIngreso } from "@/app/ingresar/formulario"
import { LogoMark } from "@/components/logo-mark"
import { sesionActual } from "@/lib/panel/sesion"

export const metadata: Metadata = {
  title: "Ingresar al panel",
  robots: { index: false, follow: false },
}

export default async function IngresarPage() {
  if (await sesionActual()) redirect("/panel")

  return (
    <main className="flex min-h-svh items-center justify-center bg-foam px-5 py-16 text-ink">
      <div className="w-full max-w-sm">
        <LogoMark priority className="size-20" />
        <p className="kicker mt-6">Lago La Candelaria</p>
        <h1 className="font-display mt-2 text-4xl tracking-tight">Panel del predio</h1>
        <p className="mt-2 text-ink/70">Entrá con el usuario que te dio la administración.</p>
        <FormularioIngreso />
      </div>
    </main>
  )
}
