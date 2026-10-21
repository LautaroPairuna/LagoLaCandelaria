"use client"

import { ArrowDown, ArrowUp, Film, ImagePlus, Images, Plus, RotateCcw, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"

import { guardarContenido, restaurarContenido } from "@/app/panel/sitio/acciones"
import { Foto } from "@/components/foto"
import { avisarError, conAviso, llamar } from "@/lib/avisos"
import { videosDelSitio, type Campo, type CampoDeFoto, type CampoDeLista, type CampoDeTexto, type CampoDeVideo, type FotoConTexto, type VideoDeFondo } from "@/lib/contenido/campos"
import type { Fallo } from "@/lib/errores"
import { esFotoValida, fotoUrl } from "@/lib/fotos"
import { cn } from "cn"

type Valor = Record<string, unknown>
type Ruta = (string | number)[]

type Contexto = {
  errores: Record<string, string>
  fotosDelSitio: string[]
  puedeSubir: boolean
  cambiar: (ruta: Ruta, valor: unknown) => void
}

const campoDeTexto = "mt-1 block w-full rounded-xl border border-panel-line bg-white px-3 py-2.5 text-base text-panel-ink aria-invalid:border-[#c0392b]"
const tarjeta = "rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5"
const botonChico = "inline-flex h-9 items-center gap-1.5 rounded-full border border-panel-line bg-white px-3 text-sm font-semibold hover:border-panel-muted disabled:opacity-40"

function conCambio(objeto: unknown, ruta: Ruta, valor: unknown): unknown {
  if (ruta.length === 0) return valor
  const [paso, ...resto] = ruta
  if (Array.isArray(objeto)) return objeto.map((item, indice) => (indice === paso ? conCambio(item, resto, valor) : item))
  const actual = (objeto ?? {}) as Valor
  return { ...actual, [paso]: conCambio(actual[paso as string], resto, valor) }
}

function vacio(campos: Campo[]): Valor {
  return Object.fromEntries(
    campos.map((campo) => [
      campo.clave,
      campo.tipo === "texto" ? "" : campo.tipo === "foto" ? { src: "", alt: "" } : campo.tipo === "video" ? { src: "", poster: "" } : Array.from({ length: campo.min }, () => vacio(campo.campos)),
    ]),
  )
}

const id = (ruta: Ruta) => ruta.join(".")

export function EditorDeSeccion({
  clave,
  campos,
  valor,
  guardado,
  fotosDelSitio,
  puedeSubir,
}: {
  clave: string
  campos: Campo[]
  valor: Valor
  guardado: boolean
  fotosDelSitio: string[]
  puedeSubir: boolean
}) {
  const [base, setBase] = useState(valor)
  const [datos, setDatos] = useState(valor)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [pendiente, iniciar] = useTransition()
  const cambiado = JSON.stringify(datos) !== JSON.stringify(base)

  // Avisa antes de salir con cambios sin guardar; se arma solo mientras los hay.
  useEffect(() => {
    if (!cambiado) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [cambiado])

  const contexto: Contexto = {
    errores,
    fotosDelSitio,
    puedeSubir,
    cambiar: (ruta, nuevo) => {
      setDatos((actual) => conCambio(actual, ruta, nuevo) as Valor)
      const editado = id(ruta)
      setErrores((actuales) => Object.fromEntries(Object.entries(actuales).filter(([clave]) => clave !== editado && !clave.startsWith(`${editado}.`))))
    },
  }

  function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    iniciar(async () => {
      const resultado = await conAviso(() => guardarContenido(clave, datos), "Listo, ya se ve en la página.")
      if (resultado.ok) {
        setBase(resultado.valor as Valor)
        setDatos(resultado.valor as Valor)
        setErrores({})
      } else {
        setErrores((resultado as Fallo).campos ?? {})
      }
    })
  }

  function restaurar() {
    if (!window.confirm("¿Volver al texto original de esta sección? Se pierde lo que se cambió.")) return
    iniciar(async () => {
      const resultado = await conAviso(() => restaurarContenido(clave), "Volvió al texto original.")
      if (resultado.ok) window.location.reload()
    })
  }

  return (
    <form onSubmit={guardar} noValidate className="mt-6 space-y-4">
      <Campos campos={campos} valor={datos} ruta={[]} contexto={contexto} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-panel-line bg-white/95 px-4 py-3 backdrop-blur lg:left-60 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pendiente || !cambiado} className="h-11 rounded-full bg-panel-ink px-6 font-semibold text-white hover:bg-panel-tostado disabled:opacity-50">
            {pendiente ? "Guardando…" : "Guardar cambios"}
          </button>
          {cambiado ? (
            <button type="button" onClick={() => (setDatos(base), setErrores({}))} className="text-sm font-semibold text-panel-muted hover:text-panel-ink">
              Descartar
            </button>
          ) : (
            <span className="text-sm text-panel-muted" role="status">
              Sin cambios por guardar
            </span>
          )}
          {guardado ? (
            <button type="button" onClick={restaurar} disabled={pendiente} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-panel-muted hover:text-panel-ink">
              <RotateCcw className="size-4" aria-hidden />
              Volver al texto original
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function Campos({ campos, valor, ruta, contexto }: { campos: Campo[]; valor: Valor; ruta: Ruta; contexto: Contexto }) {
  return campos.map((campo) => {
    const rutaDelCampo = [...ruta, campo.clave]
    if (campo.tipo === "texto") return <CampoTexto key={campo.clave} campo={campo} valor={String(valor[campo.clave] ?? "")} ruta={rutaDelCampo} contexto={contexto} />
    if (campo.tipo === "foto") return <CampoFoto key={campo.clave} campo={campo} valor={valor[campo.clave] as FotoConTexto} ruta={rutaDelCampo} contexto={contexto} />
    if (campo.tipo === "video") return <CampoVideo key={campo.clave} campo={campo} valor={valor[campo.clave] as VideoDeFondo} ruta={rutaDelCampo} contexto={contexto} />
    return <CampoLista key={campo.clave} campo={campo} valor={(valor[campo.clave] as Valor[]) ?? []} ruta={rutaDelCampo} contexto={contexto} />
  })
}

function ErrorDeCampo({ ruta, contexto }: { ruta: Ruta; contexto: Contexto }) {
  const mensaje = contexto.errores[id(ruta)]
  return mensaje ? (
    <span id={`${id(ruta)}-error`} className="mt-1 block text-sm font-semibold text-[#c0392b]">
      {mensaje}
    </span>
  ) : null
}

function CampoTexto({ campo, valor, ruta, contexto }: { campo: CampoDeTexto; valor: string; ruta: Ruta; contexto: Contexto }) {
  const conError = Boolean(contexto.errores[id(ruta)])
  const propiedades = {
    id: id(ruta),
    value: valor,
    maxLength: campo.max,
    "aria-invalid": conError || undefined,
    "aria-describedby": conError ? `${id(ruta)}-error` : undefined,
    className: campoDeTexto,
  }
  return (
    <label className="block text-sm font-semibold text-panel-muted" htmlFor={id(ruta)}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-panel-ink">{campo.etiqueta}</span>
        <span className="text-xs font-normal tabular-nums">
          {valor.length}/{campo.max}
        </span>
      </span>
      {campo.ayuda ? <span className="block text-xs font-normal">{campo.ayuda}</span> : null}
      {campo.multilinea ? (
        <textarea {...propiedades} rows={3} onChange={(evento) => contexto.cambiar(ruta, evento.target.value)} />
      ) : (
        <input
          {...propiedades}
          type={campo.formato === "email" ? "email" : campo.formato === "telefono" ? "tel" : "text"}
          inputMode={campo.formato === "telefono" ? "tel" : undefined}
          onChange={(evento) => contexto.cambiar(ruta, evento.target.value)}
        />
      )}
      <ErrorDeCampo ruta={ruta} contexto={contexto} />
    </label>
  )
}

function CampoFoto({ campo, valor, ruta, contexto }: { campo: CampoDeFoto; valor: FotoConTexto | undefined; ruta: Ruta; contexto: Contexto }) {
  const foto = valor ?? { src: "", alt: "" }
  const [eligiendo, setEligiendo] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const archivo = useRef<HTMLInputElement>(null)

  async function subir(evento: React.ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0]
    evento.target.value = ""
    if (!elegido) return
    setSubiendo(true)
    const cuerpo = new FormData()
    cuerpo.set("foto", elegido)
    const resultado = await llamar(async () => (await fetch("/api/subir/foto", { method: "POST", body: cuerpo })).json() as Promise<{ ok: true; src: string } | Fallo>)
    setSubiendo(false)
    if (resultado.ok) contexto.cambiar([...ruta, "src"], resultado.src)
    else avisarError(resultado.error)
  }

  return (
    <div className="text-sm">
      <p className="font-semibold text-panel-ink">{campo.etiqueta}</p>
      <div className="mt-1 grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-panel">
          {esFotoValida(foto.src) ? (
            <Foto src={foto.src} alt="" sizes="12rem" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center px-3 text-center text-xs text-panel-muted">Sin foto elegida</span>
          )}
          {subiendo ? <span className="absolute inset-0 grid place-items-center bg-white/80 text-xs font-semibold">Subiendo y optimizando…</span> : null}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEligiendo(true)} className={botonChico}>
              <Images className="size-4" aria-hidden />
              Elegir del sitio
            </button>
            {contexto.puedeSubir ? (
              <>
                <button type="button" onClick={() => archivo.current?.click()} disabled={subiendo} className={botonChico}>
                  <ImagePlus className="size-4" aria-hidden />
                  Subir foto
                </button>
                <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic" onChange={subir} className="hidden" />
              </>
            ) : (
              <span className="self-center text-xs text-panel-muted">Para subir fotos falta configurar la carpeta del servidor.</span>
            )}
          </div>
          <ErrorDeCampo ruta={[...ruta, "src"]} contexto={contexto} />
          <CampoTexto
            campo={{ tipo: "texto", clave: "alt", etiqueta: "Qué se ve en la foto", ayuda: "Lo leen quienes no pueden verla y también Google.", max: 200 }}
            valor={foto.alt}
            ruta={[...ruta, "alt"]}
            contexto={contexto}
          />
        </div>
      </div>
      {eligiendo ? (
        <ElegirFoto
          fotos={contexto.fotosDelSitio}
          onCerrar={() => setEligiendo(false)}
          onElegir={(src) => {
            contexto.cambiar([...ruta, "src"], src)
            setEligiendo(false)
          }}
        />
      ) : null}
    </div>
  )
}

const nombreDeVideo: Record<string, string> = { "/hero.mp4": "Portada", "/para-quien.mp4": "Cómo reservar", "/ubicacion.mp4?v=5": "Ubicación" }
const posterDeVideo: Record<string, string> = { "/hero.mp4": "/posters/hero.jpg", "/para-quien.mp4": "/posters/para-quien.jpg", "/ubicacion.mp4?v=5": "/posters/ubicacion.jpg" }
const esperar = (milisegundos: number) => new Promise((listo) => setTimeout(listo, milisegundos))

type RespuestaDeVideo = ({ ok: true } & ({ estado: "procesando"; id?: string } | { estado: "listo"; src: string; poster: string } | { estado: "error"; error: string })) | Fallo

function CampoVideo({ campo, valor, ruta, contexto }: { campo: CampoDeVideo; valor: VideoDeFondo | undefined; ruta: Ruta; contexto: Contexto }) {
  const video = valor ?? { src: "", poster: "" }
  const [aviso, setAviso] = useState<string | null>(null)
  const archivo = useRef<HTMLInputElement>(null)
  const montado = useRef(true)
  // Corta la espera del procesamiento si se sale de la página.
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  async function subir(evento: React.ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0]
    evento.target.value = ""
    if (!elegido) return
    setAviso("Subiendo el video…")
    const subida = await llamar(async () =>
      (
        await fetch("/api/subir/video", {
          method: "POST",
          body: elegido,
          headers: { "Content-Type": elegido.type || "video/mp4", "X-Nombre": encodeURIComponent(elegido.name) },
        })
      ).json() as Promise<{ ok: true; id: string } | Fallo>,
    )
    if (!subida.ok) {
      setAviso(null)
      return avisarError(subida.error)
    }
    setAviso("Procesando el video para la web. Puede tardar unos minutos; no cierres esta página.")
    for (let intento = 0; intento < 400 && montado.current; intento += 1) {
      await esperar(3000)
      const estado = await llamar(async () => (await fetch(`/api/subir/video?id=${subida.id}`)).json() as Promise<RespuestaDeVideo>)
      if (estado.ok && estado.estado === "procesando") continue
      setAviso(null)
      if (estado.ok && estado.estado === "listo") return contexto.cambiar(ruta, { src: estado.src, poster: estado.poster })
      return avisarError(estado.ok ? (estado.estado === "error" ? estado.error : "") : estado.error)
    }
    setAviso(null)
  }

  return (
    <div className="text-sm">
      <p className="font-semibold text-panel-ink">{campo.etiqueta}</p>
      {campo.ayuda ? <p className="text-xs text-panel-muted">{campo.ayuda}</p> : null}
      <div className="mt-1 grid gap-3 sm:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-panel">
          {video.src ? (
            <video key={video.src} src={video.src} poster={esFotoValida(video.poster) ? fotoUrl(video.poster, 640) : undefined} muted loop playsInline controls preload="metadata" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-xs text-panel-muted">Sin video elegido</span>
          )}
          {aviso ? <span className="absolute inset-0 grid place-items-center bg-white/85 px-4 text-center text-xs font-semibold">{aviso}</span> : null}
        </div>
        <div className="min-w-0 space-y-2">
          {contexto.puedeSubir ? (
            <>
              <button type="button" onClick={() => archivo.current?.click()} disabled={aviso !== null} className={botonChico}>
                <Film className="size-4" aria-hidden />
                Subir video
              </button>
              <input ref={archivo} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" onChange={subir} className="hidden" />
              <p className="text-xs text-panel-muted">MP4 o MOV de hasta 300 MB. Se deja en 720p, sin sonido y hasta 1 minuto; la imagen de espera sale del primer cuadro.</p>
            </>
          ) : (
            <p className="text-xs text-panel-muted">Para subir videos falta configurar la carpeta del servidor.</p>
          )}
          <label className="block text-xs font-semibold text-panel-muted">
            O usar uno de los del sitio
            <select
              value={videosDelSitio.includes(video.src) ? video.src : ""}
              onChange={(evento) => evento.target.value && contexto.cambiar(ruta, { src: evento.target.value, poster: posterDeVideo[evento.target.value] })}
              className="mt-1 block h-10 w-full rounded-xl border border-panel-line bg-white px-3 text-sm text-panel-ink"
            >
              <option value="">{videosDelSitio.includes(video.src) ? "" : "Video subido"}</option>
              {videosDelSitio.map((src) => (
                <option key={src} value={src}>
                  {nombreDeVideo[src]}
                </option>
              ))}
            </select>
          </label>
          <ErrorDeCampo ruta={[...ruta, "src"]} contexto={contexto} />
        </div>
      </div>
    </div>
  )
}

function ElegirFoto({ fotos, onElegir, onCerrar }: { fotos: string[]; onElegir: (src: string) => void; onCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  // Se abre como modal al montarse: así el foco queda adentro y Escape lo cierra.
  useEffect(() => {
    dialogo.current?.showModal()
  }, [])
  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      aria-labelledby="elegir-foto-titulo"
      className="m-auto max-h-[85svh] w-[min(56rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 backdrop:bg-black/50"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-panel-line bg-white px-5 py-3">
        <h2 id="elegir-foto-titulo" className="font-display text-2xl tracking-tight">
          Fotos del sitio
        </h2>
        <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cerrar" className="grid size-10 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4">
        {fotos.map((src) => (
          <li key={src}>
            <button type="button" onClick={() => onElegir(src)} className="block w-full overflow-hidden rounded-2xl ring-panel-naranja hover:ring-4 focus-visible:ring-4">
              <span className="block aspect-[4/3]">
                <Foto src={src} alt={src.split("/").pop() ?? ""} sizes="14rem" className="size-full object-cover" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  )
}

function CampoLista({ campo, valor, ruta, contexto }: { campo: CampoDeLista; valor: Valor[]; ruta: Ruta; contexto: Contexto }) {
  const mover = (desde: number, hasta: number) => {
    const copia = [...valor]
    const [item] = copia.splice(desde, 1)
    copia.splice(hasta, 0, item)
    contexto.cambiar(ruta, copia)
  }
  return (
    <section className={tarjeta} aria-labelledby={`${id(ruta)}-titulo`}>
      <h2 id={`${id(ruta)}-titulo`} className="font-display text-2xl tracking-tight">
        {campo.etiqueta}
      </h2>
      {campo.ayuda ? <p className="mt-1 text-sm text-panel-muted">{campo.ayuda}</p> : null}
      <ErrorDeCampo ruta={ruta} contexto={contexto} />
      <ol className="mt-4 space-y-4">
        {valor.map((item, indice) => {
          const nombre = campo.nombres?.[indice] ?? (campo.titulo && String(item[campo.titulo] ?? "").trim()) ?? ""
          return (
            <li key={indice} className="rounded-2xl border border-panel-line p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">{nombre || `${campo.item} ${indice + 1}`}</p>
                {campo.fija ? null : (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => mover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${campo.item.toLowerCase()} ${indice + 1}`} className={botonChico}>
                      <ArrowUp className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => mover(indice, indice + 1)} disabled={indice === valor.length - 1} aria-label={`Bajar ${campo.item.toLowerCase()} ${indice + 1}`} className={botonChico}>
                      <ArrowDown className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => contexto.cambiar(ruta, valor.filter((_, otro) => otro !== indice))}
                      disabled={valor.length <= campo.min}
                      aria-label={`Quitar ${campo.item.toLowerCase()} ${indice + 1}`}
                      className={cn(botonChico, "text-[#a0261b]")}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Campos campos={campo.campos} valor={item} ruta={[...ruta, indice]} contexto={contexto} />
              </div>
            </li>
          )
        })}
      </ol>
      {campo.fija || valor.length >= campo.max ? null : (
        <button type="button" onClick={() => contexto.cambiar(ruta, [...valor, vacio(campo.campos)])} className={cn(botonChico, "mt-4")}>
          <Plus className="size-4" aria-hidden />
          Agregar {campo.item.toLowerCase()}
        </button>
      )}
    </section>
  )
}
