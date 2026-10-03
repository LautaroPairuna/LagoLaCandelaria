import type { HTMLAttributes } from "react"

import { Input } from "@/components/ui/input"

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
        aria-describedby={error ? `${id}-error` : undefined}
        className="field-control mt-1.5"
      />
      {error ? (
        <span id={`${id}-error`} className="mt-1 block text-sm text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  )
}
