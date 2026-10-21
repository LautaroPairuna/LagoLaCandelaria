import { redirect } from "next/navigation"

import { buscarPropuesta, buscarPropuestaEstudiantil, destinoDeVisitaVieja } from "@/lib/propuestas"

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor
}

export default async function ReservaPage({ searchParams }: PageProps<"/reserva">) {
  const params = await searchParams
  const propuesta = buscarPropuesta(primero(params.propuesta))

  if (!propuesta) {
    const destinoViejo = destinoDeVisitaVieja(primero(params.visita) ?? primero(params.interes))
    redirect(destinoViejo ?? "/#como-reservar")
  }

  const opcionPedida = primero(params.opcion)
  const opcionValida =
    propuesta.id === "estudiantil"
      ? buscarPropuestaEstudiantil(opcionPedida)?.id
      : propuesta.opciones.find((item) => item.id === opcionPedida)?.id
  const destino = new URLSearchParams({ propuesta: propuesta.id })
  if (opcionValida) destino.set("opcion", opcionValida)

  redirect(`/?${destino.toString()}#como-reservar`)
}
