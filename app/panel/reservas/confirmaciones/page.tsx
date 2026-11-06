import { redirect } from "next/navigation"

/// Las confirmaciones pasaron a Clientes y WhatsApp.
export default async function Confirmaciones({ searchParams }: PageProps<"/panel/clientes">) {
  const { fecha } = await searchParams
  redirect(typeof fecha === "string" ? `/panel/clientes?fecha=${fecha}` : "/panel/clientes")
}
