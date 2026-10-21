"use client"

import { Banknote, Calculator, CalendarDays, Landmark, UsersRound } from "lucide-react"
import Link from "next/link"
import { useState, type ReactNode } from "react"

import { Foto } from "@/components/foto"
import { Contador } from "@/components/reserva-nueva/contador"
import { cotizarDia, lineasSegunForma, totalSegunForma } from "@/lib/predio/cotizacion"
import { pesos, type TipoDeDia } from "@/lib/predio/tarifas"
import type { FormaDePagoWeb } from "@/lib/reserva-visita"
import { cn } from "cn"

const dias: { id: TipoDeDia; nombre: string; detalle: string; foto: string }[] = [
  { id: "finde", nombre: "Finde o feriado", detalle: "Sábados, domingos y feriados", foto: "/covers/playa.jpg" },
  { id: "semana", nombre: "Miércoles, jueves o viernes", detalle: "En verano, del 6 de enero al 19 de febrero", foto: "/covers/canchas.jpg" },
]

/// Cotiza la entrada del finde en familia sin guardar nada: con el tipo de día, la forma
/// de pago y las cantidades, las mismas cuentas que la reserva.
export function Cotizador() {
  const [dia, setDia] = useState<TipoDeDia | null>(null)
  const [forma, setForma] = useState<FormaDePagoWeb | null>(null)
  const [grupo, setGrupo] = useState({ adultos: 2, menores: 0, sinCargo: 0 })
  const cotizacion = dia ? cotizarDia(grupo, dia) : null

  return (
    <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-[0.95fr_1.05fr]">
      <section className="min-w-0 rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-[0_14px_38px_rgba(58,53,48,0.06)] md:p-6">
        <Encabezado icono={CalendarDays} sobre="Tu visita" titulo="Armá el día" />
        <div className="mt-4 space-y-4">
        <Pregunta titulo="¿Cuándo vienen?">
          <div className="grid gap-3 sm:grid-cols-2">
            {dias.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={dia === opcion.id}
                onClick={() => setDia(opcion.id)}
                className={cn(
                  "group relative h-32 overflow-hidden rounded-[1.15rem] text-left text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange",
                  dia === opcion.id ? "ring-2 ring-orange" : "ring-1 ring-ink/10",
                )}
              >
                <Foto
                  src={opcion.foto}
                  alt=""
                  sizes="(min-width: 1024px) 28vw, 80vw"
                  className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
                <span className="relative flex h-full flex-col justify-end p-3.5">
                  <span className="font-display text-2xl leading-none tracking-tight">{opcion.nombre}</span>
                  <span className="mt-1 text-xs leading-snug text-cream/85">{opcion.detalle}</span>
                </span>
              </button>
            ))}
          </div>
        </Pregunta>
        <Pregunta titulo="¿Cómo pagarían?">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { id: "EFECTIVO", nombre: "Efectivo", detalle: "Al ingresar al predio", icono: <Banknote className="size-5" aria-hidden /> },
                { id: "TRANSFERENCIA", nombre: "Transferencia", detalle: "Al ingresar, con recargo del 10 %", icono: <Landmark className="size-5" aria-hidden /> },
              ] as const
            ).map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={forma === opcion.id}
                onClick={() => setForma(opcion.id)}
                className={cn(
                  "rounded-[1.15rem] border-2 px-4 py-3 text-left transition",
                  forma === opcion.id ? "border-orange bg-orange/10" : "border-ink/10 bg-foam hover:border-ink/30",
                )}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {opcion.icono}
                  {opcion.nombre}
                </span>
                <span className="mt-1 block text-sm text-text-muted">{opcion.detalle}</span>
              </button>
            ))}
          </div>
        </Pregunta>
        </div>
      </section>

      <section className="min-w-0 rounded-[1.5rem] border border-ink/10 bg-[#f4eadb] p-5 shadow-[0_14px_38px_rgba(58,53,48,0.06)] md:p-6">
        <Encabezado icono={UsersRound} sobre="Presupuesto" titulo="Personas y total" />
        <div className="mt-4">
        <Pregunta titulo="¿Cuántos son?">
          <div className="grid gap-3 sm:grid-cols-2">
            <Contador etiqueta="Adultos" detalle="13 años o más" minimo={1} valor={grupo.adultos} onChange={(valor) => setGrupo({ ...grupo, adultos: valor })} />
            <Contador etiqueta="Menores" detalle="De 5 a 12 años" valor={grupo.menores} onChange={(valor) => setGrupo({ ...grupo, menores: valor })} />
            <div className="sm:col-span-2">
              <Contador etiqueta="Menores de 5" detalle="Sin cargo" maximo={30} valor={grupo.sinCargo} onChange={(valor) => setGrupo({ ...grupo, sinCargo: valor })} />
            </div>
          </div>
        </Pregunta>
        </div>

        <div className="mt-4 rounded-[1.2rem] border border-orange/35 bg-white p-4" aria-live="polite">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-lake-ink uppercase">
          <Calculator className="size-4" aria-hidden />
          Total presupuestado
        </div>
        {cotizacion && forma ? (
          <>
            <ul className="mt-3 space-y-1.5 text-sm">
              {lineasSegunForma(cotizacion, forma).map((linea) => (
                <li key={linea.concepto} className="flex justify-between gap-3">
                  <span>
                    {linea.concepto}
                    <span className="block text-xs text-text-muted">{linea.detalle}</span>
                  </span>
                  <span className="font-semibold">{pesos(linea.importe)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-3 border-t border-ink/10 pt-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-display text-4xl leading-none tracking-tight">{pesos(totalSegunForma(cotizacion, forma))}</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-muted">Incluye las actividades. El restaurante se abona aparte.</p>
              </div>
              <Link href="/?propuesta=familia#como-reservar" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-orange px-6 font-bold text-sobre-naranja hover:bg-orange-hover">
              Reservar
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-text-muted">Elegí cuándo querés venir y cómo pagarían para ver el total.</p>
        )}
        </div>
      </section>
    </div>
  )
}

function Pregunta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display text-xl tracking-tight">{titulo}</legend>
      <div className="mt-2.5">{children}</div>
    </fieldset>
  )
}

function Encabezado({ icono: Icono, sobre, titulo }: { icono: typeof CalendarDays; sobre: string; titulo: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lake text-white">
        <Icono className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-lake-ink uppercase">{sobre}</p>
        <h2 className="font-display text-2xl leading-none tracking-tight sm:text-3xl">{titulo}</h2>
      </div>
    </div>
  )
}
