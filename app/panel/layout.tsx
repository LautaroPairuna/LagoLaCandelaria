import { ArrowLeft, Globe, LogOut } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { salir } from "@/app/ingresar/acciones"
import { LogoMark } from "@/components/logo-mark"
import { NavegacionPanel } from "@/components/panel/navegacion"
import { etiquetaDeRol, panelesDe, rolesDe } from "@/lib/panel/roles"
import { exigirSesion } from "@/lib/panel/sesion"

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel · Lago La Candelaria" },
  robots: { index: false, follow: false },
}

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join("")
}

const accionDeBarra = "grid size-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const sesion = await exigirSesion()
  const paneles = panelesDe(sesion.user.role).map(({ id, nombre, href, listo }) => ({ id, nombre, href, listo }))
  const rol = rolesDe(sesion.user.role).map((item) => etiquetaDeRol[item]).join(" · ")

  return (
    <div className="min-h-svh bg-panel text-panel-ink">
      <aside className="sticky top-0 z-30 flex flex-col gap-3 bg-panel-ink px-3 py-3 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:gap-6 lg:overflow-y-auto lg:px-4 lg:py-6">
        <div className="flex items-center gap-1">
          <Link href="/panel" className="flex min-w-0 items-center gap-3 rounded-xl p-1 hover:bg-white/5">
            <LogoMark className="size-10 shrink-0 lg:size-11" />
            <span>
              <span className="font-display block text-lg leading-tight">
                Lago La <br className="hidden lg:block" />
                Candelaria
              </span>
              <span className="mt-0.5 hidden text-[0.65rem] font-bold tracking-[0.14em] whitespace-nowrap text-white/50 uppercase lg:block">Panel interno</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center lg:hidden">
            <Link href="/" className={accionDeBarra} aria-label="Volver al sitio" title="Volver al sitio">
              <Globe className="size-5" aria-hidden />
            </Link>
            <form action={salir}>
              <button type="submit" className={accionDeBarra} aria-label="Salir" title="Salir">
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-2">
          <p className="hidden px-3 text-[0.7rem] font-bold tracking-[0.16em] text-white/45 uppercase lg:block">Paneles</p>
          <NavegacionPanel paneles={paneles} />
        </div>

        <div className="mt-auto hidden space-y-4 lg:block">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver al sitio
          </Link>
          <div className="flex items-center gap-3 border-t border-white/15 pt-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-panel-naranja text-sm font-bold text-white" aria-hidden>
              {iniciales(sesion.user.name)}
            </span>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{sesion.user.name}</p>
              <p className="truncate text-xs text-white/60">{rol}</p>
            </div>
          </div>
          <form action={salir}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
              Salir
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-60">{children}</div>
    </div>
  )
}
