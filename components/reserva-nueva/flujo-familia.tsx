"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { reservarBungalow, reservarDia, type ResultadoReserva } from "@/app/(sitio)/reserva/acciones"
import { Aviso } from "@/components/reserva/campo"
import { CalendarioDisponible, type DatosDelMes } from "@/components/reserva-nueva/calendario-disponible"
import { CamposFamilia, datosFamiliaVacios, pedidoFamiliar, type DatosFamilia } from "@/components/reserva-nueva/datos-familia"
import { Button } from "@/components/ui/button"
import { asignarBungalows, bungalowsPara } from "@/lib/predio/bungalows"
import { cotizarBungalows, cotizarDia, textoDelEfectivo, textoDelTotal } from "@/lib/predio/cotizacion"
import { fechaLarga, fechasEntre, hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"

const MAX_PERSONAS_BUNGALOW = 16

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

function validarBungalow(desde: string, hasta: string, meses: Record<string, DatosDelMes>) {
  const resultado = asignarBungalows(1, desde, hasta, hoyEnElPredio(), ocupacionDeBungalows(meses))
  if ("unidades" in resultado) return null
  return resultado.motivo === "deja-huecos"
    ? "Así quedaría un día suelto que nadie puede reservar. Probá corriendo la estadía un día antes o después."
    : "No hay bungalows libres para todas esas noches."
}

export function FlujoFamilia({ modo, lugar }: { modo: "dia" | "bungalow"; lugar?: "parrilla" | "playa" }) {
  const router = useRouter()
  const [fechas, setFechas] = useState({ desde: "", hasta: "" })
  const [datos, setDatos] = useState<DatosFamilia>(datosFamiliaVacios)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [enviando, iniciar] = useTransition()

  const personas = datos.adultos + datos.menores + datos.sinCargo
  const noches = fechas.desde && fechas.hasta ? fechasEntre(fechas.desde, fechas.hasta).length - 1 : 0
  const bungalows = bungalowsPara(personas)
  const cotizacion =
    modo === "dia"
      ? cotizarDia({ adultos: datos.adultos, menores: datos.menores, sinCargo: datos.sinCargo })
      : noches > 0
        ? cotizarBungalows(personas, noches, bungalows)
        : null
  const fechaLista = modo === "dia" ? Boolean(fechas.desde) : noches > 0

  function confirmar() {
    setError("")
    setErrores({})
    if (modo === "bungalow" && personas > MAX_PERSONAS_BUNGALOW) {
      setError(`Para más de ${MAX_PERSONAS_BUNGALOW} personas escribinos por WhatsApp.`)
      return
    }
    iniciar(async () => {
      let resultado: ResultadoReserva
      try {
        resultado =
          modo === "dia"
            ? await reservarDia({ fecha: fechas.desde, lugar: lugar ?? "parrilla", ...pedidoFamiliar(datos) })
            : await reservarBungalow({ desde: fechas.desde, hasta: fechas.hasta, ...pedidoFamiliar(datos) })
      } catch {
        resultado = { ok: false, error: "No llegamos al predio. Revisá la conexión e intentá de nuevo." }
      }
      if (resultado.ok) {
        router.push(`/reserva/t/${resultado.token}?nuevo=1`)
        return
      }
      setError(resultado.error)
      setErrores(resultado.campos ?? {})
    })
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <section className="rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
          <p className="kicker">Paso 1</p>
          <h2 className="font-display mt-1 text-3xl tracking-tight">
            {modo === "dia" ? "¿Qué día vienen?" : "¿Qué noches se quedan?"}
          </h2>
          <p className="mt-2 text-ink/70">
            {modo === "dia"
              ? "En verde, los días con lugar. El predio abre de 10 a 19."
              : "Tocá el día de llegada y después el de salida. En verde, los días con bungalow libre."}
          </p>
          <div className="mt-5">
            <CalendarioDisponible
              categoria={modo === "dia" ? (lugar ?? "parrilla") : "bungalow"}
              modo={modo === "dia" ? "dia" : "rango"}
              desde={fechas.desde}
              hasta={fechas.hasta}
              onElegir={(desde, hasta) => setFechas({ desde, hasta })}
              validarRango={modo === "bungalow" ? validarBungalow : undefined}
            />
          </div>
        </section>

        {fechaLista ? (
          <section className="rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
            <p className="kicker">Paso 2</p>
            <h2 className="font-display mt-1 text-3xl tracking-tight">Los datos de la reserva</h2>
            <div className="mt-5">
              <CamposFamilia datos={datos} errores={errores} onChange={setDatos} />
            </div>
          </section>
        ) : null}
      </div>

      <aside className="space-y-4 rounded-[1.6rem] border-2 border-orange bg-white p-5 lg:sticky lg:top-28">
        <p className="kicker">Tu reserva</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink/60">{modo === "dia" ? "Día" : "Estadía"}</dt>
            <dd className="text-right font-semibold">
              {modo === "dia"
                ? fechas.desde
                  ? fechaLarga(fechas.desde)
                  : "Elegí el día"
                : noches > 0
                  ? `${noches} ${noches === 1 ? "noche" : "noches"} desde el ${fechaLarga(fechas.desde).toLowerCase()}`
                  : "Elegí llegada y salida"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink/60">Lugar</dt>
            <dd className="text-right font-semibold">
              {modo === "dia"
                ? lugar === "playa"
                  ? "Gazebo o palapa (lo asigna el sistema)"
                  : personas > 18
                    ? "Quincho (más de 18 personas)"
                    : "Parrilla (la asigna el sistema)"
                : `${bungalows} ${bungalows === 1 ? "bungalow" : "bungalows"}`}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink/60">Personas</dt>
            <dd className="font-semibold">{personas}</dd>
          </div>
        </dl>
        {cotizacion ? (
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
            <p className="font-display mt-3 text-4xl tracking-tight">{textoDelTotal(cotizacion)}</p>
            {textoDelEfectivo(cotizacion) ? <p className="text-sm font-semibold text-ink/75">{textoDelEfectivo(cotizacion)}</p> : null}
          </div>
        ) : null}
        {error ? <Aviso>{error}</Aviso> : null}
        <Button type="button" disabled={!fechaLista || enviando} className="h-14 w-full text-base" onClick={confirmar}>
          {enviando ? "Reservando…" : "Confirmar reserva"}
        </Button>
        <p className="text-xs leading-relaxed text-ink/55">
          No se cobra en la web. Te queda un ticket con QR y el predio te confirma por WhatsApp.
        </p>
      </aside>
    </div>
  )
}
