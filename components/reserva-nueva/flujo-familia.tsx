"use client"

import { ArrowLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useState, useTransition, type ReactNode } from "react"

import { reservarBungalow, reservarDia } from "@/app/(sitio)/reserva/acciones"
import { Campo } from "@/components/reserva/campo"
import { CalendarioDisponible, type DatosDelMes } from "@/components/reserva-nueva/calendario-disponible"
import { PasoLugar } from "@/components/reserva-nueva/paso-lugar"
import { cantidadDePersonas, familiaVacia, familiasParaEnviar, PasoPersonas, type FamiliaForm } from "@/components/reserva-nueva/paso-personas"
import { Button } from "@/components/ui/button"
import { avisarError, avisarRevisar, irAlPrimerCampo, llamar } from "@/lib/avisos"
import { camposDe } from "@/lib/errores-de-campos"
import { asignarBungalows, bungalowsPara } from "@/lib/predio/bungalows"
import { cotizarBungalows, cotizarDia } from "@/lib/predio/cotizacion"
import { grupoPorEdades, revisarEleccion, type TipoDeLugar } from "@/lib/predio/eleccion"
import { fechaLarga, fechasEntre, hoyEnElPredio } from "@/lib/predio/fechas"
import { inventario } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { pesos } from "@/lib/predio/tarifas"
import { contacto as esquemaDeContacto, familias as esquemaDeFamilias } from "@/lib/reserva-familia"
import { cn } from "cn"

const MAX_PERSONAS_BUNGALOW = 16
const pasos = ["Personas", "Fecha", "Lugar", "Confirmar"] as const

function ocupacionDeBungalows(meses: Record<string, DatosDelMes>) {
  const mapa = new Map<string, Set<string>>()
  for (const datos of Object.values(meses)) {
    for (const [id, fechas] of Object.entries(datos.bungalows ?? {})) {
      const conjunto = mapa.get(id) ?? new Set<string>()
      for (const fecha of fechas) conjunto.add(fecha)
      mapa.set(id, conjunto)
    }
  }
  return mapa
}

function pasoDelCampo(campo: string) {
  if (campo.startsWith("familias")) return 0
  if (campo.startsWith("unidades")) return 2
  return 3
}

export function FlujoFamilia({ modo, lugar }: { modo: "dia" | "bungalow"; lugar?: "parrilla" | "playa" }) {
  const router = useRouter()
  const tipo: TipoDeLugar = modo === "bungalow" ? "bungalow" : (lugar ?? "parrilla")
  const [paso, setPaso] = useState(0)
  const [familias, setFamilias] = useState<FamiliaForm[]>(() => [familiaVacia()])
  const [fechas, setFechas] = useState({ desde: "", hasta: "" })
  const [unidades, setUnidades] = useState<string[]>([])
  const [contacto, setContacto] = useState({ telefono: "", email: "" })
  const [formaPago, setFormaPago] = useState<"EFECTIVO" | "DEBITO">("EFECTIVO")
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, iniciar] = useTransition()

  const personas = cantidadDePersonas(familias)
  const edades = familias.flatMap((familia) => [...familia.adultos, ...familia.ninos]).map((persona) => Number(persona.edad)).filter(edadValida)
  const grupo = grupoPorEdades(edades)
  const noches = fechas.desde && fechas.hasta ? fechasEntre(fechas.desde, fechas.hasta).length - 1 : 0
  const cotizacion = modo === "dia" ? cotizarDia(grupo) : noches > 0 ? cotizarBungalows(personas, noches, bungalowsPara(personas)) : null
  const fechaLista = modo === "dia" ? Boolean(fechas.desde) : noches > 0
  const elegidas = unidades.map((id) => inventario.find((unidad) => unidad.id === id)).filter((unidad) => unidad !== undefined)
  const cambiarUnidades = useCallback((ids: string[]) => setUnidades(ids), [])

  function cambiarFamilias(nuevas: FamiliaForm[]) {
    if (cantidadDePersonas(nuevas) !== personas) setUnidades([])
    setFamilias(nuevas)
  }

  const limpiar = useCallback((campo: string) => {
    setErrores((actuales) => {
      if (!(campo in actuales)) return actuales
      const resto = { ...actuales }
      delete resto[campo]
      return resto
    })
  }, [])

  function marcar(campos: Record<string, string>) {
    setErrores(campos)
    irAlPrimerCampo(campos)
  }

  function avanzar() {
    if (paso === 0) {
      const revision = esquemaDeFamilias.safeParse(familiasParaEnviar(familias))
      if (!revision.success) {
        avisarError("Hay datos para revisar. Te los marcamos en rojo.")
        marcar(camposDe(revision.error, "familias"))
        return
      }
      if (modo === "bungalow" && personas > MAX_PERSONAS_BUNGALOW) {
        avisarRevisar(`Para más de ${MAX_PERSONAS_BUNGALOW} personas armamos la estadía a medida: escribinos por WhatsApp.`)
        return
      }
    }
    if (paso === 1 && !fechaLista) {
      avisarRevisar(modo === "dia" ? "Elegí el día en el calendario." : "Elegí el día de llegada y el de salida.")
      return
    }
    if (paso === 2) {
      const revision = revisarEleccion(tipo, personas, elegidas)
      if (!revision.ok) {
        avisarRevisar(revision.mensaje)
        return
      }
    }
    setErrores({})
    setPaso(paso + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function confirmar() {
    const revision = esquemaDeContacto.safeParse(contacto)
    if (!revision.success) {
      avisarError("Revisá los datos de contacto.")
      marcar(camposDe(revision.error, "contacto"))
      return
    }
    iniciar(async () => {
      const comun = { familias: familiasParaEnviar(familias), contacto, unidades, formaPago }
      const resultado = await llamar(() =>
        modo === "dia"
          ? reservarDia({ fecha: fechas.desde, lugar: lugar ?? "parrilla", ...comun })
          : reservarBungalow({ desde: fechas.desde, hasta: fechas.hasta, ...comun }),
      )
      if (resultado.ok) {
        router.push(`/reserva/t/${resultado.token}?nuevo=1`)
        return
      }
      avisarError(resultado.error)
      const campos = resultado.campos ?? {}
      const primero = Object.keys(campos)[0]
      if (primero) setPaso(pasoDelCampo(primero))
      else if (/lugar|reservó/.test(resultado.error)) setPaso(2)
      marcar(campos)
    })
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <ol className="flex gap-1.5 md:gap-2" aria-label="Pasos de la reserva">
          {pasos.map((nombre, indice) => (
            <li key={nombre} className="flex-1">
              <button
                type="button"
                disabled={indice >= paso}
                onClick={() => setPaso(indice)}
                aria-current={indice === paso ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-start gap-1.5 text-left text-xs font-semibold md:text-sm",
                  indice <= paso ? "text-ink" : "text-ink/40",
                  indice < paso && "hover:text-orange",
                )}
              >
                <span className={cn("h-1.5 w-full rounded-full", indice < paso ? "bg-orange" : indice === paso ? "bg-ink" : "bg-ink/10")} />
                <span className="flex items-center gap-1">
                  {indice < paso ? <Check className="size-3.5" aria-hidden /> : <span className="tabular-nums">{indice + 1}.</span>}
                  {nombre}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <section className="rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
          <p className="kicker">Paso {paso + 1}</p>
          <h2 className="font-display mt-1 text-3xl tracking-tight">
            {paso === 0
              ? "¿Quiénes vienen?"
              : paso === 1
                ? modo === "dia"
                  ? "¿Qué día vienen?"
                  : "¿Qué noches se quedan?"
                : paso === 2
                  ? tipo === "parrilla"
                    ? "Elegí la parrilla"
                    : tipo === "playa"
                      ? "Elegí los lugares en la playa"
                      : "Elegí los bungalows"
                  : "Revisá y confirmá"}
          </h2>

          <div className="mt-5">
            {paso === 0 ? <PasoPersonas familias={familias} errores={errores} onChange={cambiarFamilias} onEditar={limpiar} /> : null}

            {paso === 1 ? (
              <>
                <p className="mb-4 text-ink/70">
                  {modo === "dia"
                    ? `En verde, los días en que hay lugar para ${personas} ${personas === 1 ? "persona" : "personas"}. El predio abre de 10 a 19.`
                    : "Tocá el día de llegada y después el de salida. En verde, los días con bungalow libre."}
                </p>
                <CalendarioDisponible
                  categoria={tipo}
                  personas={personas}
                  modo={modo === "dia" ? "dia" : "rango"}
                  desde={fechas.desde}
                  hasta={fechas.hasta}
                  onElegir={(desde, hasta) => {
                    setFechas({ desde, hasta })
                    setUnidades([])
                  }}
                  validarRango={
                    modo === "bungalow"
                      ? (desde, hasta, meses) => {
                          const resultado = asignarBungalows(personas, desde, hasta, hoyEnElPredio(), ocupacionDeBungalows(meses))
                          if ("unidades" in resultado) return null
                          return resultado.motivo === "deja-huecos"
                            ? "Así quedaría una noche suelta que nadie puede reservar. Probá corriendo la estadía un día antes o después."
                            : `No hay ${bungalowsPara(personas)} ${bungalowsPara(personas) === 1 ? "bungalow libre" : "bungalows libres"} para todas esas noches.`
                        }
                      : undefined
                  }
                />
              </>
            ) : null}

            {paso === 2 ? (
              <PasoLugar tipo={tipo} desde={fechas.desde} hasta={fechas.hasta || fechas.desde} personas={personas} elegidas={unidades} onChange={cambiarUnidades} />
            ) : null}

            {paso === 3 ? (
              <PasoConfirmar
                familias={familias}
                contacto={contacto}
                formaPago={formaPago}
                errores={errores}
                onContacto={(nuevo) => {
                  if (nuevo.telefono !== contacto.telefono) limpiar("contacto.telefono")
                  if (nuevo.email !== contacto.email) limpiar("contacto.email")
                  setContacto(nuevo)
                }}
                onFormaPago={setFormaPago}
              />
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink/10 pt-5">
            {paso > 0 ? (
              <button type="button" onClick={() => setPaso(paso - 1)} className="inline-flex items-center gap-2 font-semibold text-ink/70 hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden />
                Volver
              </button>
            ) : (
              <span />
            )}
            {paso < 3 ? (
              <Button type="button" className="h-12 px-6 text-base" onClick={avanzar}>
                Continuar
              </Button>
            ) : (
              <Button type="button" disabled={enviando} className="h-12 px-6 text-base" onClick={confirmar}>
                {enviando ? "Reservando…" : "Confirmar reserva"}
              </Button>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-4 rounded-[1.6rem] border-2 border-orange bg-white p-5 lg:sticky lg:top-28">
        <p className="kicker">Tu reserva</p>
        <dl className="space-y-2 text-sm">
          <Resumen termino="Personas">
            {personas} · {familias.length} {familias.length === 1 ? "familia" : "familias"}
          </Resumen>
          <Resumen termino={modo === "dia" ? "Día" : "Estadía"}>
            {modo === "dia"
              ? fechas.desde
                ? fechaLarga(fechas.desde)
                : "Falta elegir"
              : noches > 0
                ? `${noches} ${noches === 1 ? "noche" : "noches"} desde el ${fechaLarga(fechas.desde).toLowerCase()}`
                : "Falta elegir"}
          </Resumen>
          <Resumen termino="Lugar">{elegidas.length ? elegidas.map((unidad) => `${nombreDeUnidad[unidad.tipo]} ${unidad.etiqueta}`).join(", ") : "Falta elegir"}</Resumen>
        </dl>
        {cotizacion && cotizacion.total > 0 ? (
          <div className="border-t border-ink/10 pt-4">
            <ul className="space-y-1.5 text-sm">
              {cotizacion.lineas.map((linea) => (
                <li key={linea.concepto} className="flex justify-between gap-3">
                  <span>
                    {linea.concepto}
                    <span className="block text-xs text-ink/55">{linea.detalle}</span>
                  </span>
                  <span className="font-semibold">{pesos(linea.importe)}</span>
                </li>
              ))}
            </ul>
            <p className="font-display mt-3 text-4xl tracking-tight">{pesos(cotizacion.total)}</p>
            {cotizacion.totalEfectivo && cotizacion.totalEfectivo !== cotizacion.total ? (
              <p className="text-sm font-semibold text-ink/75">Pagando en efectivo: {pesos(cotizacion.totalEfectivo)} (10 % menos).</p>
            ) : null}
          </div>
        ) : (
          <p className="border-t border-ink/10 pt-4 text-sm text-ink/60">El total aparece cuando cargues las edades{modo === "bungalow" ? " y las noches" : ""}.</p>
        )}
        <p className="text-xs leading-relaxed text-ink/55">No se cobra en la web. Te queda un ticket con QR y el predio te confirma por WhatsApp.</p>
      </aside>
    </div>
  )
}

function edadValida(edad: number) {
  return Number.isInteger(edad) && edad >= 0 && edad <= 110
}

function Resumen({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/60">{termino}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

function PasoConfirmar({
  familias,
  contacto,
  formaPago,
  errores,
  onContacto,
  onFormaPago,
}: {
  familias: FamiliaForm[]
  contacto: { telefono: string; email: string }
  formaPago: "EFECTIVO" | "DEBITO"
  errores: Record<string, string>
  onContacto: (contacto: { telefono: string; email: string }) => void
  onFormaPago: (forma: "EFECTIVO" | "DEBITO") => void
}) {
  const conNotas = familias.flatMap((familia, indice) =>
    [...familia.adultos, ...familia.ninos].filter((persona) => persona.notas.trim()).map((persona) => ({ ...persona, familia: indice + 1 })),
  )
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Quiénes vienen</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {familias.map((familia, indice) => (
            <li key={indice}>
              {familias.length > 1 ? <span className="font-semibold">Familia {indice + 1}: </span> : null}
              {[...familia.adultos, ...familia.ninos].map((persona) => `${persona.nombre} ${persona.apellido} (${persona.edad})`).join(", ")}
            </li>
          ))}
        </ul>
        {conNotas.length ? (
          <ul className="mt-3 space-y-1 rounded-2xl bg-sand px-4 py-3 text-sm">
            {conNotas.map((persona, indice) => (
              <li key={indice}>
                <strong>
                  {persona.nombre} {persona.apellido}
                </strong>
                : {persona.notas}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <fieldset>
        <legend className="font-semibold">¿Cómo te avisamos?</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Campo
            id="contacto.telefono"
            etiqueta="Celular (WhatsApp)"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="11 3009 1020"
            valor={contacto.telefono}
            error={errores["contacto.telefono"]}
            onChange={(valor) => onContacto({ ...contacto, telefono: valor.replace(/\D/g, "").slice(0, 10) })}
          />
          <Campo
            id="contacto.email"
            etiqueta="Correo (opcional)"
            tipo="email"
            autoComplete="email"
            valor={contacto.email}
            error={errores["contacto.email"]}
            onChange={(valor) => onContacto({ ...contacto, email: valor })}
          />
        </div>
        <p className="mt-1 text-sm text-ink/55">Característica y número, sin 0 ni 15.</p>
      </fieldset>

      <fieldset>
        <legend className="font-semibold">¿Cómo vas a pagar en el predio?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["EFECTIVO", "Efectivo", "10 % menos"],
              ["DEBITO", "Débito", "Precio de lista"],
            ] as const
          ).map(([valor, nombre, detalle]) => (
            <label
              key={valor}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3",
                formaPago === valor ? "border-orange bg-orange/5" : "border-ink/15 hover:border-ink/30",
              )}
            >
              <input type="radio" name="formaPago" value={valor} checked={formaPago === valor} onChange={() => onFormaPago(valor)} className="size-4 accent-[#ff7a14]" />
              <span>
                <span className="block font-semibold">{nombre}</span>
                <span className="text-sm text-ink/60">{detalle}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
