import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { ultimosCambios } from "@/lib/contenido/leer"
import { secciones, type ClaveDeSeccion } from "@/lib/contenido/secciones"
import { exigirPanel } from "@/lib/panel/sesion"

export const metadata: Metadata = { title: "Sitio web" }

const proximas = [
  { nombre: "Actividades", detalle: "Las fichas de cada actividad: textos, horarios, seguridad y fotos." },
  { nombre: "Estadías", detalle: "Bungalows, campamentos y dormis." },
  { nombre: "Propuestas estudiantiles", detalle: "Tarifas, comidas y lo que incluye cada propuesta." },
  { nombre: "Reglamentos y horarios", detalle: "Lo que se manda por WhatsApp a quien reserva." },
  { nombre: "Reseñas y ubicación", detalle: "Las opiniones de Google y el mapa." },
]

const fecha = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })

export default async function SitioWeb() {
  await exigirPanel("sitio")
  const cambios = await ultimosCambios()
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Sitio web</p>
      <h1 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">Lo que se ve en la página</h1>
      <p className="mt-2 max-w-2xl text-sm text-panel-muted">Elegí qué parte querés cambiar. Lo que guardes se ve en la página al instante.</p>

      <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(Object.entries(secciones) as [ClaveDeSeccion, (typeof secciones)[ClaveDeSeccion]][]).map(([clave, seccion]) => {
          const cambio = cambios.get(clave)
          return (
            <li key={clave}>
              <Link
                href={`/panel/sitio/${clave}`}
                className="group flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(58,42,24,0.06)] hover:ring-2 hover:ring-panel-naranja/40"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-2xl tracking-tight">{seccion.nombre}</span>
                  <ArrowRight className="size-5 text-panel-tostado transition group-hover:translate-x-1" aria-hidden />
                </span>
                <span className="mt-2 flex-1 text-sm text-panel-muted">{seccion.descripcion}</span>
                <span className="mt-3 text-xs font-semibold text-panel-muted">
                  {cambio ? `Cambiado el ${fecha.format(cambio.actualizadoEn)}${cambio.actualizadoPor ? ` por ${cambio.actualizadoPor}` : ""}` : "Con el texto original"}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <h2 className="font-display mt-10 text-2xl tracking-tight">En la próxima etapa</h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {proximas.map((item) => (
          <li key={item.nombre} className="rounded-3xl border border-dashed border-panel-line p-5">
            <p className="font-semibold">{item.nombre}</p>
            <p className="mt-1 text-sm text-panel-muted">{item.detalle}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
