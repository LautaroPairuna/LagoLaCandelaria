import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Foto } from "@/components/foto"
import { PageHero } from "@/components/page-hero"
import { FlujoFamilia } from "@/components/reserva-nueva/flujo-familia"
import { FlujoVisita, type PlatoDeCarta } from "@/components/reserva-nueva/flujo-visita"
import { FormularioGrupo } from "@/components/reserva-nueva/formulario-grupo"
import { ListaEstudiantil } from "@/components/reserva-nueva/lista-estudiantil"
import { menuDelLocal } from "@/lib/panel/cuentas"
import { buscarPropuesta, buscarPropuestaEstudiantil, destinoDeVisitaVieja, profesDeAventura, propuestas, type Opcion, type Propuesta } from "@/lib/propuestas"
import { enlaceWhatsappDelPredio } from "@/lib/site"
import { seoDePagina, seoDePaginas } from "@/lib/seo"

export const metadata = seoDePagina({ ...seoDePaginas.reserva, ruta: "/reserva" })

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
  const estudiantil = propuesta?.id === "estudiantil" ? buscarPropuestaEstudiantil(primero(params.opcion)) : undefined
  const finde = propuesta?.id === "familia" && !opcion
  const bungalows = propuesta?.id === "bungalows"
  const carta = finde ? await cargarCarta() : []
  const enDetalle = Boolean(opcion || estudiantil)

  return (
    <main className="bg-foam text-ink">
      <PageHero
        kicker="Reserva"
        title={opcion ? <>{opcion.nombre}</> : estudiantil ? <>{estudiantil.titulo}</> : propuesta ? <>{propuesta.nombre}</> : <>¿Qué quieren reservar?</>}
      >
        {estudiantil
          ? `${estudiantil.seccion}. Completá los datos del grupo y el predio arma el presupuesto.`
          : (opcion?.detalle ?? propuesta?.detalle ?? "Elegí la propuesta. Después, la fecha y los datos. Al final te queda un ticket con QR.")}
      </PageHero>

      <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">
        {propuesta ? (
          <Link
            href={enDetalle ? `/reserva?propuesta=${propuesta.id}` : "/reserva"}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {enDetalle ? `Volver a ${propuesta.nombre.toLowerCase()}` : "Volver a las propuestas"}
          </Link>
        ) : null}

        {!propuesta ? (
          <Tarjetas items={propuestas.map((item) => ({ ...item, href: `/reserva?propuesta=${item.id}` }))} />
        ) : finde ? (
          <FlujoVisita tipo="finde" carta={carta} />
        ) : bungalows ? (
          <FlujoVisita tipo="bungalow" />
        ) : estudiantil ? (
          <FormularioGrupo tipo="CAMPAMENTO" modalidad={estudiantil.titulo} />
        ) : propuesta.id === "estudiantil" && !opcion ? (
          <ListaEstudiantil />
        ) : !opcion ? (
          <>
            {propuesta.id === "aventura" ? <h2 className="font-display mb-5 text-3xl tracking-tight">¿Qué actividad querés realizar?</h2> : null}
            <Tarjetas items={propuesta.opciones.map((item) => ({ ...item, href: hrefDeOpcion(propuesta, item) }))} />
          </>
        ) : (
          <Flujo opcion={opcion} />
        )}
      </section>
    </main>
  )
}

async function cargarCarta(): Promise<PlatoDeCarta[]> {
  try {
    const items = await menuDelLocal("RESTAURANTE", true)
    return items.map(({ id, categoria, nombre, descripcion, precio }) => ({ id, categoria, nombre, descripcion, precio }))
  } catch {
    return []
  }
}

function hrefDeOpcion(propuesta: Propuesta, opcion: Opcion) {
  if (opcion.flujo === "whatsapp") return enlaceWhatsappDelPredio("Hola, quiero reservar una mesa en el restaurante.")
  return `/reserva?propuesta=${propuesta.id}&opcion=${opcion.id}`
}

function Flujo({ opcion }: { opcion: Opcion }) {
  if (opcion.flujo === "dia") return <FlujoFamilia lugar={opcion.lugar} />
  if (opcion.flujo === "nado") return <FlujoVisita tipo="nado" />
  if (opcion.flujo === "profes") return <Profes />
  if (opcion.flujo === "grupo" && (opcion.modulo === "CAMPAMENTO" || opcion.modulo === "SALIDA_EDUCATIVA" || opcion.modulo === "VIAJE_EGRESADOS" || opcion.modulo === "ACTIVIDAD_AVENTURA")) {
    return <FormularioGrupo tipo={opcion.modulo} modalidad={opcion.modalidad} />
  }
  return null
}

function Profes() {
  return (
    <div className="max-w-2xl rounded-[1.6rem] border border-ink/10 bg-white p-6">
      <p className="text-lg leading-relaxed">Kayak, senderismo, trail running y escalada deportiva se coordinan directamente con nuestros profes. Escribiles y arman la actividad para tu grupo.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {profesDeAventura.map((profe) => (
          <li key={profe.whatsapp}>
            <a
              href={`https://wa.me/${profe.whatsapp}?text=${encodeURIComponent("Hola, quiero coordinar una actividad en Lago La Candelaria.")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-foam px-4 py-4 hover:border-[#25a95a]"
            >
              <MessageCircle className="size-6 text-[#25a95a]" aria-hidden />
              <span>
                <span className="block font-display text-2xl tracking-tight">{profe.nombre}</span>
                <span className="text-ink/70 tabular-nums">{profe.telefono}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
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
