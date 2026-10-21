"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { ArrowLeftIcon, MenuIcon } from "lucide-react"

import { LogoMark } from "@/components/logo-mark"
import { accesosInicio } from "@/components/portales-inicio"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { nav } from "@/lib/site"
import { cn } from "cn"

function scrollToSection(id: string) {
  const section = document.getElementById(id)
  if (!section) return
  const focus = section.querySelector<HTMLElement>("[data-scroll-focus]") ?? section
  focus.scrollIntoView({ behavior: "smooth", block: "center" })
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState("")
  const [path, setPath] = useState(pathname)
  const [homeNavReady, setHomeNavReady] = useState(false)
  const [homeLogoReady, setHomeLogoReady] = useState(false)
  const [homeNavDocked, setHomeNavDocked] = useState(pathname !== "/")
  const homeLogoSlotRef = useRef<HTMLDivElement>(null)
  const homeLogoRef = useRef<HTMLAnchorElement>(null)
  const homeNavSlotRef = useRef<HTMLDivElement>(null)
  const homeNavRef = useRef<HTMLElement>(null)

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
    const onHashNavigation = () => {
      const id = window.location.hash.slice(1)
      if (id) window.requestAnimationFrame(() => scrollToSection(id))
    }
    window.addEventListener("popstate", onHashNavigation)
    window.addEventListener("hashchange", onHashNavigation)
    return () => {
      window.removeEventListener("popstate", onHashNavigation)
      window.removeEventListener("hashchange", onHashNavigation)
    }
  }, [])

  useEffect(() => {
    const slot = homeNavSlotRef.current
    const menu = homeNavRef.current
    const logoSlot = homeLogoSlotRef.current
    const logo = homeLogoRef.current
    if (!slot || !menu || !logoSlot || !logo) return

    if (pathname !== "/") {
      menu.style.transform = "none"
      menu.style.opacity = "1"
      logo.style.transform = "none"
      logo.style.opacity = "1"
      const readyFrame = window.requestAnimationFrame(() => {
        setHomeNavReady(true)
        setHomeLogoReady(true)
        setHomeNavDocked(true)
      })
      return () => window.cancelAnimationFrame(readyFrame)
    }

    let frame = 0
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    const positionMenu = () => {
      frame = 0
      const anchor = document.getElementById("home-portal-anchor")
      const logoAnchor = document.getElementById("home-logo-anchor")
      if (!anchor || !logoAnchor) return

      const slotRect = slot.getBoundingClientRect()
      const anchorRect = anchor.getBoundingClientRect()
      const logoSlotRect = logoSlot.getBoundingClientRect()
      const logoAnchorRect = logoAnchor.getBoundingClientRect()
      const viewport = window.innerHeight
      const start = viewport * 0.42
      const end = viewport * 0.94
      const rawProgress = (window.scrollY - start) / (end - start)
      const progress = Math.min(1, Math.max(0, rawProgress))
      const eased = reducedMotion.matches ? (progress >= 0.96 ? 1 : 0) : 1 - Math.pow(1 - progress, 3)
      const fromX = anchorRect.left + anchorRect.width / 2 - (slotRect.left + slotRect.width / 2)
      const fromY = anchorRect.top + anchorRect.height / 2 - (slotRect.top + slotRect.height / 2)
      const logoFromX = logoAnchorRect.left + logoAnchorRect.width / 2 - (logoSlotRect.left + logoSlotRect.width / 2)
      const logoFromY = logoAnchorRect.top + logoAnchorRect.height / 2 - (logoSlotRect.top + logoSlotRect.height / 2)
      const logoStartScale = Math.min(
        logoAnchorRect.width / logoSlotRect.width,
        logoAnchorRect.height / logoSlotRect.height,
        2.2,
      )
      const logoScale = logoStartScale + (1 - logoStartScale) * eased

      menu.style.transform = `translate3d(${fromX * (1 - eased)}px, ${fromY * (1 - eased)}px, 0)`
      menu.style.opacity = "1"
      logo.style.transform = `translate3d(${logoFromX * (1 - eased)}px, ${logoFromY * (1 - eased)}px, 0) scale(${logoScale})`
      logo.style.opacity = "1"
      setHomeNavReady(true)
      setHomeLogoReady(true)

      const nextDocked = progress >= 0.92
      setHomeNavDocked((current) => (current === nextDocked ? current : nextDocked))
    }

    const requestPosition = () => {
      if (!frame) frame = window.requestAnimationFrame(positionMenu)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") requestPosition()
    }

    positionMenu()
    window.addEventListener("scroll", requestPosition, { passive: true })
    window.addEventListener("resize", requestPosition)
    window.addEventListener("pageshow", requestPosition)
    window.addEventListener("popstate", requestPosition)
    document.addEventListener("visibilitychange", onVisibilityChange)
    reducedMotion.addEventListener("change", requestPosition)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", requestPosition)
      window.removeEventListener("resize", requestPosition)
      window.removeEventListener("pageshow", requestPosition)
      window.removeEventListener("popstate", requestPosition)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      reducedMotion.removeEventListener("change", requestPosition)
    }
  }, [pathname])

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

  const onHomeHero = pathname === "/" && !homeNavDocked
  const onVideo = pathname === "/" && !scrolled

  function itemActivo(href: string, id: string) {
    if (href.startsWith("/#")) return active === id
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`)
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,color] duration-300",
        onHomeHero
          ? "bg-transparent text-cream"
          : "bg-cream text-ink shadow-[0_8px_24px_rgba(58,53,48,0.08)]",
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between gap-4 px-5 md:px-8">
        <div ref={homeLogoSlotRef} className="h-16 shrink-0">
          <Link
            ref={homeLogoRef}
            href="/"
            aria-label="Lago La Candelaria, inicio"
            className={cn(
              "home-morph-logo flex h-16 origin-center items-center gap-3 transition-[color,opacity] duration-300 will-change-transform",
              pathname === "/" && !homeLogoReady && "opacity-0",
            )}
          >
            <LogoMark priority className="size-16 shrink-0" />
            <span className="max-w-32 text-xs leading-tight font-bold tracking-[0.12em] uppercase sm:max-w-none sm:text-base sm:tracking-[0.14em] lg:text-lg">
              Lago La Candelaria
            </span>
          </Link>
        </div>

        <div ref={homeNavSlotRef} className="hidden h-16 flex-1 items-center justify-end lg:flex">
          <nav
            ref={homeNavRef}
            className={cn(
              "home-morph-nav flex items-center justify-center gap-3 will-change-transform xl:gap-4",
              pathname === "/" && !homeNavReady && "opacity-0",
            )}
            aria-label="Accesos principales"
          >
            {accesosInicio.map((item) => {
              const destacado = "destacado" in item && item.destacado
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={item.href.startsWith("/#") ? (event) => onSectionClick(event, item.id) : undefined}
                  aria-current={itemActivo(item.href, item.id) ? "true" : undefined}
                  className={cn(
                    "button-outline inline-flex h-14 items-center justify-center rounded-full px-6 text-lg font-extrabold whitespace-nowrap xl:h-16 xl:px-8 xl:text-xl",
                    destacado
                      ? "bg-orange text-white shadow-[0_8px_22px_rgba(20,25,20,0.20)]"
                      : onHomeHero
                        ? "bg-cream text-ink shadow-[0_12px_30px_rgba(20,25,20,0.32)]"
                        : "bg-white text-ink shadow-[0_7px_22px_rgba(58,53,48,0.10)]",
                  )}
                >
                  {item.titulo}
                </Link>
              )
            })}
          </nav>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "size-14 rounded-full transition-[opacity,background-color,color] duration-300 lg:hidden",
                  onHomeHero && "pointer-events-none opacity-0",
                  onVideo
                    ? "text-cream hover:bg-white/15 focus-visible:bg-white/15"
                    : "text-ink hover:bg-green-soft focus-visible:bg-green-soft",
                )}
              />
            }
          >
            <MenuIcon className="size-8" strokeWidth={2.25} />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full border-0 bg-cream text-ink data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:border-0 data-[side=right]:sm:max-w-[28rem]"
          >
            <div className="flex h-full flex-col px-5 pt-5 pb-8 sm:px-7">
              <SheetHeader className="flex-row items-center justify-between gap-4 p-0">
                <div>
                  <SheetTitle className="font-display text-3xl leading-none tracking-tight text-ink">
                    Lago La Candelaria
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Accesos principales del sitio
                  </SheetDescription>
                </div>
                <SheetClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="h-14 shrink-0 gap-2 bg-white px-5 text-base font-extrabold shadow-[0_7px_22px_rgba(58,53,48,0.10)]"
                    />
                  }
                >
                  <ArrowLeftIcon className="size-6" />
                  Volver
                </SheetClose>
              </SheetHeader>
              <nav className="mt-12 grid gap-4" aria-label="Accesos principales">
                {accesosInicio.map((item) => {
                  const destacado = "destacado" in item && item.destacado
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={item.href.startsWith("/#") ? (event) => onSectionClick(event, item.id) : () => setOpen(false)}
                      aria-current={itemActivo(item.href, item.id) ? "true" : undefined}
                      className={cn(
                        "button-outline inline-flex min-h-16 items-center justify-center rounded-full px-6 text-center text-xl font-extrabold",
                        destacado
                          ? "bg-orange text-white shadow-[0_8px_22px_rgba(20,25,20,0.20)]"
                          : "bg-white text-ink shadow-[0_7px_22px_rgba(58,53,48,0.10)]",
                      )}
                    >
                      {item.titulo}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
