"use client"

import { TriangleAlert } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { cn } from "cn"

type Pedido = { texto: string; aceptar: string; peligro: boolean; resolver: (aceptado: boolean) => void }
type Opciones = { aceptar?: string; peligro?: boolean }

let mostrar: ((pedido: Pedido) => void) | null = null

/// Pide confirmación con un diálogo del panel (en vez del aviso del navegador). Devuelve
/// true si se aceptó. Si el panel todavía no montó el diálogo, usa el del navegador.
export function confirmar(texto: string, { aceptar = "Confirmar", peligro = false }: Opciones = {}): Promise<boolean> {
  if (!mostrar) return Promise.resolve(window.confirm(texto))
  const abrir = mostrar
  return new Promise((resolver) => abrir({ texto, aceptar, peligro, resolver }))
}

/// El diálogo de confirmación, una vez en el layout del panel.
export function Confirmador() {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const dialogo = useRef<HTMLDialogElement>(null)
  const respuesta = useRef(false)

  // Se registra al montarse para que `confirmar` lo pueda abrir desde cualquier lado.
  useEffect(() => {
    mostrar = (nuevo) => {
      respuesta.current = false
      setPedido(nuevo)
    }
    return () => {
      mostrar = null
    }
  }, [])

  // Al llegar un pedido se abre como modal: queda por encima de la ficha si está abierta.
  useEffect(() => {
    if (pedido) dialogo.current?.showModal()
  }, [pedido])

  function cerrar(aceptado: boolean) {
    respuesta.current = aceptado
    dialogo.current?.close()
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="confirmar-titulo"
      onClose={() => {
        pedido?.resolver(respuesta.current)
        setPedido(null)
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-left text-panel-ink backdrop:bg-black/50"
    >
      {pedido ? (
        <div className="p-5">
          <h2 id="confirmar-titulo" className="flex items-center gap-2 font-display text-2xl tracking-tight">
            <TriangleAlert className={cn("size-6", pedido.peligro ? "text-[#c62828]" : "text-panel-naranja")} aria-hidden />
            Confirmar movimiento
          </h2>
          <p className="mt-2 text-base leading-relaxed">{pedido.texto}</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => cerrar(false)} className="h-11 rounded-full border border-panel-line px-5 text-sm font-semibold hover:border-panel-muted">
              Volver
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => cerrar(true)}
              className={cn("h-11 rounded-full px-5 text-sm font-bold text-white", pedido.peligro ? "bg-[#c62828] hover:bg-[#a32020]" : "bg-panel-ink hover:bg-panel-tostado")}
            >
              {pedido.aceptar}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
