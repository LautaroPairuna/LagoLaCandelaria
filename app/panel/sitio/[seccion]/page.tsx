import { ArrowLeft, ExternalLink } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EditorDeSeccion } from "@/components/panel/sitio/editor"
import { carpetaDeSubidas } from "@/lib/subidas"
import { contenidoDelSitio, ultimosCambios } from "@/lib/contenido/leer"
import { definicionDe, grupos } from "@/lib/contenido/registro"
import { fotosDelSitio } from "@/lib/fotos"
import { exigirPanel } from "@/lib/panel/sesion"

export const metadata: Metadata = { title: "Editar el sitio" }

export default async function EditarSeccion({ params }: PageProps<"/panel/sitio/[seccion]">) {
  await exigirPanel("sitio")
  const { seccion: clave } = await params
  const seccion = definicionDe(clave)
  if (!seccion) notFound()
  const [contenido, cambios] = await Promise.all([contenidoDelSitio(), ultimosCambios()])

  return (
    <main className="px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-28">
      <Link href="/panel/sitio" className="inline-flex items-center gap-2 text-sm font-semibold text-panel-muted hover:text-panel-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver al sitio web
      </Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Sitio web · {grupos[seccion.grupo]}</p>
          <h1 className="font-display mt-1 text-3xl tracking-tight md:text-4xl">{seccion.nombre}</h1>
          <p className="mt-1 max-w-2xl text-sm text-panel-muted">{seccion.descripcion}</p>
        </div>
        <a href={seccion.dondeSeVe} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-panel-tostado hover:underline">
          Ver en la página
          <ExternalLink className="size-4" aria-hidden />
        </a>
      </header>
      <EditorDeSeccion
        clave={clave}
        campos={seccion.campos}
        valor={contenido.porClave[clave] as Record<string, unknown>}
        guardado={cambios.has(clave)}
        fotosDelSitio={fotosDelSitio()}
        puedeSubir={carpetaDeSubidas() !== null}
      />
    </main>
  )
}
