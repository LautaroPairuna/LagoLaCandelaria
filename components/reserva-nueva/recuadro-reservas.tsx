"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { cartaDelRestaurante, type CartaPublica } from "@/app/(sitio)/reserva/carta"
import { useContenido } from "@/components/contenido-del-sitio"
import { Foto } from "@/components/foto"
import { FlujoVisita } from "@/components/reserva-nueva/flujo-visita"
import { FormularioGrupo } from "@/components/reserva-nueva/formulario-grupo"
import { ListaEstudiantil } from "@/components/reserva-nueva/lista-estudiantil"
import { Profes } from "@/components/reserva-nueva/profes"
import { subirAlRecuadro } from "@/lib/avisos"
import { buscarPropuestaEstudiantil, propuestas } from "@/lib/propuestas"

type Camino = "familia" | "bungalows" | "estudiantil" | "aventura"

// En el mismo orden que las tarjetas que se editan en el panel (Sitio web → Propuestas).
const caminos: Camino[] = ["familia", "estudiantil", "aventura", "bungalows"]
const opcionesDeAventura = ["nado", "profes"] as const

/// El recuadro con la propuesta del enlace (/?propuesta=bungalows#como-reservar). Lee la URL
/// en el navegador para que la portada siga siendo estática.
export function RecuadroReservasDelEnlace() {
  const params = useSearchParams()
  return <RecuadroReservas propuestaInicial={params.get("propuesta") ?? undefined} opcionInicial={params.get("opcion") ?? undefined} />
}

export function RecuadroReservas({ propuestaInicial, opcionInicial }: { propuestaInicial?: string; opcionInicial?: string }) {
  const caminoInicial = caminos.some((item) => item === propuestaInicial) ? (propuestaInicial as Camino) : null
  const aventuraInicial = propuestas
    .find((item) => item.id === "aventura")
    ?.opciones.find((item) => item.id === opcionInicial)?.flujo
  const [camino, setCamino] = useState<Camino | null>(caminoInicial)
  const [estudiantilId, setEstudiantilId] = useState<string | null>(
    caminoInicial === "estudiantil" && buscarPropuestaEstudiantil(opcionInicial) ? (opcionInicial ?? null) : null,
  )
  const [aventura, setAventura] = useState<"nado" | "profes" | null>(
    caminoInicial === "aventura" && (aventuraInicial === "nado" || aventuraInicial === "profes") ? aventuraInicial : null,
  )
  const [carta, setCarta] = useState<CartaPublica[]>([])
  const { estudiantiles } = useContenido()
  const cartaLista = useRef(false)

  useEffect(() => {
    if (camino !== "familia" || cartaLista.current) return
    cartaLista.current = true
    cartaDelRestaurante()
      .then(setCarta)
      .catch(() => {
        cartaLista.current = false
        setCarta([])
      })
  }, [camino])

  function elegir(id: Camino) {
    setCamino(id)
    setEstudiantilId(null)
    setAventura(null)
    subirAlRecuadro()
  }

  function elegirEstudiantil(id: string) {
    if (!buscarPropuestaEstudiantil(id)) return
    setEstudiantilId(id)
    subirAlRecuadro()
  }

  function elegirAventura(id: "nado" | "profes") {
    setAventura(id)
    subirAlRecuadro()
  }

  function volver() {
    if (estudiantilId) {
      setEstudiantilId(null)
      subirAlRecuadro()
      return
    }
    if (aventura) {
      setAventura(null)
      subirAlRecuadro()
      return
    }
    setCamino(null)
    subirAlRecuadro()
  }

  const estudiantil = estudiantilId ? estudiantiles.flatMap((seccion) => seccion.propuestas).find((item) => item.id === estudiantilId) : undefined
  const volverTexto = estudiantilId ? "Volver a las propuestas" : aventura ? "Volver a las actividades" : "Elegir otra visita"

  return (
    <div className="reserva-en-agua mt-8 min-w-0 max-w-full rounded-[1.8rem] bg-foam p-4 text-ink shadow-[0_24px_70px_rgba(4,22,28,0.38)] sm:p-6 md:p-8">
      <div id="recuadro-reservas" className="min-w-0 max-w-full">
        {camino ? (
          <button type="button" onClick={volver} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            {volverTexto}
          </button>
        ) : (
          <h3 className="font-display mb-5 text-3xl tracking-tight">Elegí y empezá la reserva</h3>
        )}

        {camino === null ? <Caminos onElegir={elegir} /> : null}
        {camino === "familia" ? <FlujoVisita tipo="finde" carta={carta} /> : null}
        {camino === "bungalows" ? <FlujoVisita tipo="bungalow" /> : null}
        {camino === "estudiantil" && estudiantil ? <FormularioGrupo tipo="CAMPAMENTO" modalidad={estudiantil.titulo} /> : null}
        {camino === "estudiantil" && !estudiantil ? <ListaEstudiantil onReservar={elegirEstudiantil} /> : null}
        {camino === "aventura" && aventura === null ? <OpcionesAventura onElegir={elegirAventura} /> : null}
        {camino === "aventura" && aventura === "nado" ? <FlujoVisita tipo="nado" /> : null}
        {camino === "aventura" && aventura === "profes" ? <Profes /> : null}
      </div>
    </div>
  )
}

function Caminos({ onElegir }: { onElegir: (id: Camino) => void }) {
  const { propuestas } = useContenido()
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {propuestas.caminos.map((item, indice) => (
        <li key={caminos[indice]}>
          <button
            type="button"
            onClick={() => onElegir(caminos[indice])}
            className="group flex h-full w-full flex-col overflow-hidden rounded-[1.4rem] border border-ink/10 bg-white text-left shadow-[0_12px_32px_rgba(58,53,48,0.06)] transition hover:-translate-y-0.5 hover:border-orange"
          >
            <span className="relative block aspect-[16/7] overflow-hidden">
              <Foto src={item.foto.src} alt={item.foto.alt} sizes="(min-width: 640px) 34vw, 100vw" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            </span>
            <span className="flex flex-1 flex-col p-5">
              <span className="font-display text-3xl tracking-tight italic">{item.titulo}</span>
              <span className="mt-2 flex-1 leading-relaxed text-ink/75">{item.detalle}</span>
              <span className="mt-4 inline-flex items-center gap-2 font-semibold text-orange-ink">
                Empezar
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function OpcionesAventura({ onElegir }: { onElegir: (id: "nado" | "profes") => void }) {
  const { propuestas: contenido } = useContenido()
  return (
    <div>
      <h3 className="font-display mb-5 text-3xl tracking-tight">¿Qué actividad querés realizar?</h3>
      <ul className="grid gap-4 sm:grid-cols-2">
        {contenido.aventura.map((item, indice) => {
          const id = opcionesDeAventura[indice]
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onElegir(id)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-[1.4rem] border border-ink/10 bg-white text-left transition hover:-translate-y-0.5 hover:border-orange"
              >
                <span className="relative block aspect-[16/8] overflow-hidden">
                  <Foto src={item.foto.src} alt="" sizes="(min-width: 640px) 34vw, 100vw" className="size-full object-cover" />
                </span>
                <span className="block p-5">
                  <span className="font-display flex items-center justify-between gap-3 text-3xl tracking-tight">
                    {item.titulo}
                    <ArrowRight className="size-6 text-orange" aria-hidden />
                  </span>
                  <span className="mt-2 block leading-relaxed text-ink/70">{item.detalle}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
