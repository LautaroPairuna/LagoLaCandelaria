import Link from "next/link"

import { cn } from "cn"

export type PestanaDeClientes = "confirmaciones" | "tickets" | "clientes" | "mensajes"

const pestanas: { id: PestanaDeClientes; nombre: string; href: string }[] = [
  { id: "confirmaciones", nombre: "Confirmaciones", href: "/panel/clientes" },
  { id: "tickets", nombre: "Tickets QR", href: "/panel/clientes/tickets" },
  { id: "clientes", nombre: "Clientes", href: "/panel/clientes/todos" },
  { id: "mensajes", nombre: "Mensajes guardados", href: "/panel/clientes/mensajes" },
]

/// El encabezado de Clientes y WhatsApp con sus pestañas.
export function EncabezadoDeClientes({ activa, titulo, bajada, children }: { activa: PestanaDeClientes; titulo: string; bajada?: string; children?: React.ReactNode }) {
  return (
    <header>
      <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Clientes y WhatsApp</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">{titulo}</h1>
          {bajada ? <p className="mt-1 text-sm text-panel-muted">{bajada}</p> : null}
        </div>
        {children}
      </div>
      <nav aria-label="Secciones de Clientes y WhatsApp" className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:inline-flex">
        {pestanas.map((pestana) => (
          <Link
            key={pestana.id}
            href={pestana.href}
            aria-current={pestana.id === activa ? "page" : undefined}
            className={cn("shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap", pestana.id === activa ? "bg-panel-ink text-white" : "text-panel-ink hover:bg-panel")}
          >
            {pestana.nombre}
          </Link>
        ))}
      </nav>
    </header>
  )
}
