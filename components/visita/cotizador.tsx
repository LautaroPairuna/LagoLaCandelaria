"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"

import { Contador } from "@/components/reserva-nueva/contador"
import { cotizarDia, lineasSegunForma, totalSegunForma } from "@/lib/predio/cotizacion"
import { pesos, type TipoDeDia } from "@/lib/predio/tarifas"
import type { FormaDePagoWeb } from "@/lib/reserva-visita"
import { cn } from "cn"

/// Cotiza la entrada del finde en familia sin guardar nada: con el tipo de día, la forma
/// de pago y las cantidades, las mismas cuentas que la reserva.
export function Cotizador() {
  const [dia, setDia] = useState<TipoDeDia | null>(null)
  const [forma, setForma] = useState<FormaDePagoWeb | null>(null)
  const [grupo, setGrupo] = useState({ adultos: 2, menores: 0, sinCargo: 0 })
  const cotizacion = dia ? cotizarDia(grupo, dia) : null

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6 rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
        <Pregunta titulo="¿Cuándo querés venir?">
          <Opciones
            valor={dia}
            onChange={setDia}
            opciones={[
              { id: "finde", nombre: "Finde o feriado", detalle: "Sábados, domingos y feriados" },
              { id: "semana", nombre: "Miércoles, jueves o viernes", detalle: "En verano, del 6 de enero al 19 de febrero" },
            ]}
          />
        </Pregunta>
        <Pregunta titulo="¿Cómo abonarías?">
          <Opciones
            valor={forma}
            onChange={setForma}
            opciones={[
              { id: "EFECTIVO", nombre: "Efectivo", detalle: "Al ingresar al predio" },
              { id: "TRANSFERENCIA", nombre: "Transferencia", detalle: "Al ingresar, con recargo del 10 %" },
            ]}
          />
        </Pregunta>
        <Pregunta titulo="¿Cuántos son?">
          <div className="grid gap-3 sm:grid-cols-2">
            <Contador etiqueta="Adultos" detalle="13 años o más" minimo={1} valor={grupo.adultos} onChange={(valor) => setGrupo({ ...grupo, adultos: valor })} />
            <Contador etiqueta="Menores" detalle="De 5 a 12 años" valor={grupo.menores} onChange={(valor) => setGrupo({ ...grupo, menores: valor })} />
            <Contador etiqueta="Menores de 5" detalle="Sin cargo" maximo={30} valor={grupo.sinCargo} onChange={(valor) => setGrupo({ ...grupo, sinCargo: valor })} />
          </div>
        </Pregunta>
      </div>

      <aside className="space-y-4 rounded-[1.6rem] border-2 border-orange bg-white p-5 lg:sticky lg:top-28" aria-live="polite">
        <p className="kicker">Total presupuestado</p>
        {cotizacion && forma ? (
          <>
            <ul className="space-y-1.5 text-sm">
              {lineasSegunForma(cotizacion, forma).map((linea) => (
                <li key={linea.concepto} className="flex justify-between gap-3">
                  <span>
                    {linea.concepto}
                    <span className="block text-xs text-ink/55">{linea.detalle}</span>
                  </span>
                  <span className="font-semibold">{pesos(linea.importe)}</span>
                </li>
              ))}
            </ul>
            <p className="font-display border-t border-ink/10 pt-4 text-5xl tracking-tight">{pesos(totalSegunForma(cotizacion, forma))}</p>
            <p className="text-sm text-ink/65">La entrada incluye las actividades. El restaurante se paga aparte. Es un presupuesto: el precio final es el del día de la visita.</p>
            <Link href="/reserva?propuesta=familia" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-orange px-6 font-bold text-sobre-naranja hover:bg-orange-hover">
              Reservar
            </Link>
          </>
        ) : (
          <p className="text-sm text-ink/60">Elegí cuándo querés venir y cómo abonarías para ver el total.</p>
        )}
      </aside>
    </div>
  )
}

function Pregunta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display text-2xl tracking-tight">{titulo}</legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  )
}

function Opciones<T extends string>({ valor, onChange, opciones }: { valor: T | null; onChange: (valor: T) => void; opciones: { id: T; nombre: string; detalle: string }[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          aria-pressed={valor === opcion.id}
          onClick={() => onChange(opcion.id)}
          className={cn("rounded-2xl border-2 px-4 py-3 text-left transition", valor === opcion.id ? "border-orange bg-orange/5" : "border-ink/10 bg-white hover:border-ink/30")}
        >
          <span className="block font-semibold">{opcion.nombre}</span>
          <span className="block text-sm text-ink/60">{opcion.detalle}</span>
        </button>
      ))}
    </div>
  )
}
