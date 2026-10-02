"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type MouseEvent } from "react"
import { MenuIcon } from "lucide-react"

import { ButtonLink } from "@/components/button-link"
import { LogoMark } from "@/components/logo-mark"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { nav, pages, phones } from "@/lib/site"
import { cn } from "cn"

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState("")
  const [path, setPath] = useState(pathname)

  if (path !== pathname) {
    setPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12)
      if (pathname !== "/") {
        setActive("")
        return
      }
      const line = 104
      let current = ""
      for (const item of nav) {
        const node = document.querySelector(`[data-nav="${item.id}"]`)
        if (!(node instanceof HTMLElement)) continue
        const rect = node.getBoundingClientRect()
        if (rect.top <= line && rect.bottom > line) current = item.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [pathname])

  useEffect(() => {
    if (pathname !== "/") return
    const id = window.location.hash.slice(1)
    if (!id) return
    const timer = window.setTimeout(() => scrollToSection(id), 80)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    const onPop = () => {
      const id = window.location.hash.slice(1)
      if (id) scrollToSection(id)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  function onSectionClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    setOpen(false)
    if (pathname !== "/") return
    const node = document.getElementById(id)
    if (!node) return
    event.preventDefault()
    scrollToSection(id)
    window.history.pushState(null, "", `/#${id}`)
    setActive(id)
  }

  const onVideo = pathname === "/" && !scrolled

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,color] duration-300",
        onVideo
          ? "bg-transparent text-cream"
          : "bg-cream text-ink shadow-[0_8px_24px_rgba(58,53,48,0.08)]",
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between gap-4 px-5 md:px-8">
        <Link
          href="/"
          aria-label="Lago La Candelaria, inicio"
          className="flex items-center gap-3"
        >
          <LogoMark priority className="size-16" />
          <span className="hidden text-lg leading-tight font-bold tracking-[0.14em] uppercase xl:block">
            Lago La Candelaria
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => onSectionClick(event, item.id)}
              aria-current={active === item.id ? "true" : undefined}
              className={cn(
                "rounded-full px-3 py-2 text-[1.02rem] font-bold tracking-wide whitespace-nowrap transition-colors xl:px-3.5 xl:text-lg",
                onVideo
                  ? "text-cream hover:bg-white/15 focus-visible:bg-white/15"
                  : "text-ink hover:bg-green-soft focus-visible:bg-green-soft",
                active === item.id && (onVideo ? "bg-white/15" : "bg-green-soft text-lake-ink"),
              )}
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/reserva" className="ml-3 h-14 px-7 text-lg">
            Reservar
          </ButtonLink>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "lg:hidden",
                  onVideo
                    ? "text-cream hover:bg-white/15 focus-visible:bg-white/15"
                    : "text-ink hover:bg-green-soft focus-visible:bg-green-soft",
                )}
              />
            }
          >
            <MenuIcon />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full border-0 bg-cream text-ink data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:border-0 data-[side=right]:sm:max-w-[28rem]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menú</SheetTitle>
              <SheetDescription>
                Recorrido por Lago La Candelaria
              </SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col px-6 pt-16 pb-8">
              <p className="kicker">El predio</p>
              <nav className="mt-6 flex flex-col" aria-label="Móvil">
                {nav.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(event) => onSectionClick(event, item.id)}
                    aria-current={active === item.id ? "true" : undefined}
                    className="flex items-baseline justify-between border-t border-ink/15 py-4"
                  >
                    <span className="font-display text-4xl tracking-tight">
                      {item.label}
                    </span>
                    <span className="text-lake-ink text-xs tracking-[0.16em]">
                      0{index + 1}
                    </span>
                  </Link>
                ))}
              </nav>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {pages.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="text-base font-bold text-lake-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto space-y-4 pt-10">
                <ButtonLink href="/reserva" className="w-full">
                  Reservar el día
                </ButtonLink>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                  {phones.map((phone) => (
                    <a key={phone.href} href={phone.href} className="underline-offset-4 hover:underline">
                      {phone.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
