import type { Metadata } from "next"

import { AsistenteReserva, type SugerenciaReserva } from "@/components/reserva/asistente"
import { PageHero } from "@/components/page-hero"

export const metadata: Metadata = {
  title: "Reserva",
  description:
    "Armá la solicitud de reserva de Lago La Candelaria paso a paso. Al confirmar te queda un ticket con código QR.",
}

function sugerenciaDe(visita: string | undefined): SugerenciaReserva | undefined {
  if (visita === "campamento" || visita === "egresados" || visita === "educativa") {
    return { tipo: "estudiantil" }
  }
  if (visita === "bungalows") return { tipo: "familiar", estadia: "noche" }
  if (visita === "restaurante") return { tipo: "familiar", restaurante: "si" }
  if (visita === "familia") return { tipo: "familiar", estadia: "dia" }
  return undefined
}

export default async function ReservaPage({
  searchParams,
}: {
  searchParams: Promise<{ visita?: string | string[] }>
}) {
  const params = await searchParams
  const visita = Array.isArray(params.visita) ? params.visita[0] : params.visita

  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Reserva" title={<>Reservá, paso por paso</>}>
        En el recuadro naranja elegís y completás cada paso. A la derecha vas viendo lo que cargás y el total de la reserva.
      </PageHero>

      <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">
        <AsistenteReserva sugerencia={sugerenciaDe(visita)} />
      </section>
    </main>
  )
}
