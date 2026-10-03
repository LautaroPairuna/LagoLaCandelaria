"use client"

import { Minus, Plus } from "lucide-react"

import { Campo } from "@/components/reserva/campo"
import { cn } from "cn"

export type DatosFamilia = {
  nombre: string
  apellido: string
  dni: string
  edad: string
  telefono: string
  email: string
  adultos: number
  menores: number
  sinCargo: number
  formaPago: "EFECTIVO" | "DEBITO"
}

export const datosFamiliaVacios: DatosFamilia = {
  nombre: "",
  apellido: "",
  dni: "",
  edad: "",
  telefono: "",
  email: "",
  adultos: 1,
  menores: 0,
  sinCargo: 0,
  formaPago: "EFECTIVO",
}

export function pedidoFamiliar(datos: DatosFamilia) {
  return {
    responsable: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      dni: datos.dni,
      edad: Number(datos.edad) || 0,
      telefono: datos.telefono,
      email: datos.email,
    },
    adultos: datos.adultos,
    menores: datos.menores,
    sinCargo: datos.sinCargo,
    formaPago: datos.formaPago,
  }
}

function soloNumeros(valor: string, maximo: number) {
  return valor.replace(/\D/g, "").slice(0, maximo)
}

export function Contador({
  etiqueta,
  detalle,
  valor,
  minimo = 0,
  maximo = 99,
  onChange,
}: {
  etiqueta: string
  detalle: string
  valor: number
  minimo?: number
  maximo?: number
  onChange: (valor: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white px-4 py-3">
      <div>
        <p className="font-semibold">{etiqueta}</p>
        <p className="text-sm text-ink/60">{detalle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Restar ${etiqueta.toLowerCase()}`}
          disabled={valor <= minimo}
          className="grid size-10 place-items-center rounded-full border border-ink/15 disabled:opacity-30"
          onClick={() => onChange(valor - 1)}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-8 text-center font-display text-2xl tabular-nums" aria-live="polite">
          {valor}
        </span>
        <button
          type="button"
          aria-label={`Sumar ${etiqueta.toLowerCase()}`}
          disabled={valor >= maximo}
          className="grid size-10 place-items-center rounded-full border border-orange bg-orange text-white disabled:opacity-30"
          onClick={() => onChange(valor + 1)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function CamposFamilia({
  datos,
  errores,
  onChange,
}: {
  datos: DatosFamilia
  errores: Record<string, string>
  onChange: (datos: DatosFamilia) => void
}) {
  const cambiar = <K extends keyof DatosFamilia>(clave: K, valor: DatosFamilia[K]) => onChange({ ...datos, [clave]: valor })

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-display text-2xl tracking-tight">¿Cuántos vienen?</legend>
        <Contador etiqueta="Adultos" detalle="Mayores de 12 años" minimo={1} valor={datos.adultos} onChange={(valor) => cambiar("adultos", valor)} />
        <Contador etiqueta="Menores" detalle="De 5 a 12 años" valor={datos.menores} onChange={(valor) => cambiar("menores", valor)} />
        <Contador etiqueta="Menores de 5 años" detalle="No pagan entrada" valor={datos.sinCargo} onChange={(valor) => cambiar("sinCargo", valor)} />
      </fieldset>

      <fieldset>
        <legend className="font-display text-2xl tracking-tight">¿Quién reserva?</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Campo id="responsable.nombre" etiqueta="Nombre" autoComplete="given-name" valor={datos.nombre} error={errores["responsable.nombre"]} onChange={(valor) => cambiar("nombre", valor)} />
          <Campo id="responsable.apellido" etiqueta="Apellido" autoComplete="family-name" valor={datos.apellido} error={errores["responsable.apellido"]} onChange={(valor) => cambiar("apellido", valor)} />
          <Campo id="responsable.dni" etiqueta="DNI" inputMode="numeric" placeholder="Solo números" valor={datos.dni} error={errores["responsable.dni"]} onChange={(valor) => cambiar("dni", soloNumeros(valor, 8))} />
          <Campo id="responsable.edad" etiqueta="Edad" inputMode="numeric" valor={datos.edad} error={errores["responsable.edad"]} onChange={(valor) => cambiar("edad", soloNumeros(valor, 3))} />
          <label className="block" htmlFor="responsable.telefono">
            <span className="text-sm font-semibold text-ink">Celular (WhatsApp)</span>
            <span className="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-input bg-white focus-within:ring-3 focus-within:ring-ring/50">
              <span className="grid place-items-center bg-cream px-3 font-semibold text-ink/70">+54</span>
              <input
                id="responsable.telefono"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="11 3009 1020"
                value={datos.telefono}
                aria-invalid={errores["responsable.telefono"] ? true : undefined}
                onChange={(evento) => cambiar("telefono", soloNumeros(evento.target.value, 10))}
                className="field-control h-10 min-w-0 flex-1 border-0 px-3 outline-none"
              />
            </span>
            <span className={cn("mt-1 block text-sm", errores["responsable.telefono"] ? "text-destructive" : "text-ink/55")} role={errores["responsable.telefono"] ? "alert" : undefined}>
              {errores["responsable.telefono"] ?? "Característica y número, sin 0 ni 15."}
            </span>
          </label>
          <Campo id="responsable.email" etiqueta="Correo (opcional)" tipo="email" autoComplete="email" valor={datos.email} error={errores["responsable.email"]} onChange={(valor) => cambiar("email", valor)} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-2xl tracking-tight">¿Cómo van a pagar?</legend>
        <p className="mt-1 text-sm text-ink/65">Se paga en el predio. Es para que el equipo lo tenga en cuenta.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["EFECTIVO", "Efectivo", "10 % menos"],
              ["DEBITO", "Tarjeta de débito", "Precio de lista"],
            ] as const
          ).map(([valor, nombre, detalle]) => (
            <label
              key={valor}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3",
                datos.formaPago === valor ? "border-orange bg-[#fff7f0]" : "border-ink/10 bg-white",
              )}
            >
              <input type="radio" name="formaPago" value={valor} checked={datos.formaPago === valor} onChange={() => cambiar("formaPago", valor)} className="accent-[#ff7a14]" />
              <span>
                <span className="block font-semibold">{nombre}</span>
                <span className="block text-sm text-ink/60">{detalle}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
