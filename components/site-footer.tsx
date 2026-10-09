import Link from "next/link"

import { LogoMark } from "@/components/logo-mark"
import { hectares, nav, pages, phones, place } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="footer-cream relative z-20 overflow-hidden text-ink">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 480"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path d="M-60 52C180 140 360-16 600 96C840 208 1020 8 1280 110" stroke="#9acd32" strokeOpacity="0.42" strokeWidth="1.3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M-60 220C220 90 460 320 720 160C980 0 1100 260 1280 150" stroke="#ff7a14" strokeOpacity="0.36" strokeWidth="1.15" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M200-50C130 100 320 160 230 280C140 400 380 450 300 530" stroke="#5daa4f" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M1280-24C1060 80 1180 190 960 270C740 350 1120 410 1280 520" stroke="#ff7a14" strokeOpacity="0.32" strokeWidth="1.35" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M-60 400C240 320 460 490 740 360C1020 230 1100 470 1280 390" stroke="#5daa4f" strokeOpacity="0.34" strokeWidth="1.1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative z-10 mx-auto grid max-w-[1120px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <LogoMark className="size-16" />
          <p className="font-display mt-5 max-w-sm text-3xl leading-tight tracking-tight">
            El lago, la altura y la mesa. En ese orden, o en el que ustedes traigan.
          </p>
          <p className="mt-4 text-sm text-text-muted">
            {place}. {hectares} de predio recreativo. La visita es con reserva.
          </p>
        </div>
        <div>
          <p className="kicker text-lime-ink">
            <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-lime align-[1px]" />
            Recorrido
          </p>
          <ul className="mt-4 space-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink hover:text-orange">
                  {item.label}
                </Link>
              </li>
            ))}
            {pages.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink hover:text-orange">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/reserva" className="text-ink hover:text-orange">
                Reserva
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="kicker kicker-orange">
            <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-orange align-[1px]" />
            Teléfono
          </p>
          <ul className="mt-4 space-y-2">
            {phones.map((phone) => (
              <li key={phone.href}>
                <a href={phone.href} className="font-display text-2xl text-orange hover:text-orange-hover">
                  {phone.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-xs text-sm text-text-muted">
            La solicitud muestra un total estimado. El predio confirma la fecha y el importe.
          </p>
        </div>
      </div>
      <div className="relative z-10 border-t border-line">
        <p className="mx-auto max-w-[1120px] px-5 py-4 text-xs tracking-wide text-text-muted md:px-8">
          Lago La Candelaria · Aventura
        </p>
      </div>
    </footer>
  )
}
