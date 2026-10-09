"use client"

import { ArrowLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useState, useTransition, type ReactNode } from "react"

import { reservarFinde } from "@/app/(sitio)/reserva/acciones"
import { Foto } from "@/components/foto"
import { CalendarioDisponible } from "@/components/reserva-nueva/calendario-disponible"
import { Contador } from "@/components/reserva-nueva/contador"
import { ElegirHorario, PasoConfirmar } from "@/components/reserva-nueva/flujo-familia"
import { PasoLugar } from "@/components/reserva-nueva/paso-lugar"
import { cantidadDePersonas, familiaVacia, familiasParaEnviar, PasoPersonas, type FamiliaForm } from "@/components/reserva-nueva/paso-personas"
import { Button } from "@/components/ui/button"
import { avisarError, avisarRevisar, irAlPrimerCampo, llamar } from "@/lib/avisos"
import { camposDe } from "@/lib/errores-de-campos"
import { porCategoria } from "@/lib/panel/local"
import { cotizarBungalows, cotizarDia } from "@/lib/predio/cotizacion"
import { grupoPorEdades, revisarEleccion, type TipoDeLugar } from "@/lib/predio/eleccion"
import { fechaLarga, sumarDiasIso } from "@/lib/predio/fechas"
import { type Franja } from "@/lib/predio/horario"
import { inventario, MAX_PERSONAS_BAR, MAX_PERSONAS_RESTAURANTE } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { pesos } from "@/lib/predio/tarifas"
import { contacto as esquemaDeContacto, familias as esquemaDeFamilias } from "@/lib/reserva-familia"
import { cn } from "cn"

const MAX_PERSONAS_BUNGALOW = 16
const pasos = ["Personas", "Fecha", "Ubicación", "Mesas", "Confirmar"] as const

const ubicaciones = [
  { id: "parrilla", nombre: "Parrilla", foto: "/covers/parrillas.jpg", alt: "Parrillas del predio." },
  { id: "gazebo", nombre: "Gazebo", foto: "/activities/bungalows.jpg", alt: "Gazebo en el campo del predio." },
  { id: "palapa", nombre: "Palapa", foto: "/covers/playa.jpg", alt: "Palapas junto a la pileta." },
  { id: "bungalow", nombre: "Bungalow", foto: "/bungalow.jpg", alt: "Bungalow entre los árboles." },
] as const

type Ubicacion = (typeof ubicaciones)[number]["id"]

export type PlatoDeCarta = { id: number; categoria: string; nombre: string; descripcion: string | null; precio: number }

const horarioInicial: Franja = { desde: 12, hasta: 14 }

function unidadesDe(ids: string[]) {
  return ids.map((id) => inventario.find((unidad) => unidad.id === id)).filter((unidad) => unidad !== undefined)
}

function textoDeUnidades(ids: string[]) {
  const lista = unidadesDe(ids)
  return lista.length ? lista.map((unidad) => `${nombreDeUnidad[unidad.tipo]} ${unidad.etiqueta}`).join(", ") : "No"
}

export function FlujoFinde({ cartas }: { cartas: { restaurante: PlatoDeCarta[]; bar: PlatoDeCarta[] } }) {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [familias, setFamilias] = useState<FamiliaForm[]>(() => [familiaVacia()])
  const [fecha, setFecha] = useState("")
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null)
  const [noches, setNoches] = useState(1)
  const [unidades, setUnidades] = useState<string[]>([])
  const [quiereRestaurante, setQuiereRestaurante] = useState<boolean | null>(null)
  const [quiereBar, setQuiereBar] = useState<boolean | null>(null)
  const [mesasRestaurante, setMesasRestaurante] = useState<string[]>([])
  const [mesasBar, setMesasBar] = useState<string[]>([])
  const [horarioRestaurante, setHorarioRestaurante] = useState<Franja>(horarioInicial)
  const [horarioBar, setHorarioBar] = useState<Franja>(horarioInicial)
  const [contacto, setContacto] = useState({ telefono: "", email: "" })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, iniciar] = useTransition()

  const personas = cantidadDePersonas(familias)
  const edades = familias.flatMap((familia) => [...familia.adultos, ...familia.ninos]).map((persona) => Number(persona.edad)).filter(edadValida)
  const grupo = grupoPorEdades(edades)
  const hasta = ubicacion === "bungalow" && fecha ? sumarDiasIso(fecha, noches) : fecha
  const cotizacion =
    edades.length !== personas ? null : ubicacion === "bungalow" ? (unidades.length ? cotizarBungalows(personas, noches, unidades.length) : null) : cotizarDia(grupo)
  const cambiarUnidades = useCallback((ids: string[]) => setUnidades(ids), [])
  const cambiarMesasRestaurante = useCallback((ids: string[]) => setMesasRestaurante(ids), [])
  const cambiarMesasBar = useCallback((ids: string[]) => setMesasBar(ids), [])

  function cambiarFamilias(nuevas: FamiliaForm[]) {
    if (cantidadDePersonas(nuevas) !== personas) {
      setUnidades([])
      setMesasRestaurante([])
      setMesasBar([])
    }
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
    }
    if (paso === 1 && !fecha) {
      avisarRevisar("Elegí el día en el calendario.")
      return
    }
    if (paso === 2) {
      if (!ubicacion) {
        avisarRevisar("Elegí dónde se ubican: parrilla, gazebo, palapa o bungalow.")
        return
      }
      if (ubicacion === "bungalow" && personas > MAX_PERSONAS_BUNGALOW) {
        avisarRevisar(`Para más de ${MAX_PERSONAS_BUNGALOW} personas armamos la estadía a medida: escribinos por WhatsApp.`)
        return
      }
      const revision = revisarEleccion(ubicacion, personas, unidadesDe(unidades))
      if (!revision.ok) {
        avisarRevisar(revision.mensaje)
        return
      }
    }
    if (paso === 3) {
      if (quiereRestaurante === null || quiereBar === null) {
        avisarRevisar("Decinos si reservan mesa en el restaurante y si reservan mesa en el bar.")
        return
      }
      if (quiereRestaurante) {
        if (personas > MAX_PERSONAS_RESTAURANTE) {
          avisarRevisar(`En el restaurante entran hasta ${MAX_PERSONAS_RESTAURANTE} personas: para un grupo más grande escribinos por WhatsApp.`)
          return
        }
        const revision = revisarEleccion("restaurante", personas, unidadesDe(mesasRestaurante))
        if (!revision.ok) {
          avisarRevisar(revision.mensaje)
          return
        }
      }
      if (quiereBar) {
        if (personas > MAX_PERSONAS_BAR) {
          avisarRevisar(`En el bar entran hasta ${MAX_PERSONAS_BAR} personas: para un grupo más grande escribinos por WhatsApp.`)
          return
        }
        const revision = revisarEleccion("bar", personas, unidadesDe(mesasBar))
        if (!revision.ok) {
          avisarRevisar(revision.mensaje)
          return
        }
      }
    }
    setErrores({})
    setPaso(paso + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function confirmar() {
    if (!ubicacion || !fecha) return
    const revision = esquemaDeContacto.safeParse(contacto)
    if (!revision.success) {
      avisarError("Revisá los datos de contacto.")
      marcar(camposDe(revision.error, "contacto"))
      return
    }
    iniciar(async () => {
      const resultado = await llamar(() =>
        reservarFinde({
          fecha,
          ubicacion,
          noches: ubicacion === "bungalow" ? noches : undefined,
          unidades,
          restaurante: quiereRestaurante ? { unidades: mesasRestaurante, horario: horarioRestaurante } : undefined,
          bar: quiereBar ? { unidades: mesasBar, horario: horarioBar } : undefined,
          familias: familiasParaEnviar(familias),
          contacto,
        }),
      )
      if (resultado.ok) {
        router.push(`/reserva/t/${resultado.token}?nuevo=1`)
        return
      }
      avisarError(resultado.error)
      const campos = resultado.campos ?? {}
      const primero = Object.keys(campos)[0] ?? ""
      if (primero.startsWith("familias")) setPaso(0)
      else if (primero.startsWith("unidades") || primero === "ubicacion") setPaso(2)
      else if (primero.startsWith("restaurante") || primero.startsWith("bar")) setPaso(3)
      else if (/lugar|reservó|mesa/i.test(resultado.error)) setPaso(primero.startsWith("restaurante") || /restaurante|bar/i.test(resultado.error) ? 3 : 2)
      marcar(campos)
    })
  }

  const nombreUbicacion = ubicaciones.find((item) => item.id === ubicacion)?.nombre

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
            {paso === 0 ? "¿Quiénes vienen?" : paso === 1 ? "¿Qué día ingresan?" : paso === 2 ? "¿Dónde se ubican?" : paso === 3 ? "Restaurante y bar" : "Revisá y confirmá"}
          </h2>

          <div className="mt-5">
            {paso === 0 ? <PasoPersonas familias={familias} errores={errores} onChange={cambiarFamilias} onEditar={limpiar} /> : null}

            {paso === 1 ? (
              <>
                <p className="mb-4 text-ink/70">Elegí el día de ingreso. En verde, los días en que el predio abre. El horario del predio es de 10 a 19.</p>
                <CalendarioDisponible
                  categoria="visita"
                  personas={personas}
                  modo="dia"
                  desde={fecha}
                  hasta={fecha}
                  onElegir={(desde) => {
                    setFecha(desde)
                    setUnidades([])
                    setMesasRestaurante([])
                    setMesasBar([])
                  }}
                />
              </>
            ) : null}

            {paso === 2 ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {ubicaciones.map((item) => {
                    const elegido = ubicacion === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={elegido}
                        onClick={() => {
                          if (ubicacion !== item.id) {
                            setUbicacion(item.id)
                            setUnidades([])
                          }
                        }}
                        className={cn("overflow-hidden rounded-[1.4rem] border-2 bg-foam text-left", elegido ? "border-orange" : "border-ink/10")}
                      >
                        <span className="relative block aspect-[4/3]">
                          <Foto src={item.foto} alt={item.alt} sizes="(min-width: 1024px) 28vw, 45vw" className="size-full object-cover" />
                        </span>
                        <span className="flex items-center justify-between px-3 py-3">
                          <span className="font-display text-2xl tracking-tight md:text-3xl">{item.nombre}</span>
                          {elegido ? <Check className="size-5 text-orange" aria-hidden /> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {ubicacion === "bungalow" ? (
                  <Contador
                    etiqueta="Noches"
                    detalle="Desde el día de ingreso que elegiste"
                    minimo={1}
                    maximo={14}
                    valor={noches}
                    onChange={(valor) => {
                      setNoches(valor)
                      setUnidades([])
                    }}
                  />
                ) : null}
                {ubicacion ? (
                  <PasoLugar
                    tipo={ubicacion}
                    desde={fecha}
                    hasta={hasta || fecha}
                    personas={personas}
                    elegidas={unidades}
                    onChange={cambiarUnidades}
                  />
                ) : null}
              </div>
            ) : null}

            {paso === 3 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <LocalSiNo
                  nombre="Restaurante"
                  valor={quiereRestaurante}
                  onChange={(valor) => {
                    setQuiereRestaurante(valor)
                    if (!valor) setMesasRestaurante([])
                  }}
                  horario={horarioRestaurante}
                  onHorario={(nuevo) => {
                    setHorarioRestaurante(nuevo)
                    setMesasRestaurante([])
                  }}
                  tipo="restaurante"
                  fecha={fecha}
                  personas={personas}
                  mesas={mesasRestaurante}
                  onMesas={cambiarMesasRestaurante}
                  platos={cartas.restaurante}
                />
                <LocalSiNo
                  nombre="Bar"
                  valor={quiereBar}
                  onChange={(valor) => {
                    setQuiereBar(valor)
                    if (!valor) setMesasBar([])
                  }}
                  horario={horarioBar}
                  onHorario={(nuevo) => {
                    setHorarioBar(nuevo)
                    setMesasBar([])
                  }}
                  tipo="bar"
                  fecha={fecha}
                  personas={personas}
                  mesas={mesasBar}
                  onMesas={cambiarMesasBar}
                  platos={cartas.bar}
                />
              </div>
            ) : null}

            {paso === 4 ? (
              <div className="space-y-6">
                <dl className="space-y-2 text-sm">
                  <Resumen termino="Día">{fecha ? fechaLarga(fecha) : "Falta elegir"}</Resumen>
                  <Resumen termino="Ubicación">
                    {nombreUbicacion ?? "Falta elegir"}
                    {ubicacion === "bungalow" ? ` · ${noches} ${noches === 1 ? "noche" : "noches"}` : ""}
                    {unidades.length ? ` · ${textoDeUnidades(unidades)}` : ""}
                  </Resumen>
                  <Resumen termino="Restaurante">{quiereRestaurante ? textoDeUnidades(mesasRestaurante) : "No"}</Resumen>
                  <Resumen termino="Bar">{quiereBar ? textoDeUnidades(mesasBar) : "No"}</Resumen>
                </dl>
                {cotizacion && cotizacion.total > 0 ? (
                  <div>
                    <ul className="space-y-1.5 text-sm">
                      {cotizacion.lineas.map((linea) => (
                        <li key={linea.concepto} className="flex justify-between gap-3">
                          <span>{linea.concepto}</span>
                          <span className="font-semibold">{pesos(linea.importe)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-display mt-3 text-4xl tracking-tight">{pesos(cotizacion.total)}</p>
                    <p className="mt-1 text-sm text-ink/70">La entrada incluye las actividades. El restaurante y el bar se pagan aparte, por lo que consuman.</p>
                  </div>
                ) : null}
                <PasoConfirmar
                  familias={familias}
                  contacto={contacto}
                  errores={errores}
                  onContacto={(nuevo) => {
                    if (nuevo.telefono !== contacto.telefono) limpiar("contacto.telefono")
                    if (nuevo.email !== contacto.email) limpiar("contacto.email")
                    setContacto(nuevo)
                  }}
                />
              </div>
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
            {paso < 4 ? (
              <Button type="button" className="h-12 px-6 text-base text-white" onClick={avanzar}>
                Continuar
              </Button>
            ) : (
              <Button type="button" disabled={enviando} className="h-12 px-6 text-base text-white" onClick={confirmar}>
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
          <Resumen termino="Día">{fecha ? fechaLarga(fecha) : "Falta elegir"}</Resumen>
          <Resumen termino="Ubicación">{nombreUbicacion ?? "Falta elegir"}</Resumen>
          <Resumen termino="Restaurante">{quiereRestaurante === null ? "Falta elegir" : quiereRestaurante ? "Sí" : "No"}</Resumen>
          <Resumen termino="Bar">{quiereBar === null ? "Falta elegir" : quiereBar ? "Sí" : "No"}</Resumen>
        </dl>
        {cotizacion && cotizacion.total > 0 ? (
          <p className="font-display border-t border-ink/10 pt-4 text-4xl tracking-tight">{pesos(cotizacion.total)}</p>
        ) : (
          <p className="border-t border-ink/10 pt-4 text-sm text-ink/60">El total aparece cuando cargues las edades.</p>
        )}
        <p className="text-xs leading-relaxed text-ink/55">No se cobra en la web. Te queda un ticket con QR y el predio te confirma por WhatsApp.</p>
      </aside>
    </div>
  )
}

function LocalSiNo({
  nombre,
  valor,
  onChange,
  horario,
  onHorario,
  tipo,
  fecha,
  personas,
  mesas,
  onMesas,
  platos,
}: {
  nombre: string
  valor: boolean | null
  onChange: (valor: boolean) => void
  horario: Franja
  onHorario: (horario: Franja) => void
  tipo: Extract<TipoDeLugar, "restaurante" | "bar">
  fecha: string
  personas: number
  mesas: string[]
  onMesas: (ids: string[]) => void
  platos: PlatoDeCarta[]
}) {
  const grupos = porCategoria(platos)
  return (
    <section className="rounded-[1.4rem] border border-ink/10 bg-foam p-4">
      <h3 className="font-display text-3xl tracking-tight">{nombre}</h3>
      <p className="mt-1 text-sm text-ink/65">¿Reservan una mesa? El {nombre.toLowerCase()} tiene sus propias mesas y su propia carta.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([true, false] as const).map((opcion) => (
          <button
            key={String(opcion)}
            type="button"
            aria-pressed={valor === opcion}
            onClick={() => onChange(opcion)}
            className={cn("h-12 rounded-full border-2 text-base font-bold", valor === opcion ? "border-orange bg-orange text-white" : "border-ink/15 bg-white")}
          >
            {opcion ? "Sí" : "No"}
          </button>
        ))}
      </div>
      {valor ? (
        <div className="mt-4 space-y-4">
          <ElegirHorario horario={horario} onChange={onHorario} />
          <PasoLugar tipo={tipo} desde={fecha} hasta={fecha} personas={personas} elegidas={mesas} onChange={onMesas} horas={`${horario.desde}-${horario.hasta}`} />
          <div>
            <h4 className="font-semibold">Menú del {nombre.toLowerCase()}</h4>
            {grupos.length === 0 ? (
              <p className="mt-2 text-sm text-ink/65">Estamos actualizando la carta. Pedila en el lugar.</p>
            ) : (
              <div className="mt-2 max-h-80 space-y-4 overflow-y-auto pr-1">
                {grupos.map((grupo) => (
                  <div key={grupo.categoria}>
                    <p className="text-sm font-semibold text-ink/55">{grupo.categoria}</p>
                    <ul className="mt-1 divide-y divide-ink/10">
                      {grupo.items.map((plato) => (
                        <li key={plato.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                          <span>
                            <span className="font-semibold">{plato.nombre}</span>
                            {plato.descripcion ? <span className="block text-ink/60">{plato.descripcion}</span> : null}
                          </span>
                          <span className="font-semibold whitespace-nowrap">{pesos(plato.precio)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
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
