"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { useEnLinea } from "@/lib/avisos"

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const enLinea = useEnLinea()
  const enPanel = usePathname().startsWith("/panel")

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-svh items-center bg-cream text-ink">
      <div className="mx-auto max-w-[1120px] px-5 py-32 md:px-8">
        <p className="kicker">{enLinea ? "Algo se cortó" : "Sin conexión"}</p>
        <h1 className="font-display mt-4 max-w-xl text-5xl leading-[0.95] tracking-tight md:text-7xl">
          {enLinea ? "Esta página no llegó a abrirse." : "Te quedaste sin internet."}
        </h1>
        <p className="mt-5 max-w-md text-text-muted">
          {enLinea
            ? enPanel
              ? "No pudimos llegar al sistema del predio. Lo que ya estaba guardado sigue guardado. Probá de nuevo en un momento; si sigue igual, avisá a la administración."
              : "Fue un problema de nuestro lado, no de algo que hayas hecho. Probá de nuevo en un momento; si sigue igual, escribinos por WhatsApp."
            : "Cuando vuelva la conexión, tocá «Probar de nuevo» y seguís donde estabas."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" className="h-12 rounded-full px-5" onClick={() => retry()}>
            Probar de nuevo
          </Button>
          <Button nativeButton={false} variant="outline" className="h-12 rounded-full px-5" render={<Link href={enPanel ? "/panel" : "/"} />}>
            {enPanel ? "Ir al panel" : "Ir al inicio"}
          </Button>
        </div>
        {error.digest ? <p className="mt-8 text-xs text-text-muted">Si nos escribís, pasanos este código: {error.digest}</p> : null}
      </div>
    </main>
  )
}
