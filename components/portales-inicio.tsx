import Link from "next/link"

import { cn } from "cn"

export const accesosInicio = [
  { href: "/mi-reserva", id: "mi-reserva", titulo: "Ver mi reserva" },
  { href: "/cotizar", id: "cotizar", titulo: "Cotizar" },
  { href: "/#como-reservar", id: "como-reservar", titulo: "Reservar", destacado: true },
  { href: "/#mas-informacion", id: "mas-informacion", titulo: "Más información", oculto: " sobre el predio" },
] as const

/// En escritorio este punto marca el origen de la navegación que se acopla al header.
/// En pantallas chicas conserva los cuatro accesos dentro del hero.
export function PortalesInicio() {
  return (
    <>
      <div id="home-portal-anchor" aria-hidden className="mx-auto hidden h-16 w-[min(100%,47rem)] lg:block" />
      <ul className="mx-auto grid w-full max-w-[32rem] grid-cols-2 gap-3 sm:gap-4 lg:hidden">
        {accesosInicio.map((acceso) => (
          <li key={acceso.titulo} className="min-w-0">
            <Link
              href={acceso.href}
              className={cn(
                "button-outline inline-flex min-h-16 w-full items-center justify-center rounded-full px-3 py-3 text-center text-lg leading-tight font-extrabold transition sm:h-16 sm:px-5 sm:text-xl",
                "destacado" in acceso && acceso.destacado
                  ? "bg-orange text-sobre-naranja shadow-[0_10px_24px_rgba(20,25,20,0.24)]"
                  : "bg-cream text-ink shadow-[0_12px_32px_rgba(20,25,20,0.34)]",
              )}
            >
              {acceso.titulo}
              {"oculto" in acceso ? <span className="sr-only">{acceso.oculto}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
