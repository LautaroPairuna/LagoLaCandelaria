"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"

import { enviarPedidoDeGrupo } from "@/app/(sitio)/reserva/acciones"
import { Campo } from "@/components/reserva/campo"
import { Contador } from "@/components/reserva-nueva/contador"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Modulo } from "@/generated/prisma/enums"
import { avisarError, irAlPrimerCampo, llamar } from "@/lib/avisos"
import { hoyEnElPredio } from "@/lib/predio/fechas"
import { cn } from "cn"

type TipoDeGrupo = Extract<Modulo, "CAMPAMENTO" | "SALIDA_EDUCATIVA" | "VIAJE_EGRESADOS" | "ACTIVIDAD_AVENTURA">
type Dietas = { celiacos: number; vegetarianos: number; veganos: number }

const modalidadesDeCampamento = ["Jornada de aventura", "Carpa", "Dormis"]
const sinDietas: Dietas = { celiacos: 0, vegetarianos: 0, veganos: 0 }

export function FormularioGrupo({ tipo, modalidad }: { tipo: TipoDeGrupo; modalidad?: string }) {
  const router = useRouter()
  const hoy = hoyEnElPredio()
  const esAventura = tipo === "ACTIVIDAD_AVENTURA"
  const [datos, setDatos] = useState({
    institucion: "",
    direccion: "",
    nombre: "",
    apellido: "",
    cargo: "",
    telefono: "",
    email: "",
    edades: "",
    desde: "",
    hasta: "",
    modalidad: modalidad ?? (tipo === "CAMPAMENTO" ? modalidadesDeCampamento[0] : ""),
    observaciones: "",
  })
  const [participantes, setParticipantes] = useState(20)
  const [acompanantes, setAcompanantes] = useState(2)
  const [dietas, setDietas] = useState({ participantes: sinDietas, acompanantes: sinDietas })
  const [conDietas, setConDietas] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, iniciar] = useTransition()

  const cambiar = (clave: keyof typeof datos, valor: string) => setDatos((actual) => ({ ...actual, [clave]: valor }))

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErrores({})
    iniciar(async () => {
      const resultado = await llamar(() =>
        enviarPedidoDeGrupo({
          tipo,
          modalidad: datos.modalidad,
          institucion: datos.institucion,
          direccion: datos.direccion,
          responsable: { nombre: datos.nombre, apellido: datos.apellido, cargo: datos.cargo, telefono: datos.telefono, email: datos.email },
          participantes,
          edades: datos.edades,
          acompanantes,
          desde: datos.desde,
          hasta: datos.hasta || datos.desde,
          dietas: conDietas ? dietas : { participantes: sinDietas, acompanantes: sinDietas },
          observaciones: datos.observaciones,
        }),
      )
      if (resultado.ok) {
        router.push(`/reserva/t/${resultado.token}?nuevo=1`)
        return
      }
      avisarError(resultado.error)
      setErrores(resultado.campos ?? {})
      irAlPrimerCampo(resultado.campos)
    })
  }

  const participantesNombre = esAventura ? "Participantes" : "Alumnos"

  return (
    <form onSubmit={enviar} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <section className="rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
          <h2 className="font-display text-3xl tracking-tight">{esAventura ? "La institución o el club" : "El colegio"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo id="institucion" etiqueta={esAventura ? "Institución o club" : "Colegio o institución"} valor={datos.institucion} error={errores.institucion} onChange={(valor) => cambiar("institucion", valor)} />
            <Campo id="direccion" etiqueta="Dirección" valor={datos.direccion} error={errores.direccion} onChange={(valor) => cambiar("direccion", valor)} />
            <Campo id="responsable.nombre" etiqueta="Nombre del responsable" autoComplete="given-name" valor={datos.nombre} error={errores["responsable.nombre"]} onChange={(valor) => cambiar("nombre", valor)} />
            <Campo id="responsable.apellido" etiqueta="Apellido" autoComplete="family-name" valor={datos.apellido} error={errores["responsable.apellido"]} onChange={(valor) => cambiar("apellido", valor)} />
            <Campo id="responsable.cargo" etiqueta="Cargo" placeholder={esAventura ? "Profesor, coordinador…" : "Docente, directivo, mamá referente…"} valor={datos.cargo} error={errores["responsable.cargo"]} onChange={(valor) => cambiar("cargo", valor)} />
            <Campo id="responsable.telefono" etiqueta="Celular (sin 0 ni 15)" inputMode="numeric" placeholder="11 3009 1020" valor={datos.telefono} error={errores["responsable.telefono"]} onChange={(valor) => cambiar("telefono", valor.replace(/\D/g, "").slice(0, 10))} />
            <Campo id="responsable.email" etiqueta="Correo" tipo="email" autoComplete="email" valor={datos.email} error={errores["responsable.email"]} onChange={(valor) => cambiar("email", valor)} />
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
          <h2 className="font-display text-3xl tracking-tight">El grupo y las fechas</h2>
          {tipo === "CAMPAMENTO" ? (
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Modalidad</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {modalidadesDeCampamento.map((opcion) => (
                  <label
                    key={opcion}
                    className={cn(
                      "cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold",
                      datos.modalidad === opcion ? "border-orange bg-orange text-sobre-naranja" : "border-ink/10 bg-white",
                    )}
                  >
                    <input type="radio" name="modalidad" value={opcion} checked={datos.modalidad === opcion} onChange={() => cambiar("modalidad", opcion)} className="sr-only" />
                    {opcion}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <div className="mt-4 space-y-3">
            <Contador etiqueta={participantesNombre} detalle="Cantidad que ingresa" minimo={1} maximo={999} valor={participantes} onChange={setParticipantes} />
            <Contador etiqueta="Acompañantes" detalle="Docentes, padres o coordinadores" valor={acompanantes} onChange={setAcompanantes} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Campo id="edades" etiqueta={`Edad de los ${participantesNombre.toLowerCase()}`} placeholder="Ej.: 10 años, 6.º grado" valor={datos.edades} error={errores.edades} onChange={(valor) => cambiar("edades", valor)} />
            <label className="block" htmlFor="desde">
              <span className="text-sm font-semibold">Fecha de ingreso</span>
              <input id="desde" type="date" min={hoy} value={datos.desde} onChange={(evento) => cambiar("desde", evento.target.value)} required className="field-control mt-1.5 h-10 w-full rounded-lg border border-input bg-white px-3" />
            </label>
            <label className="block" htmlFor="hasta">
              <span className="text-sm font-semibold">Fecha de egreso</span>
              <input id="hasta" type="date" min={datos.desde || hoy} value={datos.hasta} onChange={(evento) => cambiar("hasta", evento.target.value)} className="field-control mt-1.5 h-10 w-full rounded-lg border border-input bg-white px-3" />
            </label>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6">
          <h2 className="font-display text-3xl tracking-tight">Comidas y observaciones</h2>
          <label className="mt-4 flex items-center gap-3 font-semibold">
            <input type="checkbox" checked={conDietas} onChange={(evento) => setConDietas(evento.target.checked)} className="size-5 accent-[#ff7a14]" />
            Hay {participantesNombre.toLowerCase()} o acompañantes con dieta especial
          </label>
          {conDietas ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="text-left text-ink/60">
                    <th className="py-2 font-semibold" />
                    <th className="py-2 font-semibold">Celíacos</th>
                    <th className="py-2 font-semibold">Vegetarianos</th>
                    <th className="py-2 font-semibold">Veganos</th>
                  </tr>
                </thead>
                <tbody>
                  {(["participantes", "acompanantes"] as const).map((quien) => (
                    <tr key={quien} className="border-t border-ink/10">
                      <th className="py-2 pr-3 text-left font-semibold">{quien === "participantes" ? participantesNombre : "Acompañantes"}</th>
                      {(["celiacos", "vegetarianos", "veganos"] as const).map((dieta) => (
                        <td key={dieta} className="py-2 pr-3">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            aria-label={`${dieta} entre ${quien}`}
                            value={dietas[quien][dieta]}
                            onChange={(evento) =>
                              setDietas((actual) => ({ ...actual, [quien]: { ...actual[quien], [dieta]: Math.max(0, Math.min(99, Number(evento.target.value) || 0)) } }))
                            }
                            className="field-control h-10 w-20 rounded-lg border border-input bg-white px-3"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <label className="mt-4 block" htmlFor="observaciones">
            <span className="text-sm font-semibold">Observaciones que quieras contarnos</span>
            <Textarea id="observaciones" value={datos.observaciones} maxLength={1000} onChange={(evento) => cambiar("observaciones", evento.target.value)} className="mt-1.5 min-h-28 bg-white" />
          </label>
        </section>
      </div>

      <aside className="space-y-4 rounded-[1.6rem] border-2 border-orange bg-white p-5 lg:sticky lg:top-28">
        <p className="kicker">Pedido de servicio</p>
        <p className="font-display text-3xl tracking-tight">
          {participantes} {participantesNombre.toLowerCase()} + {acompanantes} acompañantes
        </p>
        <p className="text-sm leading-relaxed text-ink/70">
          Este formulario es un pedido de servicio. El predio arma el presupuesto según la propuesta y las bonificaciones, y la reserva
          se confirma con el pago del 50 % del total. Pagando en efectivo, 10 % menos.
        </p>
        <Button type="submit" disabled={enviando || !datos.desde} className="h-14 w-full text-base">
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </aside>
    </form>
  )
}
