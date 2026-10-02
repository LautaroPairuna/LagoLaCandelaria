"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Campo } from "@/components/reserva/campo"
import { Textarea } from "@/components/ui/textarea"
import {
  cantidadPersonas,
  familiaVacia,
  personaVacia,
  type Borrador,
  type Errores,
  type FamiliaBorrador,
  type PersonaBorrador,
} from "@/lib/solicitud"

function PersonaForm({
  persona,
  clave,
  titulo,
  errores,
  onChange,
  onQuitar,
}: {
  persona: PersonaBorrador
  clave: string
  titulo: string
  errores: Errores
  onChange: (persona: PersonaBorrador) => void
  onQuitar?: () => void
}) {
  const [notasAbiertas, setNotasAbiertas] = useState(persona.notas.trim().length > 0)

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-2xl tracking-tight">{titulo}</p>
        {onQuitar ? (
          <button type="button" className="text-sm font-semibold text-ink underline-offset-4 hover:underline" onClick={onQuitar}>
            Quitar integrante
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${clave}.nombre`}
          etiqueta="Nombre"
          autoComplete="given-name"
          valor={persona.nombre}
          error={errores[`${clave}.nombre`]}
          onChange={(nombre) => onChange({ ...persona, nombre })}
        />
        <Campo
          id={`${clave}.apellido`}
          etiqueta="Apellido"
          autoComplete="family-name"
          valor={persona.apellido}
          error={errores[`${clave}.apellido`]}
          onChange={(apellido) => onChange({ ...persona, apellido })}
        />
        <Campo
          id={`${clave}.dni`}
          etiqueta="DNI"
          inputMode="numeric"
          valor={persona.dni}
          error={errores[`${clave}.dni`]}
          onChange={(dni) => onChange({ ...persona, dni })}
        />
        <Campo
          id={`${clave}.edad`}
          etiqueta="Edad"
          inputMode="numeric"
          valor={persona.edad}
          error={errores[`${clave}.edad`]}
          onChange={(edad) => onChange({ ...persona, edad })}
        />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl bg-earth-soft px-3 py-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[#f28c28]"
          checked={notasAbiertas}
          onChange={(event) => {
            setNotasAbiertas(event.target.checked)
            if (!event.target.checked) onChange({ ...persona, notas: "" })
          }}
        />
        <span>
          <span className="font-bold tracking-[0.12em] text-earth-ink uppercase">Importante</span>
          <span className="mt-1 block text-sm leading-relaxed text-ink/75">
            Alergia, discapacidad o cualquier situación que el personal del predio tenga que saber.
          </span>
        </span>
      </label>
      {notasAbiertas ? (
        <div className="mt-3 space-y-3">
          <Textarea
            value={persona.notas}
            onChange={(event) => onChange({ ...persona, notas: event.target.value })}
            placeholder="Por ejemplo: alergia a frutos secos, se mueve en silla de ruedas, no puede hacer altura."
            className="min-h-24 bg-[#fffdf8] px-3 py-3 text-base"
            aria-invalid={errores[`${clave}.notas`] ? true : undefined}
          />
          {errores[`${clave}.notas`] ? (
            <p className="text-sm text-destructive" role="alert">
              {errores[`${clave}.notas`]}
            </p>
          ) : null}
        </div>
      ) : null}
      <label className="mt-3 flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-[#f28c28]"
          checked={persona.cud}
          onChange={(event) => onChange({ ...persona, cud: event.target.checked })}
        />
        Tiene certificado CUD. No abona el ingreso.
      </label>
    </div>
  )
}

export function PasoPersonas({
  borrador,
  errores,
  onChange,
}: {
  borrador: Borrador
  errores: Errores
  onChange: (borrador: Borrador) => void
}) {
  const total = cantidadPersonas(borrador)

  function actualizar(indice: number, familia: FamiliaBorrador) {
    const familias = borrador.familias.map((item, posicion) => (posicion === indice ? familia : item))
    onChange({ ...borrador, familias })
  }

  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold leading-relaxed text-ink">
        Van {total} {total === 1 ? "persona con nombre" : "personas con nombre"} en {borrador.familias.length}{" "}
        {borrador.familias.length === 1 ? "familia" : "familias"}. El detalle queda a la derecha.
      </p>

      {borrador.familias.map((familia, indice) => (
        <article key={familia.id} className="rounded-[1.6rem] bg-cream p-4 md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Familia {indice + 1}</p>
              <h3 className="font-display mt-1 text-3xl tracking-tight">Primero el responsable</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/75">
                Después, con el botón +, sumá a cada persona que entra con esta familia.
              </p>
            </div>
            {borrador.familias.length > 1 ? (
              <button
                type="button"
                className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
                onClick={() =>
                  onChange({
                    ...borrador,
                    familias: borrador.familias.filter((item) => item.id !== familia.id),
                  })
                }
              >
                Quitar esta familia
              </button>
            ) : null}
          </div>

          <div className="mt-5">
            <PersonaForm
              persona={familia.responsable}
              clave={`familias.${indice}.responsable`}
              titulo="Responsable"
              errores={errores}
              onChange={(responsable) => actualizar(indice, { ...familia, responsable })}
            />
          </div>

          <div className="mt-4 space-y-3">
            {familia.integrantes.map((integrante, hijo) => (
              <PersonaForm
                key={integrante.id}
                persona={integrante}
                clave={`familias.${indice}.integrantes.${hijo}`}
                titulo={hijo === 0 ? "Hijo o integrante" : `Integrante ${hijo + 1}`}
                errores={errores}
                onQuitar={() =>
                  actualizar(indice, {
                    ...familia,
                    integrantes: familia.integrantes.filter((item) => item.id !== integrante.id),
                  })
                }
                onChange={(persona) =>
                  actualizar(indice, {
                    ...familia,
                    integrantes: familia.integrantes.map((item) => (item.id === persona.id ? persona : item)),
                  })
                }
              />
            ))}
          </div>

          <button
            type="button"
            className="mt-4 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-orange bg-white px-4 py-4 text-left transition hover:bg-[#fff4ea] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={familia.integrantes.length >= 12}
            onClick={() => actualizar(indice, { ...familia, integrantes: [...familia.integrantes, personaVacia()] })}
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-orange text-white">
              <Plus className="size-7" strokeWidth={2.75} aria-hidden />
            </span>
            <span>
              <span className="block text-lg font-bold text-ink">Agregar hijo o integrante</span>
              <span className="mt-0.5 block text-sm font-medium text-ink/70">Otra persona de esta misma familia</span>
            </span>
          </button>
        </article>
      ))}

      <button
        type="button"
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-orange bg-orange px-5 py-5 text-left text-white shadow-[0_8px_0_0_#c85a08] transition hover:bg-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
        disabled={borrador.familias.length >= 8}
        onClick={() => onChange({ ...borrador, familias: [...borrador.familias, familiaVacia()] })}
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-orange">
          <Plus className="size-8" strokeWidth={2.75} aria-hidden />
        </span>
        <span>
          <span className="block text-xl font-bold">Agregar otra familia</span>
          <span className="mt-1 block text-sm font-semibold text-white/90">
            Otra familia amiga entra en esta misma reserva
          </span>
        </span>
      </button>
      {errores.familias ? (
        <p className="text-sm text-destructive" role="alert">
          {errores.familias}
        </p>
      ) : null}
    </div>
  )
}
