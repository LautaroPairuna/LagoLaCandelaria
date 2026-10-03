import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Foto } from "@/components/foto"
import { PageHero } from "@/components/page-hero"
import { FlujoFamilia } from "@/components/reserva-nueva/flujo-familia"
import { FormularioGrupo } from "@/components/reserva-nueva/formulario-grupo"
import { buscarPropuesta, destinoDeVisitaVieja, propuestas, type Opcion, type Propuesta } from "@/lib/propuestas"
import { enlaceWhatsappDelPredio } from "@/lib/site"

export const metadata: Metadata = {
  title: "Reserva",
  description:
    "Reservá en Lago La Candelaria: finde en familia con parrilla, playa o bungalow, propuestas estudiantiles y actividades de aventura. Te queda un ticket con QR.",
}

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

export default async function ReservaPage({ searchParams }: PageProps<"/reserva">) {
  const params = await searchParams
  const propuesta = buscarPropuesta(primero(params.propuesta))
  if (!propuesta) {
    const destino = destinoDeVisitaVieja(primero(params.visita) ?? primero(params.interes))
    if (destino) redirect(destino)
  }
  const opcion = propuesta?.opciones.find((item) => item.id === primero(params.opcion))

  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Reserva" title={opcion ? <>{opcion.nombre}</> : propuesta ? <>{propuesta.nombre}</> : <>¿Qué quieren reservar?</>}>
        {opcion?.detalle ?? propuesta?.detalle ?? "Elegí la propuesta. Después, la fecha y los datos. Al final te queda un ticket con QR."}
      </PageHero>

      <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">
        {propuesta ? (
          <Link
            href={opcion ? `/reserva?propuesta=${propuesta.id}` : "/reserva"}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {opcion ? `Volver a ${propuesta.nombre.toLowerCase()}` : "Volver a las propuestas"}
          </Link>
        ) : null}

        {!propuesta ? (
          <Tarjetas items={propuestas.map((item) => ({ ...item, href: `/reserva?propuesta=${item.id}` }))} />
        ) : !opcion ? (
          <Tarjetas items={propuesta.opciones.map((item) => ({ ...item, href: hrefDeOpcion(propuesta, item) }))} />
        ) : (
          <Flujo opcion={opcion} />
        )}
      </section>
    </main>
  )
}

function hrefDeOpcion(propuesta: Propuesta, opcion: Opcion) {
  if (opcion.flujo === "whatsapp") return enlaceWhatsappDelPredio("Hola, quiero reservar una mesa en el restaurante.")
  return `/reserva?propuesta=${propuesta.id}&opcion=${opcion.id}`
}

function Flujo({ opcion }: { opcion: Opcion }) {
  if (opcion.flujo === "dia") return <FlujoFamilia modo="dia" lugar={opcion.lugar} />
  if (opcion.flujo === "bungalow") return <FlujoFamilia modo="bungalow" />
  if (opcion.flujo === "grupo" && opcion.modulo && opcion.modulo !== "FINDE_FAMILIA" && opcion.modulo !== "BUNGALOW" && opcion.modulo !== "RESTAURANTE") {
    return <FormularioGrupo tipo={opcion.modulo} modalidad={opcion.modalidad} />
  }
  return null
}

function Tarjetas({ items }: { items: { id: string; nombre: string; detalle: string; foto: string; href: string; flujo?: Opcion["flujo"] }[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const externo = item.flujo === "whatsapp"
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              target={externo ? "_blank" : undefined}
              rel={externo ? "noreferrer" : undefined}
              className="group block h-full overflow-hidden rounded-[1.6rem] border border-ink/10 bg-white shadow-[0_12px_32px_rgba(58,53,48,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(58,53,48,0.12)]"
            >
              <span className="relative block aspect-[4/3] overflow-hidden">
                <Foto src={item.foto} alt="" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              </span>
              <span className="block p-5">
                <span className="font-display flex items-center justify-between gap-3 text-3xl tracking-tight">
                  {item.nombre}
                  {externo ? <MessageCircle className="size-6 text-[#25a95a]" aria-hidden /> : <ArrowRight className="size-6 text-orange" aria-hidden />}
                </span>
                <span className="mt-2 block leading-relaxed text-ink/70">{item.detalle}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
