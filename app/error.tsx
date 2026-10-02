"use client"

import Link from "next/link"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-svh items-center bg-cream text-ink">
      <div className="mx-auto max-w-[1120px] px-5 py-32 md:px-8">
        <p className="kicker">Error</p>
        <h1 className="font-display mt-4 max-w-xl text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Esta página no llegó a abrirse.
        </h1>
        <p className="mt-5 max-w-md text-text-muted">
          Algo se cortó al cargarla. Podés reintentar, o volver a entrar por el inicio.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" className="h-12 rounded-full px-5" onClick={() => reset()}>
            Reintentar
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            className="h-12 rounded-full px-5"
            render={<Link href="/" />}
          >
            Ir al inicio
          </Button>
        </div>
      </div>
    </main>
  )
}
