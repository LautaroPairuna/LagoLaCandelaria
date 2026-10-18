"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { buscarMiReserva } from "@/app/(sitio)/mi-reserva/acciones"
import { Campo } from "@/components/reserva/campo"
import { Button } from "@/components/ui/button"
import { avisarError, llamar } from "@/lib/avisos"

export function BuscarMiReserva() {
  const router = useRouter()
  const [codigo, setCodigo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [error, setError] = useState("")
  const [buscando, iniciar] = useTransition()

  function buscar(evento: React.FormEvent) {
    evento.preventDefault()
    setError("")
    iniciar(async () => {
      const resultado = await llamar(() => buscarMiReserva({ codigo, telefono }))
      if (resultado.ok) {
        router.push(`/reserva/t/${resultado.token}`)
        return
      }
      setError(resultado.error)
      avisarError(resultado.error)
    })
  }

  return (
    <form onSubmit={buscar} className="max-w-xl space-y-4 rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
      <Campo id="codigo" etiqueta="Código de la reserva" placeholder="LC-AB12CD" valor={codigo} onChange={(valor) => setCodigo(valor.toUpperCase().slice(0, 9))} />
      <Campo
        id="telefono"
        etiqueta="Celular con que reservaste"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="11 3009 1020"
        valor={telefono}
        onChange={(valor) => setTelefono(valor.replace(/\D/g, "").slice(0, 13))}
      />
      {error ? (
        <p className="rounded-2xl bg-[#fde8e4] px-4 py-3 text-sm font-semibold text-[#a0261b]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={buscando || !codigo || !telefono} className="h-12 w-full px-6 text-base text-white">
        {buscando ? "Buscando…" : "Ver mi reserva"}
      </Button>
      <p className="text-sm text-ink/60">El código está arriba a la derecha de tu ticket (empieza con LC-).</p>
    </form>
  )
}
