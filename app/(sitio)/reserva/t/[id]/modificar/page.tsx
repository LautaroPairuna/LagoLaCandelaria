import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHero } from "@/components/page-hero"
import { FlujoVisita, type DatosParaModificar, type PlatoDeCarta, type TipoDeVisita } from "@/components/reserva-nueva/flujo-visita"
import { diasEspeciales } from "@/lib/disponibilidad"
import { menuDelLocal } from "@/lib/panel/cuentas"
import { tipoDeDia } from "@/lib/predio/calendario"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { hoyEnElPredio } from "@/lib/predio/fechas"
import { ticketDeReserva } from "@/lib/reservas"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Modificar la reserva", robots: { index: false, follow: false } }

const tipoDelModulo: Partial<Record<string, TipoDeVisita>> = { FINDE_FAMILIA: "finde", BUNGALOW: "bungalow", NADO: "nado" }

export default async function ModificarPage({ params }: PageProps<"/reserva/t/[id]/modificar">) {
  const { id } = await params
  if (!/^[a-z0-9]{20,40}$/i.test(id)) notFound()
  const ticket = await ticketDeReserva(id)
  const tipo = ticket ? tipoDelModulo[ticket.modulo] : undefined
  if (!ticket || !tipo) notFound()

  const volver = (
    <Link href={`/reserva/t/${id}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden />
      Volver a la reserva
    </Link>
  )

  if (ticket.estado === "CANCELADA" || ticket.ingresado || ticket.desde < hoyEnElPredio()) {
    return (
      <main className="bg-foam text-ink">
        <PageHero kicker="Modificar" title="Esta reserva ya no se puede cambiar.">
          {ticket.estado === "CANCELADA" ? "Está cancelada: si querés venir, hacé una reserva nueva." : "La visita ya empezó o ya pasó. Si necesitás algo, escribinos por WhatsApp."}
        </PageHero>
        <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">{volver}</section>
      </main>
    )
  }

  const lugarDe = (tipoDeUnidad: string) => ticket.lugares.find((lugar) => lugar.tipo === tipoDeUnidad)
  const ubicacion = lugarDe("PARRILLA") ? "parrilla" : lugarDe("GAZEBO") ? "gazebo" : lugarDe("PALAPA") ? "palapa" : undefined
  const [especiales, carta] = await Promise.all([
    diasEspeciales(ticket.desde, ticket.desde),
    tipo === "finde" ? menuDelLocal("RESTAURANTE", true).catch(() => []) : Promise.resolve([]),
  ])
  const notas = (ticket.notas ?? "").match(/Algo importante: (.*)/)?.[1] ?? ""
  const datos: DatosParaModificar = {
    token: ticket.token,
    fecha: ticket.desde,
    dia: tipoDeDia(ticket.desde, especiales),
    grupo: ticket.grupo,
    titular: { nombre: ticket.titular.nombre, apellido: ticket.titular.apellido, dni: ticket.titular.dni ?? "", notas },
    contacto: { telefono: normalizarTelefono(ticket.contacto.telefono ?? "")?.nacional ?? "", email: ticket.contacto.email ?? "" },
    forma: ticket.formaPago === "EFECTIVO" || ticket.formaPago === "TRANSFERENCIA" ? ticket.formaPago : null,
    ubicacion,
    parrilla: lugarDe("PARRILLA")?.id,
    almuerzo: ticket.almuerzo,
    bungalows: ticket.lugares.filter((lugar) => lugar.tipo === "BUNGALOW").map((lugar) => lugar.id),
    horario: tipo === "nado" ? { desde: Number(ticket.ingreso.slice(0, 2)), hasta: Number(ticket.salida.slice(0, 2)) } : undefined,
    club: ticket.club ?? "",
  }
  const platos: PlatoDeCarta[] = carta.map(({ id: idDelPlato, categoria, nombre, descripcion, precio }) => ({ id: idDelPlato, categoria, nombre, descripcion, precio }))

  return (
    <main className="bg-foam text-ink">
      <PageHero kicker={`Modificar la reserva ${ticket.codigo}`} title="Cambiá lo que necesites.">
        Revisá cada paso y guardá los cambios al final. El código y el QR siguen siendo los mismos.
      </PageHero>
      <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">
        {volver}
        <FlujoVisita tipo={tipo} carta={platos} modificar={datos} />
      </section>
    </main>
  )
}
