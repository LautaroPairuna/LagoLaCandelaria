import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { ultimosCambios } from "@/lib/contenido/leer"
import { grupos, registro, type Grupo } from "@/lib/contenido/registro"
import { exigirPanel } from "@/lib/panel/sesion"

export const metadata: Metadata = { title: "Sitio web" }

const fecha = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })

export default async function SitioWeb() {
  await exigirPanel("sitio")
  const cambios = await ultimosCambios()
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Sitio web</p>
      <h1 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">Lo que se ve en la página</h1>
      <p className="mt-2 max-w-2xl text-sm text-panel-muted">Elegí qué parte querés cambiar. Lo que guardes se ve en la página al instante.</p>

      {(Object.keys(grupos) as Grupo[]).map((grupo) => (
        <section key={grupo} aria-labelledby={`grupo-${grupo}`} className="mt-8">
          <h2 id={`grupo-${grupo}`} className="font-display text-2xl tracking-tight">
            {grupos[grupo]}
          </h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {registro
              .filter((definicion) => definicion.grupo === grupo)
              .map((definicion) => {
                const cambio = cambios.get(definicion.clave)
                return (
                  <li key={definicion.clave}>
                    <Link
                      href={`/panel/sitio/${definicion.clave}`}
                      className="group flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)] hover:ring-2 hover:ring-panel-naranja/40"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-display text-xl tracking-tight">{definicion.nombre}</span>
                        <ArrowRight className="size-5 shrink-0 text-panel-tostado transition group-hover:translate-x-1" aria-hidden />
                      </span>
                      <span className="mt-2 flex-1 text-sm text-panel-muted">{definicion.descripcion}</span>
                      <span className="mt-3 text-xs font-semibold text-panel-muted">
                        {cambio ? `Cambiado el ${fecha.format(cambio.actualizadoEn)}${cambio.actualizadoPor ? ` por ${cambio.actualizadoPor}` : ""}` : "Con el texto original"}
                      </span>
                    </Link>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </main>
  )
}
