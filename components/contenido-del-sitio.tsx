"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { Contacto, Propuestas } from "@/lib/contenido/secciones"
import type { SeccionEstudiantil } from "@/lib/propuestas"

/// Lleva a los componentes del navegador (el recuadro de reservas, los profes, el ticket)
/// lo que se editó desde el panel. Lo carga el layout del sitio con solo lo que usan.
export type ContenidoPublico = { contacto: Contacto; propuestas: Propuestas; estudiantiles: SeccionEstudiantil[] }

const Contexto = createContext<ContenidoPublico | null>(null)

export function ProveedorDeContenido({ contenido, children }: { contenido: ContenidoPublico; children: ReactNode }) {
  return <Contexto value={contenido}>{children}</Contexto>
}

export function useContenido() {
  const contenido = useContext(Contexto)
  if (!contenido) throw new Error("useContenido fuera de ProveedorDeContenido: va dentro del layout del sitio")
  return contenido
}
