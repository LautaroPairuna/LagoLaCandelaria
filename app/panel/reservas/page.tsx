import { redirect } from "next/navigation"

/// Reservas ahora es la primera pestaña de Puerta: se busca desde ahí, en todas las fechas.
export default async function PanelReservas({ searchParams }: PageProps<"/panel/reservas">) {
  const { q } = await searchParams
  const texto = Array.isArray(q) ? q[0] : q
  redirect(texto ? `/panel/puerta?${new URLSearchParams({ q: texto })}` : "/panel/puerta")
}
