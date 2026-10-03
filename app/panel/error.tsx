"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { useEnLinea } from "@/lib/avisos"

export default function ErrorDelPanel({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const enLinea = useEnLinea()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-display text-4xl tracking-tight">{enLinea ? "Esta pantalla no cargó" : "Te quedaste sin internet"}</h1>
      <p className="mt-3 text-panel-muted">
        {enLinea
          ? "No pudimos traer los datos del sistema. Lo que ya estaba guardado sigue guardado. Probá de nuevo en un momento y, si se repite, avisá a la administración."
          : "Lo que ya estaba guardado sigue guardado. Cuando vuelva la conexión, tocá «Probar de nuevo»."}
      </p>
      <Button type="button" className="mt-6 h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado" onClick={() => retry()}>
        Probar de nuevo
      </Button>
      {error.digest ? <p className="mt-6 text-xs text-panel-muted">Código para la administración: {error.digest}</p> : null}
    </main>
  )
}
