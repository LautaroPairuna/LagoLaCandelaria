import { Settings } from "lucide-react"
import Link from "next/link"

import { LogoMark } from "@/components/logo-mark"

export function SiteFooter() {
  return (
    <footer className="footer-cream relative z-20 border-t border-ink/8 text-ink">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center px-5 py-10 text-center md:px-8 md:py-12">
        <LogoMark className="size-16" />
        <p className="mt-3 text-xs font-bold tracking-[0.16em] uppercase">Lago La Candelaria</p>
        <p className="font-display mt-3 max-w-xl text-2xl leading-tight tracking-tight sm:text-3xl">
          Aventura y descanso entre amigos y familia.
        </p>
        <span aria-hidden className="mt-6 h-px w-16 bg-orange/45" />
        <p className="mt-4 text-sm text-ink/55">Nos vemos junto al lago.</p>
      </div>
      <Link
        href="/panel"
        rel="nofollow"
        aria-label="Acceder al panel interno"
        title="Panel interno"
        className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full border border-ink/10 bg-white/70 text-ink/45 shadow-sm backdrop-blur transition hover:border-ink/20 hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange md:right-6 md:bottom-5"
      >
        <Settings className="size-4" aria-hidden />
      </Link>
    </footer>
  )
}
