"use client"

import { useActionState } from "react"

import { ingresar, type EstadoIngreso } from "@/app/ingresar/acciones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState<EstadoIngreso, FormData>(ingresar, {})

  return (
    <form action={accion} className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-12 bg-white" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-12 bg-white" />
      </div>
      {estado.error ? (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {estado.error}
        </p>
      ) : null}
      <Button type="submit" disabled={enviando} className="h-12 w-full text-base">
        {enviando ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  )
}
