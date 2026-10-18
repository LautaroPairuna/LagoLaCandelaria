"use client"

import { ArrowLeft, Banknote, Check, Landmark, MessageCircle, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react"

import { reservarBungalow, reservarFinde, reservarNado } from "@/app/(sitio)/reserva/acciones"
import { Foto } from "@/components/foto"
import { Campo } from "@/components/reserva/campo"
import { CalendarioDisponible } from "@/components/reserva-nueva/calendario-disponible"
import { Contador } from "@/components/reserva-nueva/contador"
import { PasoLugar } from "@/components/reserva-nueva/paso-lugar"
import { Button } from "@/components/ui/button"
import { avisarError, avisarRevisar, falloDeRed, irAlPrimerCampo, llamar } from "@/lib/avisos"
import type { LugarDisponible } from "@/lib/disponibilidad"
import { camposDe } from "@/lib/errores-de-campos"
import { porCategoria } from "@/lib/panel/local"
import { lugaresDePlayaPara } from "@/lib/predio/asignacion"
import { cotizarBungalows, cotizarDia, cotizarNado, lineasSegunForma, nombreDelDia, totalSegunForma, type Cotizacion, type Grupo } from "@/lib/predio/cotizacion"
import { personasQueOcupan, revisarEleccion } from "@/lib/predio/eleccion"
import { fechaLarga, sumarDiasIso } from "@/lib/predio/fechas"
import { HORARIO_RESTAURANTE, textoDeHora, type Franja } from "@/lib/predio/horario"
import { inventario, MAX_PERSONAS_PARRILLA } from "@/lib/predio/inventario"
import { pesos, type TipoDeDia } from "@/lib/predio/tarifas"
import { contacto as esquemaDeContacto } from "@/lib/reserva-familia"
import { esFranjaDeNado, grupoWeb, MAX_HORAS_DE_NADO, MAX_PERSONAS_BUNGALOWS, titularWeb, type FormaDePagoWeb } from "@/lib/reserva-visita"
import { enlaceWhatsappDelPredio } from "@/lib/site"
import { cn } from "cn"

export type TipoDeVisita = "finde" | "bungalow" | "nado"
type Ubicacion = "parrilla" | "gazebo" | "palapa"
type Paso = "personas" | "fecha" | "ubicacion" | "restaurante" | "bungalows" | "confirmar"

export type PlatoDeCarta = { id: number; categoria: string; nombre: string; descripcion: string | null; precio: number }

/// Lo que ya tiene una reserva que se modifica desde "Ver mi reserva".
export type DatosParaModificar = {
  token: string
  fecha: string
  dia: TipoDeDia
  grupo: Grupo
  titular: { nombre: string; apellido: string; dni: string; notas: string }
  contacto: { telefono: string; email: string }
  forma: FormaDePagoWeb | null
  ubicacion?: Ubicacion
  parrilla?: string
  almuerzo?: boolean
  bungalows?: string[]
  horario?: Franja
  club?: string
}

const ubicaciones = [
  { id: "parrilla", nombre: "Parrilla", foto: "/covers/parrillas.jpg", alt: "Parrillas del predio." },
  { id: "gazebo", nombre: "Gazebo", foto: "/activities/bungalows.jpg", alt: "Gazebo en el campo del predio." },
  { id: "palapa", nombre: "Palapa", foto: "/covers/playa.jpg", alt: "Palapas junto a la pileta." },
] as const

const titulos: Record<Paso, string> = {
  personas: "¿Quiénes vienen?",
  fecha: "¿Qué día vienen y cómo pagan?",
  ubicacion: "¿Dónde se ubican?",
  restaurante: "Restaurante",
  bungalows: "Elegí los bungalows",
  confirmar: "Revisá y confirmá",
}

const nombresDePaso: Record<Paso, string> = {
  personas: "Personas",
  fecha: "Fecha y pago",
  ubicacion: "Ubicación",
  restaurante: "Restaurante",
  bungalows: "Bungalows",
  confirmar: "Confirmar",
}

function pasosDe(tipo: TipoDeVisita, ubicacion: Ubicacion | null): Paso[] {
  if (tipo === "nado") return ["personas", "fecha", "confirmar"]
  if (tipo === "bungalow") return ["personas", "fecha", "bungalows", "confirmar"]
  return ["personas", "fecha", "ubicacion", ...(ubicacion === "gazebo" || ubicacion === "palapa" ? (["restaurante"] as const) : []), "confirmar"]
}

function pasoDelCampo(campo: string): Paso | null {
  if (campo.startsWith("titular") || campo.startsWith("grupo") || campo === "nadadores" || campo === "club") return "personas"
  if (campo === "fecha" || campo.startsWith("horario") || campo === "forma") return "fecha"
  if (campo === "parrilla" || campo === "ubicacion") return "ubicacion"
  if (campo.startsWith("bungalows")) return "bungalows"
  if (campo.startsWith("contacto")) return "confirmar"
  return null
}

export function FlujoVisita({
  tipo,
  carta = [],
  modificar,
}: {
  tipo: TipoDeVisita
  carta?: PlatoDeCarta[]
  modificar?: DatosParaModificar
}) {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>("personas")
  const [grupo, setGrupo] = useState<Grupo>(modificar?.grupo ?? { adultos: tipo === "nado" ? 1 : 2, menores: 0, sinCargo: 0 })
  const [titular, setTitular] = useState(modificar?.titular ?? { nombre: "", apellido: "", dni: "", notas: "" })
  const [conNotas, setConNotas] = useState(Boolean(modificar?.titular.notas))
  const [club, setClub] = useState(modificar?.club ?? "")
  const [fecha, setFecha] = useState(modificar?.fecha ?? "")
  const [dia, setDia] = useState<TipoDeDia>(modificar?.dia ?? "finde")
  const [forma, setForma] = useState<FormaDePagoWeb | null>(tipo === "bungalow" ? "TRANSFERENCIA" : (modificar?.forma ?? null))
  const [horario, setHorario] = useState<Franja>(modificar?.horario ?? { desde: 10, hasta: 12 })
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(modificar?.ubicacion ?? null)
  const [parrilla, setParrilla] = useState<string[]>(modificar?.parrilla ? [modificar.parrilla] : [])
  const [bungalows, setBungalows] = useState<string[]>(modificar?.bungalows ?? [])
  const [playaLista, setPlayaLista] = useState(false)
  const [almuerzo, setAlmuerzo] = useState<boolean | null>(modificar?.almuerzo ?? null)
  const [contacto, setContacto] = useState(modificar?.contacto ?? { telefono: "", email: "" })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, iniciar] = useTransition()

  const ocupan = personasQueOcupan(grupo)
  const total = grupo.adultos + grupo.menores + grupo.sinCargo
  const pasos = pasosDe(tipo, ubicacion)
  const indice = pasos.indexOf(paso)
  const cotizacion: Cotizacion | null = !fecha
    ? null
    : tipo === "nado"
      ? cotizarNado(grupo.adultos, dia)
      : tipo === "bungalow"
        ? cotizarBungalows(Math.max(1, Math.ceil(ocupan / 4)))
        : cotizarDia(grupo, dia)
  const cambiarParrilla = useCallback((ids: string[]) => setParrilla(ids), [])
  const cambiarBungalows = useCallback((ids: string[]) => setBungalows(ids), [])

  // Si cambia la cantidad, lo elegido se mantiene: el paso del lugar avisa si ya no alcanza.
  function cambiarGrupo(nuevo: Grupo) {
    if (personasQueOcupan(nuevo) !== ocupan) setPlayaLista(false)
    setGrupo(nuevo)
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

  function ir(destino: Paso) {
    setPaso(destino)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function avanzar() {
    if (paso === "personas") {
      const revisionDelTitular = titularWeb.safeParse(titular)
      const revisionDelGrupo = grupoWeb.safeParse(grupo)
      if (!revisionDelTitular.success || !revisionDelGrupo.success) {
        avisarError(revisionDelGrupo.success ? "Hay datos para revisar. Te los marcamos en rojo." : revisionDelGrupo.error.issues[0].message)
        if (!revisionDelTitular.success) marcar(camposDe(revisionDelTitular.error, "titular"))
        return
      }
      if (tipo === "bungalow" && ocupan > MAX_PERSONAS_BUNGALOWS) {
        avisarRevisar(`Para más de ${MAX_PERSONAS_BUNGALOWS} personas armamos la estadía a medida: escribinos por WhatsApp.`)
        return
      }
    }
    if (paso === "fecha") {
      if (!fecha) return avisarRevisar("Elegí el día en el calendario.")
      if (tipo === "nado" && !esFranjaDeNado(horario)) return avisarRevisar(`Elegí de 1 a ${MAX_HORAS_DE_NADO} horas seguidas para nadar.`)
      if (!forma) return avisarRevisar("Elegí cómo vas a pagar: efectivo o transferencia.")
    }
    if (paso === "ubicacion") {
      if (!ubicacion) return avisarRevisar("Elegí dónde se ubican: parrilla, gazebo o palapa.")
      if (ubicacion === "parrilla") {
        if (ocupan > MAX_PERSONAS_PARRILLA) return avisarRevisar(`Para más de ${MAX_PERSONAS_PARRILLA} personas les asignamos un quincho: escribinos por WhatsApp.`)
        const revision = revisarEleccion("parrilla", ocupan, parrilla.map((id) => inventario.find((unidad) => unidad.id === id)!).filter(Boolean))
        if (!revision.ok) return avisarRevisar(revision.mensaje)
      } else if (!playaLista) {
        return avisarRevisar(ubicacion === "gazebo" ? "No tenemos los gazebos necesarios para tu reserva: te recomendamos reservar una palapa." : "No quedan palapas para ese día: probá con un gazebo u otro día.")
      }
    }
    if (paso === "restaurante" && almuerzo === null) return avisarRevisar("Contanos si van a almorzar en el restaurante.")
    if (paso === "bungalows") {
      const revision = revisarEleccion("bungalow", ocupan, bungalows.map((id) => inventario.find((unidad) => unidad.id === id)!).filter(Boolean))
      if (!revision.ok) return avisarRevisar(revision.mensaje)
    }
    setErrores({})
    ir(pasos[indice + 1])
  }

  function confirmar() {
    const revision = esquemaDeContacto.safeParse(contacto)
    if (!revision.success) {
      avisarError("Revisá los datos de contacto.")
      marcar(camposDe(revision.error, "contacto"))
      return
    }
    if (!forma) return
    iniciar(async () => {
      const comun = { titular: { ...titular, notas: conNotas ? titular.notas : undefined }, contacto, token: modificar?.token }
      const resultado = await llamar(() =>
        tipo === "nado"
          ? reservarNado({ ...comun, fecha, horario, nadadores: grupo.adultos, club: club || undefined, forma })
          : tipo === "bungalow"
            ? reservarBungalow({ ...comun, fecha, bungalows, grupo })
            : reservarFinde({
                ...comun,
                fecha,
                grupo,
                forma,
                ubicacion: ubicacion!,
                parrilla: ubicacion === "parrilla" ? parrilla[0] : undefined,
                almuerzo: ubicacion === "parrilla" ? undefined : Boolean(almuerzo),
              }),
      )
      if (resultado.ok) {
        router.push(`/reserva/t/${resultado.token}?${modificar ? "modificada" : "nuevo"}=1`)
        return
      }
      avisarError(resultado.error)
      const campos = resultado.campos ?? {}
      const destino = pasoDelCampo(Object.keys(campos)[0] ?? "") ?? (/parrilla|gazebo|palapa|bungalow|lugar|reservó/i.test(resultado.error) ? (tipo === "bungalow" ? "bungalows" : "ubicacion") : null)
      if (destino && pasos.includes(destino)) setPaso(destino)
      marcar(campos)
    })
  }

  const nombreUbicacion = ubicaciones.find((item) => item.id === ubicacion)?.nombre
  const titularCompleto = [titular.nombre, titular.apellido].filter(Boolean).join(" ")

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <ol className="flex gap-1.5 md:gap-2" aria-label="Pasos de la reserva">
          {pasos.map((item, posicion) => (
            <li key={item} className="flex-1">
              <button
                type="button"
                disabled={posicion >= indice}
                onClick={() => setPaso(item)}
                aria-current={posicion === indice ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-start gap-1.5 text-left text-xs font-semibold md:text-sm",
                  posicion <= indice ? "text-ink" : "text-ink/40",
                  posicion < indice && "hover:text-orange",
                )}
              >
                <span className={cn("h-1.5 w-full rounded-full", posicion < indice ? "bg-orange" : posicion === indice ? "bg-ink" : "bg-ink/10")} />
                <span className="flex items-center gap-1">
                  {posicion < indice ? <Check className="size-3.5" aria-hidden /> : <span className="tabular-nums">{posicion + 1}.</span>}
                  <span className="hidden sm:inline">{nombresDePaso[item]}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <section className="rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
          <p className="kicker">Paso {indice + 1}</p>
          <h2 className="font-display mt-1 text-3xl tracking-tight">{tipo === "nado" && paso === "fecha" ? "¿Qué día y en qué horario nadan?" : titulos[paso]}</h2>

          <div className="mt-5">
            {paso === "personas" ? (
              <PasoGrupo
                tipo={tipo}
                grupo={grupo}
                onGrupo={cambiarGrupo}
                titular={titular}
                onTitular={(nuevo) => setTitular(nuevo)}
                conNotas={conNotas}
                onConNotas={setConNotas}
                club={club}
                onClub={setClub}
                errores={errores}
                onEditar={limpiar}
              />
            ) : null}

            {paso === "fecha" ? (
              <div className="space-y-6">
                <p className="text-ink/70">
                  {tipo === "bungalow"
                    ? "Los bungalows se alquilan por 2 días y 1 noche: entrando jueves (salen el viernes) o sábado (salen el domingo). Check in a las 10 y check out hasta las 18 del segundo día."
                    : "Elegí el día. En verde, los días en que el predio abre. El horario del predio es de 10 a 19."}
                </p>
                <CalendarioDisponible
                  categoria={tipo === "bungalow" ? "bungalow" : "visita"}
                  personas={ocupan}
                  modo="dia"
                  desde={fecha}
                  hasta={fecha}
                  sin={modificar?.token}
                  onElegir={(desde, _hasta, estado) => {
                    setFecha(desde)
                    setDia(estado?.dia ?? "finde")
                    setParrilla([])
                    setBungalows([])
                    setPlayaLista(false)
                  }}
                />
                {tipo === "nado" && fecha ? <ElegirFranja horario={horario} onChange={setHorario} /> : null}
                {fecha && cotizacion ? <ElegirForma tipo={tipo} dia={dia} cotizacion={cotizacion} forma={forma} onForma={setForma} /> : null}
              </div>
            ) : null}

            {paso === "ubicacion" ? (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {ubicaciones.map((item) => {
                    const elegido = ubicacion === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={elegido}
                        onClick={() => {
                          if (ubicacion === item.id) return
                          setUbicacion(item.id)
                          setParrilla([])
                          setPlayaLista(false)
                        }}
                        className={cn("overflow-hidden rounded-[1.2rem] border-2 bg-foam text-left", elegido ? "border-orange" : "border-ink/10")}
                      >
                        <span className="relative block aspect-[4/3]">
                          <Foto src={item.foto} alt={item.alt} sizes="(min-width: 1024px) 20vw, 33vw" className="size-full object-cover" />
                        </span>
                        <span className="flex items-center justify-between gap-1 px-2.5 py-2.5 sm:px-3">
                          <span className="font-display text-xl tracking-tight sm:text-2xl">{item.nombre}</span>
                          {elegido ? <Check className="size-5 shrink-0 text-orange" aria-hidden /> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {ubicacion === "parrilla" ? (
                  ocupan > MAX_PERSONAS_PARRILLA ? (
                    <AvisoDeWhatsapp texto={`Para grupos de más de ${MAX_PERSONAS_PARRILLA} personas les asignamos uno de nuestros quinchos.`} mensaje={`Hola, quiero reservar un quincho para ${ocupan} personas el ${fechaLarga(fecha).toLowerCase()}.`} />
                  ) : (
                    <PasoLugar tipo="parrilla" desde={fecha} hasta={fecha} personas={ocupan} elegidas={parrilla} onChange={cambiarParrilla} sin={modificar?.token} />
                  )
                ) : ubicacion ? (
                  <AsignacionDePlaya tipo={ubicacion} fecha={fecha} personas={ocupan} onLista={setPlayaLista} sin={modificar?.token} />
                ) : null}
                {ocupan < total ? (
                  <p className="text-sm text-ink/60">Los menores de 5 años no ocupan lugar: contamos {ocupan} {ocupan === 1 ? "persona" : "personas"}.</p>
                ) : null}
              </div>
            ) : null}

            {paso === "restaurante" ? <PasoAlmuerzo valor={almuerzo} onChange={setAlmuerzo} platos={carta} /> : null}

            {paso === "bungalows" ? (
              <PasoLugar tipo="bungalow" desde={fecha} hasta={sumarDiasIso(fecha, 1)} personas={ocupan} elegidas={bungalows} onChange={cambiarBungalows} sin={modificar?.token} />
            ) : null}

            {paso === "confirmar" ? (
              <div className="space-y-6">
                <dl className="space-y-2 text-sm">
                  <Resumen termino="A nombre de">{titularCompleto}</Resumen>
                  <Resumen termino={tipo === "bungalow" ? "Entrada" : "Día"}>{fecha ? fechaLarga(fecha) : "Falta elegir"}</Resumen>
                  {tipo === "bungalow" ? <Resumen termino="Salida">{fecha ? `${fechaLarga(sumarDiasIso(fecha, 1))}, hasta las 18` : ""}</Resumen> : null}
                  {tipo === "nado" ? (
                    <Resumen termino="Horario">
                      {textoDeHora(horario.desde)} a {textoDeHora(horario.hasta)}
                    </Resumen>
                  ) : null}
                  {tipo === "finde" ? <Resumen termino="Ubicación">{nombreUbicacion ?? "Falta elegir"}</Resumen> : null}
                  {tipo === "finde" && ubicacion !== "parrilla" ? <Resumen termino="Almuerzo en el restaurante">{almuerzo ? "Sí" : "No"}</Resumen> : null}
                  {tipo === "bungalow" ? <Resumen termino="Bungalows">{bungalows.map((id) => inventario.find((unidad) => unidad.id === id)?.etiqueta).join(", ")}</Resumen> : null}
                </dl>
                {cotizacion && forma ? <Presupuesto cotizacion={cotizacion} forma={forma} tipo={tipo} /> : null}
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
                      onChange={(valor) => {
                        limpiar("contacto.telefono")
                        setContacto({ ...contacto, telefono: valor.replace(/\D/g, "").slice(0, 13) })
                      }}
                    />
                    <Campo
                      id="contacto.email"
                      etiqueta="Correo (opcional)"
                      tipo="email"
                      autoComplete="email"
                      valor={contacto.email}
                      error={errores["contacto.email"]}
                      onChange={(valor) => {
                        limpiar("contacto.email")
                        setContacto({ ...contacto, email: valor })
                      }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-ink/55">Característica y número, sin 0 ni 15. Con este celular y el código de la reserva podés verla, cambiarla o cancelarla.</p>
                </fieldset>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink/10 pt-5">
            {indice > 0 ? (
              <button type="button" onClick={() => ir(pasos[indice - 1])} className="inline-flex items-center gap-2 font-semibold text-ink/70 hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden />
                Volver
              </button>
            ) : (
              <span />
            )}
            {paso !== "confirmar" ? (
              <Button type="button" className="h-12 px-6 text-base text-white" onClick={avanzar}>
                Continuar
              </Button>
            ) : (
              <Button type="button" disabled={enviando} className="h-12 px-6 text-base text-white" onClick={confirmar}>
                {enviando ? "Guardando…" : modificar ? "Guardar los cambios" : "Confirmar reserva"}
              </Button>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-4 rounded-[1.6rem] border-2 border-orange bg-white p-5 lg:sticky lg:top-28">
        <p className="kicker">{modificar ? "Tu reserva, con los cambios" : "Tu reserva"}</p>
        <dl className="space-y-2 text-sm">
          <Resumen termino={tipo === "nado" ? "Nadadores" : "Personas"}>
            {tipo === "nado" ? grupo.adultos : `${total}${grupo.sinCargo ? ` (${grupo.sinCargo} menor${grupo.sinCargo === 1 ? "" : "es"} de 5)` : ""}`}
          </Resumen>
          <Resumen termino="Día">{fecha ? fechaLarga(fecha) : "Falta elegir"}</Resumen>
          {tipo === "finde" ? <Resumen termino="Ubicación">{nombreUbicacion ?? "Falta elegir"}</Resumen> : null}
          <Resumen termino="Forma de pago">{forma ? (forma === "EFECTIVO" ? "Efectivo" : "Transferencia") : "Falta elegir"}</Resumen>
        </dl>
        {cotizacion && forma ? (
          <p className="font-display border-t border-ink/10 pt-4 text-4xl tracking-tight">{pesos(totalSegunForma(cotizacion, forma))}</p>
        ) : (
          <p className="border-t border-ink/10 pt-4 text-sm text-ink/60">El total aparece cuando elijas el día y la forma de pago.</p>
        )}
        <p className="text-xs leading-relaxed text-ink/55">
          {tipo === "bungalow" ? "El bungalow se paga por adelantado, por transferencia." : "No cobramos por adelantado: se paga al ingresar al predio."}
        </p>
      </aside>
    </div>
  )
}

function PasoGrupo({
  tipo,
  grupo,
  onGrupo,
  titular,
  onTitular,
  conNotas,
  onConNotas,
  club,
  onClub,
  errores,
  onEditar,
}: {
  tipo: TipoDeVisita
  grupo: Grupo
  onGrupo: (grupo: Grupo) => void
  titular: DatosParaModificar["titular"]
  onTitular: (titular: DatosParaModificar["titular"]) => void
  conNotas: boolean
  onConNotas: (valor: boolean) => void
  club: string
  onClub: (valor: string) => void
  errores: Record<string, string>
  onEditar: (campo: string) => void
}) {
  const cambiar = (campo: keyof DatosParaModificar["titular"], valor: string) => {
    onEditar(`titular.${campo}`)
    onTitular({ ...titular, [campo]: valor })
  }
  return (
    <div className="space-y-6">
      <div className="rounded-[1.4rem] border border-ink/10 bg-foam p-4">
        <h3 className="font-display text-2xl tracking-tight">{tipo === "nado" ? "Nadadores" : "Familia"}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {tipo === "nado" ? (
            <Contador etiqueta="Nadadores" detalle="Quienes van a nadar" minimo={1} valor={grupo.adultos} onChange={(valor) => onGrupo({ ...grupo, adultos: valor })} />
          ) : (
            <>
              <Contador etiqueta="Adultos" detalle="13 años o más" minimo={1} valor={grupo.adultos} onChange={(valor) => onGrupo({ ...grupo, adultos: valor })} />
              <Contador etiqueta="Menores" detalle="De 5 a 12 años" valor={grupo.menores} onChange={(valor) => onGrupo({ ...grupo, menores: valor })} />
              <Contador
                etiqueta="Menores de 5"
                detalle="No abonan entrada"
                maximo={30}
                valor={grupo.sinCargo}
                onChange={(valor) => onGrupo({ ...grupo, sinCargo: valor })}
              />
            </>
          )}
        </div>
        {tipo === "nado" ? <p className="mt-3 text-sm text-ink/65">La tarifa es por nadador e incluye solo el nado en aguas abiertas, no el resto de las actividades del predio.</p> : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="font-semibold">Reserva a nombre de</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="titular.nombre" etiqueta="Nombre" autoComplete="given-name" valor={titular.nombre} error={errores["titular.nombre"]} onChange={(valor) => cambiar("nombre", valor)} />
          <Campo id="titular.apellido" etiqueta="Apellido" autoComplete="family-name" valor={titular.apellido} error={errores["titular.apellido"]} onChange={(valor) => cambiar("apellido", valor)} />
          <Campo
            id="titular.dni"
            etiqueta="DNI"
            inputMode="numeric"
            placeholder="Solo números"
            valor={titular.dni}
            error={errores["titular.dni"]}
            onChange={(valor) => cambiar("dni", valor.replace(/\D/g, "").slice(0, 8))}
          />
        </div>
        {tipo === "nado" ? (
          <Campo id="club" etiqueta="Club o natatorio (opcional)" valor={club} error={errores.club} onChange={(valor) => onClub(valor.slice(0, 80))} />
        ) : null}
        {conNotas ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="titular.notas" className="text-sm font-semibold">
                Algo importante
              </label>
              <button type="button" onClick={() => onConNotas(false)} className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
                <X className="size-4" aria-hidden />
                Quitar
              </button>
            </div>
            <textarea
              id="titular.notas"
              rows={2}
              maxLength={200}
              value={titular.notas}
              onChange={(evento) => cambiar("notas", evento.target.value)}
              className="field-control mt-1.5 block w-full rounded-2xl px-4 py-3"
            />
            {errores["titular.notas"] ? <p className="mt-1 text-sm text-destructive">{errores["titular.notas"]}</p> : null}
          </div>
        ) : (
          <button type="button" onClick={() => onConNotas(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-lake-ink hover:underline">
            <Plus className="size-4" aria-hidden />
            Agregar algo importante
          </button>
        )}
      </fieldset>
    </div>
  )
}

function ElegirFranja({ horario, onChange }: { horario: Franja; onChange: (horario: Franja) => void }) {
  const horas = Array.from({ length: HORARIO_RESTAURANTE.cierra - HORARIO_RESTAURANTE.abre + 1 }, (_, indice) => HORARIO_RESTAURANTE.abre + indice)
  return (
    <fieldset className="rounded-2xl bg-sand px-4 py-4">
      <legend className="font-semibold">¿En qué horario nadan?</legend>
      <p className="mt-1 text-sm text-ink/65">Tocá la hora en que empiezan y después la hora en que terminan. Hasta {MAX_HORAS_DE_NADO} horas seguidas.</p>
      <div className="mt-3 grid max-w-xs grid-cols-1 gap-1">
        {horas.map((hora) => {
          const dentro = hora >= horario.desde && hora <= horario.hasta
          const puedeTerminar = hora > horario.desde && hora - horario.desde <= MAX_HORAS_DE_NADO
          return (
            <button
              key={hora}
              type="button"
              aria-pressed={dentro}
              onClick={() => {
                if (puedeTerminar && hora !== horario.hasta) onChange({ ...horario, hasta: hora })
                else if (hora < HORARIO_RESTAURANTE.cierra) onChange({ desde: hora, hasta: hora + 1 })
              }}
              className={cn(
                "flex h-11 items-center justify-between rounded-xl border px-4 text-left font-semibold tabular-nums",
                dentro ? "border-[#2f7d32] bg-[#4caf50] text-white" : "border-ink/10 bg-white hover:border-ink/30",
              )}
            >
              {textoDeHora(hora)}
              {hora === horario.desde ? <span className="text-xs">Empiezan</span> : hora === horario.hasta ? <span className="text-xs">Terminan</span> : null}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-sm font-semibold" role="status">
        Nadan de {textoDeHora(horario.desde)} a {textoDeHora(horario.hasta)} ({horario.hasta - horario.desde} {horario.hasta - horario.desde === 1 ? "hora" : "horas"}).
      </p>
    </fieldset>
  )
}

function ElegirForma({
  tipo,
  dia,
  cotizacion,
  forma,
  onForma,
}: {
  tipo: TipoDeVisita
  dia: TipoDeDia
  cotizacion: Cotizacion
  forma: FormaDePagoWeb | null
  onForma: (forma: FormaDePagoWeb) => void
}) {
  if (tipo === "bungalow") {
    return (
      <div className="rounded-2xl border-2 border-orange/40 bg-white p-4">
        <p className="font-semibold">Precio de la estadía</p>
        <p className="font-display mt-1 text-4xl tracking-tight">{pesos(cotizacion.total)}</p>
        <p className="mt-1 text-sm text-ink/70">
          {cotizacion.lineas.length} {cotizacion.lineas.length === 1 ? "bungalow" : "bungalows"} de hasta 4 personas, con la entrada incluida. Se paga por adelantado, por transferencia: al
          confirmar te mostramos los datos.
        </p>
      </div>
    )
  }
  const opciones: { id: FormaDePagoWeb; nombre: string; icono: ReactNode; detalle: string }[] = [
    { id: "EFECTIVO", nombre: "Efectivo", icono: <Banknote className="size-5" aria-hidden />, detalle: "Pagás al ingresar al predio" },
    { id: "TRANSFERENCIA", nombre: "Transferencia", icono: <Landmark className="size-5" aria-hidden />, detalle: tipo === "nado" ? "Al ingresar al predio" : "Al ingresar al predio, con recargo del 10 %" },
  ]
  return (
    <fieldset>
      <legend className="font-semibold">
        ¿Cómo vas a pagar? <span className="font-normal text-ink/60">· Tarifa de {nombreDelDia[dia].toLowerCase()}</span>
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {opciones.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            aria-pressed={forma === opcion.id}
            onClick={() => onForma(opcion.id)}
            className={cn("rounded-2xl border-2 p-4 text-left transition", forma === opcion.id ? "border-orange bg-orange/5" : "border-ink/10 bg-white hover:border-ink/30")}
          >
            <span className="flex items-center gap-2 font-semibold">
              {opcion.icono}
              {opcion.nombre}
              {forma === opcion.id ? <Check className="ml-auto size-5 text-orange" aria-hidden /> : null}
            </span>
            <span className="font-display mt-2 block text-3xl tracking-tight">{pesos(totalSegunForma(cotizacion, opcion.id))}</span>
            <span className="mt-1 block text-sm text-ink/60">{opcion.detalle}</span>
          </button>
        ))}
      </div>
      {forma ? <Presupuesto cotizacion={cotizacion} forma={forma} tipo={tipo} compacto /> : null}
      <p className="mt-3 text-sm text-ink/65">No cobramos por adelantado: tanto en efectivo como por transferencia, se paga al momento de ingresar al predio.</p>
    </fieldset>
  )
}

function Presupuesto({ cotizacion, forma, tipo, compacto = false }: { cotizacion: Cotizacion; forma: FormaDePagoWeb; tipo: TipoDeVisita; compacto?: boolean }) {
  return (
    <div className={cn(compacto ? "mt-4" : "")}>
      <ul className="space-y-1.5 text-sm">
        {lineasSegunForma(cotizacion, forma).map((linea) => (
          <li key={`${linea.concepto}-${linea.detalle}`} className="flex justify-between gap-3">
            <span>
              {linea.concepto}
              <span className="block text-xs text-ink/55">{linea.detalle}</span>
            </span>
            <span className="font-semibold">{pesos(linea.importe)}</span>
          </li>
        ))}
      </ul>
      {!compacto ? (
        <>
          <p className="font-display mt-3 text-4xl tracking-tight">{pesos(totalSegunForma(cotizacion, forma))}</p>
          <p className="mt-1 text-sm text-ink/70">
            {tipo === "nado"
              ? "Incluye solo el nado en aguas abiertas, no el resto de las actividades del predio."
              : tipo === "bungalow"
                ? "Incluye la entrada al predio. Se paga por adelantado, por transferencia."
                : "La entrada incluye las actividades. El restaurante se paga aparte, por lo que consuman."}
          </p>
        </>
      ) : null}
    </div>
  )
}

/// Gazebos y palapas los asigna el predio: el cliente solo ve si alcanzan.
function AsignacionDePlaya({ tipo, fecha, personas, onLista, sin }: { tipo: "gazebo" | "palapa"; fecha: string; personas: number; onLista: (lista: boolean) => void; sin?: string }) {
  const [libres, setLibres] = useState<number | null>(null)
  const [intento, setIntento] = useState(0)
  const necesarios = lugaresDePlayaPara(personas)

  useEffect(() => {
    const controlador = new AbortController()
    fetch(`/api/lugares?tipo=${tipo}&desde=${fecha}&hasta=${fecha}${sin ? `&sin=${sin}` : ""}`, { signal: controlador.signal })
      .then((respuesta) => respuesta.json())
      .then((json: { ok: boolean; error?: string; lugares?: LugarDisponible[] }) => {
        if (!json.ok || !json.lugares) throw new Error(json.error)
        setLibres(json.lugares.filter((lugar) => lugar.estado === "libre").length)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        avisarError(error instanceof Error && error.message ? error.message : falloDeRed().error, { id: "lugares", reintentar: () => setIntento((actual) => actual + 1) })
      })
    return () => controlador.abort()
  }, [tipo, fecha, sin, intento])

  useEffect(() => {
    onLista(libres !== null && libres >= necesarios)
  }, [libres, necesarios, onLista])

  const palabra = tipo === "gazebo" ? (necesarios === 1 ? "gazebo" : "gazebos") : necesarios === 1 ? "palapa" : "palapas"
  if (libres === null) return <p className="h-12 animate-pulse rounded-2xl bg-ink/5" aria-busy />
  if (libres < necesarios) {
    return (
      <p className="rounded-2xl bg-[#fde8e4] px-4 py-3 font-semibold text-[#a0261b]" role="alert">
        {tipo === "gazebo"
          ? "No tenemos los gazebos necesarios para tu reserva: te recomendamos reservar una palapa."
          : "No quedan palapas para reservar por la web ese día: probá con un gazebo, otro día o escribinos por WhatsApp."}
      </p>
    )
  }
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-green-soft px-4 py-3 text-sm font-semibold text-lime-ink" role="status">
      <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
      Listo: para {personas} {personas === 1 ? "persona" : "personas"} van {necesarios} {palabra} (hasta 4 personas cada {tipo === "gazebo" ? "uno" : "una"}). El predio te asigna cuál.
    </p>
  )
}

function PasoAlmuerzo({ valor, onChange, platos }: { valor: boolean | null; onChange: (valor: boolean) => void; platos: PlatoDeCarta[] }) {
  const grupos = porCategoria(platos)
  return (
    <div className="space-y-4">
      <p className="text-lg">¿Vas a almorzar en el restaurante?</p>
      <div className="grid max-w-sm grid-cols-2 gap-2">
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
      <p className="text-sm text-ink/65">Es para que el restaurante los espere: se paga aparte, por lo que consuman.</p>
      <div className="rounded-[1.4rem] border border-ink/10 bg-foam p-4">
        <h3 className="font-semibold">Menú del restaurante</h3>
        {grupos.length === 0 ? (
          <p className="mt-2 text-sm text-ink/65">Estamos actualizando la carta. Pedila en el lugar.</p>
        ) : (
          <div className="mt-2 max-h-96 space-y-4 overflow-y-auto pr-1">
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
  )
}

function AvisoDeWhatsapp({ texto, mensaje }: { texto: string; mensaje: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-4">
      <p className="font-semibold">{texto}</p>
      <a
        href={enlaceWhatsappDelPredio(mensaje)}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 font-bold text-white"
      >
        <MessageCircle className="size-5" aria-hidden />
        Comunicarse por WhatsApp
      </a>
    </div>
  )
}

function Resumen({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/60">{termino}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}
