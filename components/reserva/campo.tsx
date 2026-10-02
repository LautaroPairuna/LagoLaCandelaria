import type { HTMLAttributes, ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "cn"

export function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  error,
  tipo = "text",
  autoComplete,
  inputMode,
  placeholder,
}: {
  id: string
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  error?: string
  tipo?: string
  autoComplete?: string
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"]
  placeholder?: string
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-semibold text-ink">{etiqueta}</span>
      <Input
        id={id}
        name={id}
        type={tipo}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={valor}
        placeholder={placeholder}
        onValueChange={(value) => onChange(value)}
        aria-invalid={error ? true : undefined}
        className="field-control mt-1.5"
      />
      {error ? (
        <span className="mt-1 block text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function Aviso({
  children,
  tono = "alerta",
}: {
  children: ReactNode
  tono?: "alerta" | "ok" | "info"
}) {
  return (
    <p
      role={tono === "alerta" ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
        tono === "alerta" && "bg-[#fde8e4] text-[#7a2e24]",
        tono === "ok" && "bg-green-soft text-lime-ink",
        tono === "info" && "bg-lake-soft text-lake-ink",
      )}
    >
      {children}
    </p>
  )
}
