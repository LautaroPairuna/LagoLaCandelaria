"use client"

import { createContext, useContext, type ReactNode } from "react"

import { contenidoPorDefecto, type ContenidoDelSitio } from "@/lib/contenido/secciones"

/// Lleva a los componentes del navegador (el recuadro de reservas, los profes) lo que se
/// editó desde el panel. Lo carga el layout del sitio.
const Contexto = createContext<ContenidoDelSitio>(contenidoPorDefecto)

export function ProveedorDeContenido({ contenido, children }: { contenido: ContenidoDelSitio; children: ReactNode }) {
  return <Contexto value={contenido}>{children}</Contexto>
}

export function useContenido() {
  return useContext(Contexto)
}
