"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Check, GraduationCap, Users } from "lucide-react"
import { toast } from "sonner"

import { Aviso, Campo } from "@/components/reserva/campo"
import { CalendarioEstadia } from "@/components/reserva/calendario-estadia"
import { GrillaUnidades } from "@/components/reserva/grilla-unidades"
import { PasoPersonas } from "@/components/reserva/paso-personas"
import { TicketAcciones } from "@/components/reserva/ticket-acciones"
import { TicketVista } from "@/components/reserva/ticket-vista"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { horas, mesaDe, mesasDe, tiposLugar, unidadDe, unidadesDe } from "@/lib/inventario"
import { pesos, precioBungalowPorNoche } from "@/lib/predio/tarifas"
import { reservaMessages, visitorMessage } from "@/lib/reserva"
import {
  advertenciaCapacidad,
  borradorInicial,
  cantidadPersonas,
  compilar,
  esFecha,
  fechaCorta,
  fechaLarga,
  hastaEfectivo,
  necesariosDe,
  pasosDe,
  prepararBorrador,
  primerError,
  textoDelEfectivo,
  textoDelTotal,
  validarPaso,
  type Borrador,
  type Errores,
  type Estadia,
  type SolicitudGuardada,
  type TipoGrupo,
} from "@/lib/solicitud"
import { cn } from "cn"

export type SugerenciaReserva = {
  tipo?: TipoGrupo
  estadia?: Estadia
  restaurante?: "si"
}

const textos: Record<string, { titulo: string; texto: string; accion: string }> = {
  grupo: {
    titulo: "¿Cómo es tu grupo?",
    texto: "Una sola elección. Después la reserva sigue por familias o por institución.",
    accion: "Elegí una de estas dos opciones.",
  },
  personas: {
    titulo: "¿Quiénes ingresan?",
    texto: "Cada familia tiene un responsable. Con el botón +, sumá a quienes vienen con esa familia o a otra familia en la misma reserva.",
    accion: "Completá los datos. El botón con + suma personas o familias.",
  },
  institucion: {
    titulo: "¿Qué institución reserva?",
    texto: "No hace falta el DNI de cada estudiante. Alcanza la institución, un responsable y el tamaño del grupo.",
    accion: "Completá los tres bloques, de arriba hacia abajo.",
  },
  tiempo: {
    titulo: "¿Cuánto tiempo se quedan?",
    texto: "Primero si es el día o con noche. Después la fecha. Al final, el horario de entrada y de salida.",
    accion: "Seguí el orden: tipo de visita, fecha y horarios.",
  },
  lugar: {
    titulo: "¿Dónde quieren estar?",
    texto: "Tocá los lugares libres. El borde naranja marca lo elegido. Lo ocupado no se puede tocar.",
    accion: "Tocá cada lugar que quieras reservar.",
  },
  mesa: {
    titulo: "¿Reservan mesa?",
    texto: "Restaurante, bar de playa, los dos o ninguno. Si decís que no, seguís a la confirmación.",
    accion: "Respondé sí o no. Si es sí, elegí las mesas libres.",
  },
  confirmar: {
    titulo: "Revisá y confirmá",
    texto: "A la derecha está todo lo cargado y el total. Si algo no cierra, volvé al paso anterior.",
    accion: "Dejá a quién le queda el ticket y confirmá.",
  },
}

function opcionClase(activa: boolean) {
  return cn(
    "group relative rounded-[1.4rem] border-2 border-orange px-5 py-5 pr-24 text-left transition",
    activa ? "bg-orange text-white" : "bg-white text-ink hover:bg-[#fff7f0]",
  )
}

function TarjetaOpcion({
  activa,
  onClick,
  children,
}: {
  activa: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className={opcionClase(activa)} aria-pressed={activa} data-selected={activa ? "" : undefined} onClick={onClick}>
      <span className={cn("absolute top-4 right-4 text-xs font-bold", activa ? "text-white" : "text-orange")}>
        {activa ? "Elegido" : "Elegir"}
      </span>
      {children}
    </button>
  )
}

function alternar(lista: string[], id: string) {
  return lista.includes(id) ? lista.filter((item) => item !== id) : [...lista, id]
}

function pasoDeClave(clave: string, tipo: Borrador["tipo"]) {
  if (clave.startsWith("familias")) return "personas"
  if (
    clave.startsWith("responsableInstitucion") ||
    ["institucion", "cargo", "estudiantes", "adultos", "cudEstudiantes", "edadesGrupo", "notasGrupo"].includes(clave)
  ) {
    return "institucion"
  }
  if (clave.startsWith("lugar") || clave === "lugares") return "lugar"
  if (clave === "restaurante" || clave === "bar" || clave.startsWith("mesas")) return "mesa"
  if (clave === "tipo") return "grupo"
  if (["estadia", "desde", "hasta", "ingreso", "salida"].includes(clave)) return "tiempo"
  if (clave.startsWith("contacto") && tipo === "estudiantil") return "institucion"
  return "confirmar"
}

export function AsistenteReserva({ sugerencia }: { sugerencia?: SugerenciaReserva }) {
  const [borrador, setBorrador] = useState<Borrador>(() => {
    const inicial = borradorInicial()
    if (sugerencia?.tipo) inicial.tipo = sugerencia.tipo
    if (sugerencia?.estadia) inicial.estadia = sugerencia.estadia
    if (sugerencia?.restaurante) inicial.restaurante = sugerencia.restaurante
    return inicial
  })
  const [indice, setIndice] = useState(0)
  const [errores, setErrores] = useState<Errores>({})
  const [ocupados, setOcupados] = useState<string[]>([])
  const [consulta, setConsulta] = useState<{ clave: string; estado: "lista" | "ciega" } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [formError, setFormError] = useState("")
  const [ticket, setTicket] = useState<{ id: string; solicitud: SolicitudGuardada; qr?: string } | null>(null)

  const pasos = pasosDe(borrador.tipo)
  const paso = pasos[Math.min(indice, pasos.length - 1)]
  const copia = textos[paso.id]
  const personas = cantidadPersonas(borrador)
  const desde = borrador.desde
  const hasta = hastaEfectivo(borrador)

  const previa = useMemo(() => {
    const tiempoOk = Object.keys(validarPaso("tiempo", borrador)).length === 0
    const genteOk =
      borrador.tipo === "estudiantil"
        ? Object.keys(validarPaso("institucion", borrador)).length === 0
        : borrador.tipo === "familiar" && Object.keys(validarPaso("personas", borrador)).length === 0
    if (!tiempoOk || !genteOk) return null
    return compilar(prepararBorrador(borrador), "PREVIA")
  }, [borrador])

  const clave =
    (paso.id === "lugar" || paso.id === "mesa") && esFecha(desde) && esFecha(hasta)
      ? `${paso.id}|${desde}|${hasta}`
      : null
  const disponibilidad = !clave ? "lista" : consulta?.clave === clave ? consulta.estado : "cargando"

  useEffect(() => {
    if (!clave) return
    const [, inicio, fin] = clave.split("|")
    const controlador = new AbortController()
    fetch(`/api/disponibilidad?desde=${inicio}&hasta=${fin}`, { signal: controlador.signal })
      .then((respuesta) => respuesta.json())
      .then((datos: { ok?: boolean; ocupados?: string[] }) => {
        const lista = datos.ok ? (datos.ocupados ?? []) : []
        setConsulta({ clave, estado: datos.ok ? "lista" : "ciega" })
        setOcupados(lista)
        setBorrador((actual) => {
          const lugares = actual.lugares.filter((id) => !lista.includes(id))
          const mesasRestaurante = actual.mesasRestaurante.filter((id) => !lista.includes(id))
          const mesasBar = actual.mesasBar.filter((id) => !lista.includes(id))
          if (
            lugares.length === actual.lugares.length &&
            mesasRestaurante.length === actual.mesasRestaurante.length &&
            mesasBar.length === actual.mesasBar.length
          ) {
            return actual
          }
          return { ...actual, lugares, mesasRestaurante, mesasBar }
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setConsulta({ clave, estado: "ciega" })
      })
    return () => controlador.abort()
  }, [clave])

  function ir(siguiente: number) {
    setErrores({})
    setFormError("")
    setIndice(siguiente)
    window.setTimeout(() => {
      document.getElementById("paso-titulo")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)
  }

  function continuar() {
    const listo = prepararBorrador(borrador)
    const hallados = validarPaso(paso.id, listo, ocupados)
    setErrores(hallados)
    if (Object.keys(hallados).length > 0) {
      setFormError("Revisá lo marcado en este paso para seguir.")
      const clave = primerError(hallados)
      if (clave) document.getElementById(clave)?.focus()
      return
    }
    if (paso.id === "personas" && !borrador.contacto.nombre.trim()) {
      const responsable = borrador.familias[0]?.responsable
      if (responsable) {
        setBorrador({
          ...borrador,
          contacto: { ...borrador.contacto, nombre: responsable.nombre, apellido: responsable.apellido },
        })
      }
    }
    ir(indice + 1)
  }

  async function confirmar() {
    const listo = prepararBorrador(borrador)
    const hallados: Errores = {}
    for (const item of pasos) Object.assign(hallados, validarPaso(item.id, listo, ocupados))
    if (Object.keys(hallados).length > 0) {
      setErrores(hallados)
      setFormError("Falta algo antes de confirmar.")
      const destino = pasos.findIndex((item) => item.id === pasoDeClave(primerError(hallados) ?? "", listo.tipo))
      if (destino >= 0) setIndice(destino)
      return
    }

    setEnviando(true)
    setFormError("")
    try {
      const respuesta = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listo),
      })
      const datos = (await respuesta.json().catch(() => null)) as {
        ok?: boolean
        id?: string
        message?: string
        fields?: Errores
        ocupados?: string[]
        solicitud?: SolicitudGuardada
      } | null

      if (!respuesta.ok || !datos?.ok || !datos.id || !datos.solicitud) {
        if (datos?.ocupados?.length) setOcupados(datos.ocupados)
        if (datos?.fields) {
          setErrores(datos.fields)
          const destino = pasos.findIndex((item) => item.id === pasoDeClave(primerError(datos.fields ?? {}) ?? "", listo.tipo))
          if (destino >= 0) setIndice(destino)
        }
        const mensaje = visitorMessage(datos?.message, respuesta.status)
        setFormError(mensaje)
        toast.error(mensaje)
        setEnviando(false)
        return
      }

      const enlace = `${window.location.origin}/reserva/t/${datos.id}`
      let qr: string | undefined
      try {
        const QRCode = (await import("qrcode")).default
        qr = await QRCode.toDataURL(enlace, { margin: 1, width: 280 })
      } catch {
        qr = undefined
      }
      setTicket({ id: datos.id, solicitud: datos.solicitud, qr })
      toast.success("La solicitud quedó registrada.")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setFormError(reservaMessages.offline)
      toast.error(reservaMessages.offline)
    } finally {
      setEnviando(false)
    }
  }

  if (ticket) {
    const enlace = `${window.location.origin}/reserva/t/${ticket.id}`
    return (
      <div className="space-y-6">
        <div className="no-print">
          <p className="kicker">Solicitud lista</p>
          <h2 className="font-display mt-2 text-4xl tracking-tight md:text-5xl">Este es tu ticket.</h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/75">
            Descargalo o guardalo como PDF. En el ingreso alcanzá con el QR: el predio ve la solicitud completa.
          </p>
        </div>
        <TicketVista solicitud={ticket.solicitud} qrDataUrl={ticket.qr} enlace={enlace} />
        <TicketAcciones solicitud={ticket.solicitud} qrDataUrl={ticket.qr} enlace={enlace} />
        <button
          type="button"
          className="no-print text-sm text-ink/70 underline-offset-4 hover:underline"
          onClick={() => {
            setTicket(null)
            setBorrador(borradorInicial())
            setIndice(0)
            setErrores({})
            setOcupados([])
          }}
        >
          Armar otra reserva
        </button>
      </div>
    )
  }

  const numeroPaso = pasos.findIndex((item) => item.id === paso.id) + 1
  const accion =
    paso.id === "confirmar" && borrador.tipo === "estudiantil"
      ? "Revisá a la derecha que los datos y el total estén bien."
      : copia.accion

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
      <div className="min-w-0">
        <ol className="no-print flex gap-2 overflow-x-auto pb-2" aria-label="Pasos de la reserva">
          {pasos.map((item, posicion) => {
            const actual = item.id === paso.id
            const hecho = posicion < indice
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!hecho}
                  onClick={() => ir(posicion)}
                  aria-current={actual ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold whitespace-nowrap",
                    actual && "border-orange bg-orange text-white",
                    hecho && "border-transparent bg-green-soft text-lime-ink",
                    !actual && !hecho && "border-ink/10 bg-white text-ink/45",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs",
                      actual ? "bg-white text-orange" : "bg-white text-ink",
                    )}
                  >
                    {hecho ? <Check className="size-3.5" aria-hidden /> : posicion + 1}
                  </span>
                  {item.label}
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-6">
          <p className="kicker">
            Paso {numeroPaso} de {pasos.length}
          </p>
          <h2 id="paso-titulo" className="font-display mt-2 scroll-mt-28 text-4xl tracking-tight md:text-5xl">
            {copia.titulo}
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/75">{copia.texto}</p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.6rem] border-[3px] border-orange bg-white shadow-[0_12px_32px_rgba(255,122,20,0.16)]">
          <div className="flex items-start gap-3 bg-orange px-4 py-4 text-white md:px-6">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-orange">
              {numeroPaso}
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.16em] uppercase">Acá elegís y completás</p>
              <p className="mt-1 text-base font-bold leading-snug">{accion}</p>
            </div>
          </div>
          <div className="space-y-5 p-4 md:p-6">
            {formError ? <Aviso>{formError}</Aviso> : null}
            {paso.id === "grupo" ? <PasoGrupo borrador={borrador} error={errores.tipo} onChange={setBorrador} /> : null}
            {paso.id === "personas" ? (
              <PasoPersonas borrador={borrador} errores={errores} onChange={setBorrador} />
            ) : null}
            {paso.id === "institucion" ? (
              <PasoInstitucion borrador={borrador} errores={errores} onChange={setBorrador} />
            ) : null}
            {paso.id === "tiempo" ? <PasoTiempo borrador={borrador} errores={errores} onChange={setBorrador} /> : null}
            {paso.id === "lugar" ? (
              <PasoLugar
                borrador={borrador}
                errores={errores}
                ocupados={ocupados}
                personas={personas}
                disponibilidad={disponibilidad}
                onChange={setBorrador}
              />
            ) : null}
            {paso.id === "mesa" ? (
              <PasoMesa
                borrador={borrador}
                errores={errores}
                ocupados={ocupados}
                personas={personas}
                disponibilidad={disponibilidad}
                onChange={setBorrador}
              />
            ) : null}
            {paso.id === "confirmar" ? (
              <PasoConfirmar borrador={borrador} errores={errores} previa={previa} onChange={setBorrador} />
            ) : null}
          </div>
        </div>

        <div className="no-print mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {indice > 0 ? (
            <Button type="button" variant="outline" className="h-14 px-6 text-base font-bold" onClick={() => ir(indice - 1)}>
              Volver al paso anterior
            </Button>
          ) : null}
          {paso.id === "confirmar" ? (
            <Button type="button" className="h-14 px-8 text-base" disabled={enviando} onClick={confirmar}>
              {enviando ? "Generando la solicitud…" : "Confirmar solicitud"}
            </Button>
          ) : (
            <Button type="button" className="h-14 px-8 text-base" onClick={continuar}>
              Continuar
            </Button>
          )}
        </div>
      </div>

      <PanelReserva borrador={borrador} previa={previa} />
    </div>
  )
}

function PasoGrupo({
  borrador,
  error,
  onChange,
}: {
  borrador: Borrador
  error?: string
  onChange: (borrador: Borrador) => void
}) {
  function elegir(tipo: TipoGrupo) {
    onChange({ ...borrador, tipo })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TarjetaOpcion activa={borrador.tipo === "familiar"} onClick={() => elegir("familiar")}>
          <Users className="text-lake-ink group-data-[selected]:text-white" />
          <span className="font-display mt-4 block text-3xl tracking-tight">Grupo familiar</span>
          <span className="mt-2 block text-sm leading-relaxed text-ink/75 group-data-[selected]:text-white/90">
            Parejas, una familia, varias familias juntas, una persona sola o un grupo de amigos.
          </span>
        </TarjetaOpcion>
        <TarjetaOpcion activa={borrador.tipo === "estudiantil"} onClick={() => elegir("estudiantil")}>
          <GraduationCap className="text-lake-ink group-data-[selected]:text-white" />
          <span className="font-display mt-4 block text-3xl tracking-tight">Grupo estudiantil</span>
          <span className="mt-2 block text-sm leading-relaxed text-ink/75 group-data-[selected]:text-white/90">
            Escuela, curso, egresados o un contingente que reserva cupo.
          </span>
        </TarjetaOpcion>
      </div>
      {error ? <Aviso>{error}</Aviso> : null}
    </div>
  )
}

function PasoInstitucion({
  borrador,
  errores,
  onChange,
}: {
  borrador: Borrador
  errores: Errores
  onChange: (borrador: Borrador) => void
}) {
  const responsable = borrador.responsableInstitucion
  function setResponsable(parcial: Partial<typeof responsable>) {
    onChange({ ...borrador, responsableInstitucion: { ...responsable, ...parcial } })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-cream p-4">
        <h3 className="font-display text-2xl tracking-tight">1. La institución</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo id="institucion" etiqueta="Institución" valor={borrador.institucion} error={errores.institucion} onChange={(institucion) => onChange({ ...borrador, institucion })} />
          <Campo id="cargo" etiqueta="Cargo de quien reserva" valor={borrador.cargo} error={errores.cargo} onChange={(cargo) => onChange({ ...borrador, cargo })} />
        </div>
      </section>

      <section className="rounded-2xl bg-cream p-4">
        <h3 className="font-display text-2xl tracking-tight">2. El responsable</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">Una sola persona de contacto. El resto del grupo se cuenta en el bloque de abajo.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo id="responsableInstitucion.nombre" etiqueta="Nombre del responsable" autoComplete="given-name" valor={responsable.nombre} error={errores["responsableInstitucion.nombre"]} onChange={(nombre) => setResponsable({ nombre })} />
          <Campo id="responsableInstitucion.apellido" etiqueta="Apellido" autoComplete="family-name" valor={responsable.apellido} error={errores["responsableInstitucion.apellido"]} onChange={(apellido) => setResponsable({ apellido })} />
          <Campo id="responsableInstitucion.dni" etiqueta="DNI" inputMode="numeric" valor={responsable.dni} error={errores["responsableInstitucion.dni"]} onChange={(dni) => setResponsable({ dni })} />
          <Campo id="responsableInstitucion.edad" etiqueta="Edad" inputMode="numeric" valor={responsable.edad} error={errores["responsableInstitucion.edad"]} onChange={(edad) => setResponsable({ edad })} />
          <Campo id="contacto.email" etiqueta="Correo" tipo="email" autoComplete="email" inputMode="email" valor={borrador.contacto.email} error={errores["contacto.email"]} onChange={(email) => onChange({ ...borrador, contacto: { ...borrador.contacto, email } })} />
          <Campo id="contacto.telefono" etiqueta="Teléfono" tipo="tel" autoComplete="tel" inputMode="tel" valor={borrador.contacto.telefono} error={errores["contacto.telefono"]} onChange={(telefono) => onChange({ ...borrador, contacto: { ...borrador.contacto, telefono } })} />
        </div>
      </section>

      <section className="rounded-2xl bg-cream p-4">
        <h3 className="font-display text-2xl tracking-tight">3. Cuántos vienen</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo id="estudiantes" etiqueta="Estudiantes" inputMode="numeric" valor={borrador.estudiantes} error={errores.estudiantes} onChange={(estudiantes) => onChange({ ...borrador, estudiantes })} />
          <Campo id="adultos" etiqueta="Adultos a cargo" inputMode="numeric" valor={borrador.adultos} error={errores.adultos} onChange={(adultos) => onChange({ ...borrador, adultos })} />
          <Campo id="cudEstudiantes" etiqueta="Estudiantes con certificado CUD" inputMode="numeric" valor={borrador.cudEstudiantes} error={errores.cudEstudiantes} onChange={(cudEstudiantes) => onChange({ ...borrador, cudEstudiantes })} />
          <Campo id="edadesGrupo" etiqueta="Edades del grupo" valor={borrador.edadesGrupo} error={errores.edadesGrupo} placeholder="Por ejemplo: 6.º grado, 11 y 12 años" onChange={(edadesGrupo) => onChange({ ...borrador, edadesGrupo })} />
        </div>
        <label className="mt-4 block" htmlFor="notasGrupo">
          <span className="font-bold tracking-[0.12em] text-earth-ink uppercase">Importante</span>
          <span className="mt-1 block text-sm text-ink/70">
            Alergias, discapacidades o algo del grupo que el personal tenga que saber.
          </span>
          <Textarea
            id="notasGrupo"
            value={borrador.notasGrupo}
            onChange={(event) => onChange({ ...borrador, notasGrupo: event.target.value })}
            className="mt-2 min-h-28 bg-[#fffdf8] px-3 py-3 text-base"
          />
        </label>
        {errores.notasGrupo ? <div className="mt-3"><Aviso>{errores.notasGrupo}</Aviso></div> : null}
      </section>
    </div>
  )
}

function PasoTiempo({
  borrador,
  errores,
  onChange,
}: {
  borrador: Borrador
  errores: Errores
  onChange: (borrador: Borrador) => void
}) {
  function estadia(valor: Estadia) {
    onChange({
      ...borrador,
      estadia: valor,
      hasta: valor === "dia" ? borrador.desde : borrador.hasta === borrador.desde ? "" : borrador.hasta,
      ingreso: valor === "noche" ? "11:00" : "10:00",
      salida: valor === "noche" ? "11:00" : "18:00",
      lugares: valor === "noche" ? borrador.lugares : borrador.lugares.filter((id) => unidadDe(id)?.tipo !== "bungalow"),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold tracking-[0.12em] text-[#c85a08] uppercase">1. Tipo de visita</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <TarjetaOpcion activa={borrador.estadia === "dia"} onClick={() => estadia("dia")}>
            <span className="font-display block text-3xl tracking-tight">Solo el día</span>
            <span className="mt-2 block text-sm leading-relaxed text-ink/75 group-data-[selected]:text-white/90">Entran y se van el mismo día. El predio, los findes y feriados, abre de 10 a 19.</span>
          </TarjetaOpcion>
          <TarjetaOpcion activa={borrador.estadia === "noche"} onClick={() => estadia("noche")}>
            <span className="font-display block text-3xl tracking-tight">Hospedarse</span>
            <span className="mt-2 block text-sm leading-relaxed text-ink/75 group-data-[selected]:text-white/90">Pasan al menos una noche. Sirve para bungalow y para quedarse en el predio.</span>
          </TarjetaOpcion>
        </div>
      </div>
      {errores.estadia ? <Aviso>{errores.estadia}</Aviso> : null}

      {borrador.estadia ? (
        <div className="rounded-[1.6rem] bg-cream p-4 md:p-5">
          <p className="text-sm font-bold tracking-[0.12em] text-[#c85a08] uppercase">2. Fecha</p>
          <div className="mt-3">
            <CalendarioEstadia
              modo={borrador.estadia}
              desde={borrador.desde}
              hasta={borrador.estadia === "dia" ? borrador.desde : borrador.hasta}
              onChange={(desdeFecha, hastaFecha) => onChange({ ...borrador, desde: desdeFecha, hasta: hastaFecha })}
            />
          </div>
          {errores.desde ? <div className="mt-3"><Aviso>{errores.desde}</Aviso></div> : null}
          {errores.hasta ? <div className="mt-3"><Aviso>{errores.hasta}</Aviso></div> : null}
          {borrador.desde ? (
            <p className="mt-4 font-semibold">
              {borrador.estadia === "dia" || !borrador.hasta || borrador.hasta === borrador.desde
                ? fechaLarga(borrador.desde)
                : `${fechaLarga(borrador.desde)} al ${fechaLarga(borrador.hasta)}`}
            </p>
          ) : (
            <p className="mt-4 text-sm font-semibold text-ink/70">
              {borrador.estadia === "dia" ? "Tocá el día de la visita." : "Tocá el día de llegada y el día de salida."}
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-ink">Después de elegir el tipo de visita aparece el calendario.</p>
      )}

      {borrador.estadia ? (
        <div className="rounded-[1.6rem] bg-cream p-4 md:p-5">
          <p className="text-sm font-bold tracking-[0.12em] text-[#c85a08] uppercase">3. Horarios</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block" htmlFor="ingreso">
              <span className="text-sm font-semibold">Horario aproximado de ingreso</span>
              <select
                id="ingreso"
                className="field-control mt-1.5 w-full"
                value={borrador.ingreso}
                onChange={(event) => onChange({ ...borrador, ingreso: event.target.value })}
              >
                {horas.map((hora) => (
                  <option key={hora} value={hora}>
                    {hora}
                  </option>
                ))}
              </select>
            </label>
            <label className="block" htmlFor="salida">
              <span className="text-sm font-semibold">Horario aproximado de salida</span>
              <select
                id="salida"
                className="field-control mt-1.5 w-full"
                value={borrador.salida}
                onChange={(event) => onChange({ ...borrador, salida: event.target.value })}
              >
                {horas.map((hora) => (
                  <option key={hora} value={hora}>
                    {hora}
                  </option>
                ))}
              </select>
              {errores.salida ? <span className="mt-1 block text-sm text-destructive">{errores.salida}</span> : null}
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PasoLugar({
  borrador,
  errores,
  ocupados,
  personas,
  disponibilidad,
  onChange,
}: {
  borrador: Borrador
  errores: Errores
  ocupados: string[]
  personas: number
  disponibilidad: "lista" | "cargando" | "ciega"
  onChange: (borrador: Borrador) => void
}) {
  return (
    <div className="space-y-5">
      <Leyenda />
      {disponibilidad === "cargando" ? <Aviso tono="info">Estamos mirando qué lugares están libres en esas fechas.</Aviso> : null}
      {disponibilidad === "ciega" ? (
        <Aviso tono="info">No pudimos leer otras reservas. Si un lugar se ocupó, te lo vamos a decir al confirmar.</Aviso>
      ) : null}
      {errores.lugares ? <Aviso>{errores.lugares}</Aviso> : null}
      {tiposLugar.map((tipo) => {
        const elegidas = borrador.lugares.filter((id) => unidadDe(id)?.tipo === tipo.id)
        const necesarias = necesariosDe(personas, tipo.capacidad)
        const total = unidadesDe(tipo.id).length
        const bloqueado =
          tipo.soloHospedaje && borrador.estadia !== "noche"
            ? "Los bungalows son para quedarse a dormir, como mínimo una noche. Si querés una casa, volvé al paso del tiempo y elegí hospedaje."
            : undefined
        const aviso = bloqueado
          ? null
            : advertenciaCapacidad({
              personas,
              capacidad: tipo.capacidad,
              elegidas: elegidas.length,
              total,
              singular: tipo.singular,
              plural: tipo.plural,
              genero: tipo.genero,
            })
        const listo =
          !bloqueado && elegidas.length > 0 && elegidas.length >= necesarias
            ? `${
                elegidas.length === 1
                  ? `${tipo.genero === "m" ? "El" : "La"} ${tipo.singular} alcanza`
                  : `${tipo.genero === "m" ? "Los" : "Las"} ${elegidas.length} ${tipo.plural} alcanzan`
              } para ${personas} personas.`
            : null
        return (
          <GrillaUnidades
            key={tipo.id}
            tipo={tipo.id}
            titulo={tipo.nombre}
            explica={
              tipo.id === "bungalow"
                ? `${tipo.explica} Desde ${pesos(precioBungalowPorNoche(2))} por noche según cuántos duermen, con la entrada incluida.`
                : `${tipo.explica} Está incluido en la entrada.`
            }
            ayuda={
              bloqueado
                ? undefined
                : necesarias > total
                  ? `Para ${personas} personas este lugar no alcanza solo: cada ${tipo.singular} es para ${tipo.capacidad}.`
                  : `Si reservás ${tipo.singular}, necesitás ${necesarias} para las ${personas} personas.`
            }
            aviso={aviso}
            listo={listo}
            bloqueado={bloqueado}
            items={unidadesDe(tipo.id)}
            seleccion={borrador.lugares}
            ocupados={ocupados}
            onToggle={(id) => onChange({ ...borrador, lugares: alternar(borrador.lugares, id) })}
          />
        )
      })}
    </div>
  )
}

function PasoMesa({
  borrador,
  errores,
  ocupados,
  personas,
  disponibilidad,
  onChange,
}: {
  borrador: Borrador
  errores: Errores
  ocupados: string[]
  personas: number
  disponibilidad: "lista" | "cargando" | "ciega"
  onChange: (borrador: Borrador) => void
}) {
  return (
    <div className="space-y-8">
      {disponibilidad === "cargando" ? <Aviso tono="info">Estamos mirando qué mesas están libres.</Aviso> : null}
      <BloqueMesa
        pregunta="¿Querés reservar una mesa del restaurante?"
        detalle="La mesa del predio, adentro. Reservarla no suma al total: se consume en el lugar."
        valor={borrador.restaurante}
        error={errores.restaurante}
        onSi={() => onChange({ ...borrador, restaurante: "si" })}
        onNo={() => onChange({ ...borrador, restaurante: "no", mesasRestaurante: [] })}
      />
      {borrador.restaurante === "si" ? (
        <GrillaMesas
          tipo="mesa"
          titulo="Restaurante"
          ids={borrador.mesasRestaurante}
          zona="restaurante"
          personas={personas}
          ocupados={ocupados}
          error={errores.mesasRestaurante}
          onToggle={(id) => onChange({ ...borrador, mesasRestaurante: alternar(borrador.mesasRestaurante, id) })}
        />
      ) : null}

      <BloqueMesa
        pregunta="¿Y del bar?"
        detalle="El bar de playa, afuera, entre una actividad y la otra."
        valor={borrador.bar}
        error={errores.bar}
        onSi={() => onChange({ ...borrador, bar: "si" })}
        onNo={() => onChange({ ...borrador, bar: "no", mesasBar: [] })}
      />
      {borrador.bar === "si" ? (
        <GrillaMesas
          tipo="mesa"
          titulo="Bar de playa"
          ids={borrador.mesasBar}
          zona="bar"
          personas={personas}
          ocupados={ocupados}
          error={errores.mesasBar}
          onToggle={(id) => onChange({ ...borrador, mesasBar: alternar(borrador.mesasBar, id) })}
        />
      ) : null}
    </div>
  )
}

function BloqueMesa({
  pregunta,
  detalle,
  valor,
  error,
  onSi,
  onNo,
}: {
  pregunta: string
  detalle: string
  valor: Borrador["restaurante"]
  error?: string
  onSi: () => void
  onNo: () => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-3xl tracking-tight">{pregunta}</h3>
      <p className="text-sm leading-relaxed text-ink/70">{detalle}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TarjetaOpcion activa={valor === "si"} onClick={onSi}>
          <span className="font-display block text-2xl tracking-tight group-data-[selected]:text-white">Sí, elegir mesa</span>
        </TarjetaOpcion>
        <TarjetaOpcion activa={valor === "no"} onClick={onNo}>
          <span className="font-display block text-2xl tracking-tight group-data-[selected]:text-white">No, seguir sin mesa</span>
        </TarjetaOpcion>
      </div>
      {error ? <Aviso>{error}</Aviso> : null}
    </div>
  )
}

function GrillaMesas({
  titulo,
  ids,
  zona,
  personas,
  ocupados,
  error,
  onToggle,
}: {
  tipo: "mesa"
  titulo: string
  ids: string[]
  zona: "restaurante" | "bar"
  personas: number
  ocupados: string[]
  error?: string
  onToggle: (id: string) => void
}) {
  const suma = ids.reduce((total, id) => total + (mesaDe(id)?.capacidad ?? 0), 0)
  const aviso =
    ids.length === 0
      ? error
      : suma < personas
        ? `Sumá otra mesa: declaraste ${personas} personas y las mesas elegidas alcanzan para ${suma}.`
        : null
  const listo = ids.length > 0 && suma >= personas ? `Las mesas suman ${suma} lugares para ${personas} personas.` : null

  return (
    <GrillaUnidades
      tipo="mesa"
      titulo={titulo}
      explica="Elegí mesas libres hasta cubrir al grupo. Podés sumar más de una."
      ayuda={`Necesitás ${personas} lugares.`}
      aviso={aviso}
      listo={listo}
      items={mesasDe(zona)}
      seleccion={ids}
      ocupados={ocupados}
      onToggle={onToggle}
    />
  )
}

function PasoConfirmar({
  borrador,
  errores,
  previa,
  onChange,
}: {
  borrador: Borrador
  errores: Errores
  previa: SolicitudGuardada | null
  onChange: (borrador: Borrador) => void
}) {
  return (
    <div className="space-y-4">
      {borrador.tipo === "familiar" ? (
        <div className="rounded-2xl bg-cream p-4 md:p-5">
          <h3 className="font-display text-3xl tracking-tight">¿A quién le queda el ticket?</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            Es quien concreta la solicitud. El QR y el teléfono de contacto quedan a su nombre. El resto de la reserva y el total están a la derecha.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo id="contacto.nombre" etiqueta="Nombre" autoComplete="given-name" valor={borrador.contacto.nombre} error={errores["contacto.nombre"]} onChange={(nombre) => onChange({ ...borrador, contacto: { ...borrador.contacto, nombre } })} />
            <Campo id="contacto.apellido" etiqueta="Apellido" autoComplete="family-name" valor={borrador.contacto.apellido} error={errores["contacto.apellido"]} onChange={(apellido) => onChange({ ...borrador, contacto: { ...borrador.contacto, apellido } })} />
            <Campo id="contacto.email" etiqueta="Correo" tipo="email" autoComplete="email" inputMode="email" valor={borrador.contacto.email} error={errores["contacto.email"]} onChange={(email) => onChange({ ...borrador, contacto: { ...borrador.contacto, email } })} />
            <Campo id="contacto.telefono" etiqueta="Teléfono" tipo="tel" autoComplete="tel" inputMode="tel" valor={borrador.contacto.telefono} error={errores["contacto.telefono"]} onChange={(telefono) => onChange({ ...borrador, contacto: { ...borrador.contacto, telefono } })} />
          </div>
        </div>
      ) : (
        <p className="text-base leading-relaxed text-ink">
          El detalle de la solicitud y la suma del total están en la columna de la derecha. Si falta algo, confirmar te devuelve al paso que corresponda.
        </p>
      )}
      {previa ? null : <Aviso>Faltan personas o la fecha para armar el total. Volvé a esos pasos.</Aviso>}
    </div>
  )
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function listaCorta(items: string[]) {
  if (items.length <= 3) return items.join(", ")
  return `${items.slice(0, 2).join(", ")} y ${items.length - 2} más`
}

function PanelReserva({
  borrador,
  previa,
}: {
  borrador: Borrador
  previa: SolicitudGuardada | null
}) {
  const filas: { etiqueta: string; valor: string }[] = []

  if (borrador.tipo) {
    filas.push({ etiqueta: "Grupo", valor: borrador.tipo === "familiar" ? "Familiar" : "Estudiantil" })
  }

  if (borrador.tipo === "familiar") {
    const nombres = borrador.familias
      .flatMap((familia) => [familia.responsable, ...familia.integrantes])
      .map((persona) => `${persona.nombre.trim()} ${persona.apellido.trim()}`.trim())
      .filter((nombre) => nombre.length >= 2)
    if (nombres.length > 0) {
      const familias = borrador.familias.length
      filas.push({
        etiqueta: "Personas",
        valor: `${listaCorta(nombres)} · ${familias} ${familias === 1 ? "familia" : "familias"}`,
      })
    }
  }

  if (borrador.tipo === "estudiantil" && (borrador.institucion.trim() || borrador.estudiantes.trim() || borrador.adultos.trim())) {
    const partes = [
      borrador.institucion.trim(),
      borrador.estudiantes.trim() ? `${borrador.estudiantes.trim()} estudiantes` : "",
      borrador.adultos.trim() && borrador.adultos.trim() !== "0" ? `${borrador.adultos.trim()} adultos` : "",
    ].filter(Boolean)
    if (partes.length > 0) filas.push({ etiqueta: "Institución", valor: partes.join(" · ") })
  }

  if (borrador.estadia) {
    const modo = borrador.estadia === "dia" ? "Día" : "Hospedaje"
    const fecha = esFecha(borrador.desde)
      ? borrador.estadia === "noche" && esFecha(borrador.hasta)
        ? `${fechaCorta(borrador.desde)} al ${fechaCorta(borrador.hasta)}`
        : fechaCorta(borrador.desde)
      : ""
    filas.push({
      etiqueta: "Fecha",
      valor: [modo, fecha, `${borrador.ingreso} a ${borrador.salida}`].filter(Boolean).join(" · "),
    })
  }

  if (borrador.tipo === "familiar" && borrador.lugares.length > 0) {
    const nombres = borrador.lugares.flatMap((id) => {
      const lugar = unidadDe(id)
      return lugar ? [capitalizar(lugar.nombre)] : []
    })
    if (nombres.length > 0) filas.push({ etiqueta: "Lugar", valor: listaCorta(nombres) })
  }

  if (borrador.tipo === "familiar" && (borrador.restaurante || borrador.bar)) {
    const mesas = [
      ...borrador.mesasRestaurante.flatMap((id) => {
        const mesa = mesaDe(id)
        return mesa ? [`Restaurante ${capitalizar(mesa.nombre)}`] : []
      }),
      ...borrador.mesasBar.flatMap((id) => {
        const mesa = mesaDe(id)
        return mesa ? [`Bar ${capitalizar(mesa.nombre)}`] : []
      }),
    ]
    if (mesas.length > 0) filas.push({ etiqueta: "Mesa", valor: listaCorta(mesas) })
    else if (borrador.restaurante !== "si" && borrador.bar !== "si") filas.push({ etiqueta: "Mesa", valor: "Sin mesa" })
  }

  const contacto = `${borrador.contacto.nombre.trim()} ${borrador.contacto.apellido.trim()}`.trim()
  if (borrador.contacto.email.trim() || borrador.contacto.telefono.trim()) {
    filas.push({
      etiqueta: "Contacto",
      valor: [contacto, borrador.contacto.telefono.trim()].filter(Boolean).join(" · "),
    })
  }

  return (
    <aside
      className="no-print overflow-hidden rounded-[1.6rem] border-2 border-ink/15 bg-white lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100svh-7rem)] lg:flex-col"
      aria-live="polite"
    >
      <div className="border-b border-ink/10 px-5 py-4">
        <p className="text-xs font-bold tracking-[0.16em] text-orange uppercase">Tu reserva</p>
      </div>

      <div className="px-5 py-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {filas.length === 0 ? (
          <p className="py-4 text-sm leading-relaxed text-ink/70">Acá vas a ver el resumen de cada paso.</p>
        ) : (
          <dl>
            {filas.map((fila) => (
              <div key={fila.etiqueta} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-ink/10 py-3 last:border-b-0">
                <dt className="text-xs font-bold tracking-[0.12em] text-ink/45 uppercase">{fila.etiqueta}</dt>
                <dd className="text-sm font-semibold leading-snug">{fila.valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="bg-orange px-5 py-4 text-white">
        <p className="text-xs font-bold tracking-[0.16em] uppercase">Total</p>
        {previa ? (
          <>
            <p className="font-display mt-1 text-4xl tracking-tight">{textoDelTotal(previa.cotizacion)}</p>
            {textoDelEfectivo(previa.cotizacion) ? (
              <p className="mt-1 text-sm font-semibold text-white/90">{textoDelEfectivo(previa.cotizacion)}</p>
            ) : null}
            <ul className="mt-3 space-y-1.5">
              {previa.cotizacion.lineas.map((linea) => (
                <li key={`${linea.concepto}-${linea.detalle}`} className="flex items-baseline justify-between gap-3 text-sm text-white/90">
                  <span>{linea.concepto}</span>
                  <span className="shrink-0 font-bold text-white">{pesos(linea.importe)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-white/90">Aparece con las personas y la fecha.</p>
        )}
      </div>
    </aside>
  )
}


function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-2 text-sm font-semibold">
      <li className="inline-flex items-center gap-2 rounded-full border-2 border-orange bg-white px-3 py-1.5 text-ink">
        Libre
      </li>
      <li className="inline-flex items-center gap-2 rounded-full border-2 border-orange bg-orange px-3 py-1.5 text-white">
        Elegido
      </li>
      <li className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/50 px-3 py-1.5 text-ink/45">
        Ocupado
      </li>
    </ul>
  )
}
