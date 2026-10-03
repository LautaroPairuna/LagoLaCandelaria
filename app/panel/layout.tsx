import type { Metadata } from "next"

import { salir } from "@/app/ingresar/acciones"
import { LogoMark } from "@/components/logo-mark"
import { NavegacionPanel } from "@/components/panel/navegacion"
import { panelesDe } from "@/lib/panel/roles"
import { exigirSesion } from "@/lib/panel/sesion"

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel · Lago La Candelaria" },
  robots: { index: false, follow: false },
}

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const sesion = await exigirSesion()
  const paneles = panelesDe(sesion.user.role).map(({ id, nombre, href, listo }) => ({ id, nombre, href, listo }))

  return (
    <div className="min-h-svh bg-panel text-panel-ink">
      <aside className="sticky top-0 z-30 flex flex-col gap-3 bg-panel-ink px-4 py-3 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:gap-5 lg:overflow-y-auto lg:py-6">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10 lg:size-11" />
          <p className="font-display text-lg leading-tight">
            Lago La
            <br />
            Candelaria
          </p>
          <form action={salir} className="ml-auto lg:hidden">
            <button type="submit" className="text-sm text-white/80 underline-offset-4 hover:underline">
              Salir
            </button>
          </form>
        </div>
        <NavegacionPanel paneles={paneles} />
        <div className="mt-auto hidden border-t border-white/15 pt-4 text-sm lg:block">
          <p className="font-semibold">{sesion.user.name}</p>
          <p className="truncate text-white/60">{sesion.user.email}</p>
          <form action={salir} className="mt-3">
            <button type="submit" className="text-white/80 underline-offset-4 hover:underline">
              Salir
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-60">{children}</div>
    </div>
  )
}
