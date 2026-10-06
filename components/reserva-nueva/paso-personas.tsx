"use client"

import { Plus, Trash2 } from "lucide-react"

import { Campo } from "@/components/reserva/campo"
import { Contador } from "@/components/reserva-nueva/contador"
import { EDAD_ADULTO, MAX_FAMILIAS, MAYORIA_DE_EDAD } from "@/lib/reserva-familia"

export type PersonaForm = { nombre: string; apellido: string; edad: string; dni: string; notas: string; conNotas: boolean }
export type FamiliaForm = { adultos: PersonaForm[]; ninos: PersonaForm[] }

const personaVacia = (apellido = ""): PersonaForm => ({ nombre: "", apellido, edad: "", dni: "", notas: "", conNotas: false })
export const familiaVacia = (): FamiliaForm => ({ adultos: [personaVacia()], ninos: [] })

function soloNumeros(valor: string, maximo: number) {
  return valor.replace(/\D/g, "").slice(0, maximo)
}

export function cantidadDePersonas(familias: FamiliaForm[]) {
  return familias.reduce((suma, familia) => suma + familia.adultos.length + familia.ninos.length, 0)
}

/// Lo que viaja al servidor: la edad vacía va como null para que el error diga "Escribí la edad".
export function familiasParaEnviar(familias: FamiliaForm[]) {
  const edad = (valor: string) => (valor === "" ? null : Number(valor))
  const notas = (valor: string) => valor.trim() || undefined
  return familias.map((familia) => ({
    adultos: familia.adultos.map((persona) => ({ nombre: persona.nombre, apellido: persona.apellido, edad: edad(persona.edad), dni: persona.dni, notas: notas(persona.notas) })),
    ninos: familia.ninos.map((persona) => ({ nombre: persona.nombre, apellido: persona.apellido, edad: edad(persona.edad), notas: notas(persona.notas) })),
  }))
}

function ajustar(lista: PersonaForm[], cantidad: number, apellido: string) {
  return cantidad > lista.length ? [...lista, ...Array.from({ length: cantidad - lista.length }, () => personaVacia(apellido))] : lista.slice(0, cantidad)
}

export function PasoPersonas({
  familias,
  errores,
  onChange,
  onEditar,
}: {
  familias: FamiliaForm[]
  errores: Record<string, string>
  onChange: (familias: FamiliaForm[]) => void
  onEditar: (campo: string) => void
}) {
  const cambiarFamilia = (indice: number, familia: FamiliaForm) => onChange(familias.map((item, posicion) => (posicion === indice ? familia : item)))

  return (
    <div className="space-y-6">
      <p className="text-ink/70">
        Cargá a todos los que vienen. Si vienen dos familias juntas, sumá la segunda: cada niño queda con los adultos de su familia. A los niños no les pedimos
        documento.
      </p>
      {familias.map((familia, indice) => (
        <Familia
          key={indice}
          indice={indice}
          familia={familia}
          errores={errores}
          onEditar={onEditar}
          puedeQuitar={familias.length > 1}
          onChange={(nueva) => cambiarFamilia(indice, nueva)}
          onQuitar={() => onChange(familias.filter((_, posicion) => posicion !== indice))}
        />
      ))}
      {familias.length < MAX_FAMILIAS ? (
        <button
          type="button"
          onClick={() => onChange([...familias, familiaVacia()])}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 px-4 py-4 font-semibold text-ink/80 hover:border-orange hover:text-ink"
        >
          <Plus className="size-5" aria-hidden />
          Agregar otra familia
        </button>
      ) : null}
    </div>
  )
}

function Familia({
  indice,
  familia,
  errores,
  onEditar,
  puedeQuitar,
  onChange,
  onQuitar,
}: {
  indice: number
  familia: FamiliaForm
  errores: Record<string, string>
  onEditar: (campo: string) => void
  puedeQuitar: boolean
  onChange: (familia: FamiliaForm) => void
  onQuitar: () => void
}) {
  const apellido = familia.adultos[0]?.apellido ?? ""
  const cambiarPersona = (grupo: "adultos" | "ninos", posicion: number, persona: PersonaForm) => {
    const actualizada = { ...familia, [grupo]: familia[grupo].map((item, lugar) => (lugar === posicion ? persona : item)) }
    // El apellido del primer adulto se copia a los que todavía no tienen uno propio.
    if (grupo === "adultos" && posicion === 0 && persona.apellido !== apellido) {
      const heredar = (item: PersonaForm) => (item.apellido === "" || item.apellido === apellido ? { ...item, apellido: persona.apellido } : item)
      actualizada.adultos = actualizada.adultos.map((item, lugar) => (lugar === 0 ? item : heredar(item)))
      actualizada.ninos = actualizada.ninos.map(heredar)
    }
    onChange(actualizada)
  }

  return (
    <fieldset className="rounded-[1.4rem] border border-ink/10 bg-cream/40 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <legend className="font-display text-2xl tracking-tight">Familia {indice + 1}</legend>
        {puedeQuitar ? (
          <button type="button" onClick={onQuitar} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
            <Trash2 className="size-4" aria-hidden />
            Quitar familia
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Contador
          etiqueta="Adultos"
          detalle={`${EDAD_ADULTO} años o más`}
          minimo={1}
          maximo={30}
          valor={familia.adultos.length}
          onChange={(cantidad) => onChange({ ...familia, adultos: ajustar(familia.adultos, cantidad, apellido) })}
        />
        <Contador
          etiqueta="Niños"
          detalle={`Hasta ${EDAD_ADULTO - 1} años`}
          maximo={30}
          valor={familia.ninos.length}
          onChange={(cantidad) => onChange({ ...familia, ninos: ajustar(familia.ninos, cantidad, apellido) })}
        />
      </div>
      <ol className="mt-4 space-y-3">
        {familia.adultos.map((persona, posicion) => (
          <Persona
            key={`a${posicion}`}
            prefijo={`familias.${indice}.adultos.${posicion}`}
            titulo={`Adulto ${posicion + 1}`}
            ayuda={indice === 0 && posicion === 0 ? `Figura como titular de la reserva. Tiene que tener ${MAYORIA_DE_EDAD} años o más.` : undefined}
            conDni
            persona={persona}
            errores={errores}
            onEditar={onEditar}
            onChange={(nueva) => cambiarPersona("adultos", posicion, nueva)}
          />
        ))}
        {familia.ninos.map((persona, posicion) => (
          <Persona
            key={`n${posicion}`}
            prefijo={`familias.${indice}.ninos.${posicion}`}
            titulo={`Niño ${posicion + 1}`}
            persona={persona}
            errores={errores}
            onEditar={onEditar}
            onChange={(nueva) => cambiarPersona("ninos", posicion, nueva)}
          />
        ))}
      </ol>
    </fieldset>
  )
}

function Persona({
  prefijo,
  titulo,
  ayuda,
  conDni = false,
  persona,
  errores,
  onEditar,
  onChange,
}: {
  prefijo: string
  titulo: string
  ayuda?: string
  conDni?: boolean
  persona: PersonaForm
  errores: Record<string, string>
  onEditar: (campo: string) => void
  onChange: (persona: PersonaForm) => void
}) {
  const cambiar = <K extends keyof PersonaForm>(clave: K, valor: PersonaForm[K]) => {
    onEditar(`${prefijo}.${clave}`)
    onChange({ ...persona, [clave]: valor })
  }
  return (
    <li className="rounded-2xl bg-white p-4">
      <p className="text-sm font-bold text-ink">{titulo}</p>
      {ayuda ? <p className="text-xs text-ink/60">{ayuda}</p> : null}
      <div className={conDni ? "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "mt-3 grid gap-3 sm:grid-cols-3"}>
        <Campo id={`${prefijo}.nombre`} etiqueta="Nombre" autoComplete="off" valor={persona.nombre} error={errores[`${prefijo}.nombre`]} onChange={(valor) => cambiar("nombre", valor)} />
        <Campo id={`${prefijo}.apellido`} etiqueta="Apellido" autoComplete="off" valor={persona.apellido} error={errores[`${prefijo}.apellido`]} onChange={(valor) => cambiar("apellido", valor)} />
        <Campo id={`${prefijo}.edad`} etiqueta="Edad" inputMode="numeric" valor={persona.edad} error={errores[`${prefijo}.edad`]} onChange={(valor) => cambiar("edad", soloNumeros(valor, 3))} />
        {conDni ? (
          <Campo
            id={`${prefijo}.dni`}
            etiqueta={persona.edad !== "" && Number(persona.edad) < MAYORIA_DE_EDAD ? "DNI (opcional)" : "DNI"}
            inputMode="numeric"
            placeholder="Solo números"
            valor={persona.dni}
            error={errores[`${prefijo}.dni`]}
            onChange={(valor) => cambiar("dni", soloNumeros(valor, 8))}
          />
        ) : null}
      </div>
      {persona.conNotas || persona.notas ? (
        <div className="mt-3">
          <Campo
            id={`${prefijo}.notas`}
            etiqueta="Algo importante para el predio"
            placeholder="Alergia al tomate, celíaco, usa silla de ruedas…"
            valor={persona.notas}
            error={errores[`${prefijo}.notas`]}
            onChange={(valor) => cambiar("notas", valor.slice(0, 200))}
          />
        </div>
      ) : (
        <button type="button" onClick={() => cambiar("conNotas", true)} className="mt-2 text-sm font-semibold text-lake-ink underline-offset-4 hover:underline">
          + Agregar algo importante (alergia, dieta, condición)
        </button>
      )}
    </li>
  )
}
