"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useState, useTransition } from "react"

import { borrarItemDeMenu, cambiarDisponible, guardarItemDeMenu } from "@/app/panel/locales/acciones"
import { Button } from "@/components/ui/button"
import { avisarError, avisarExito, avisarRevisar, conAviso, llamar } from "@/lib/avisos"
import type { ItemDelMenu } from "@/lib/panel/cuentas"
import { porCategoria, type Local } from "@/lib/panel/local"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

const campo = "mt-1 block h-11 w-full rounded-xl border bg-white px-3 text-base text-panel-ink"

function Error({ texto }: { texto?: string }) {
  return texto ? (
    <span role="alert" className="mt-1 block text-sm font-semibold text-[#a32020]">
      {texto}
    </span>
  ) : null
}

function FormularioDePlato({
  local,
  categorias,
  item,
  onListo,
}: {
  local: Local
  categorias: string[]
  item?: ItemDelMenu
  onListo: () => void
}) {
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [pendiente, iniciar] = useTransition()
  const borde = (nombre: string) => (errores[nombre] ? "border-[#c62828] ring-2 ring-[#c62828]/20" : "border-panel-line")
  const lista = `categorias-${local}-${item?.id ?? "nuevo"}`

  return (
    <form
      className="grid gap-3 rounded-2xl bg-panel p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.6fr_0.8fr_auto] lg:items-start"
      onSubmit={(evento) => {
        evento.preventDefault()
        const formulario = evento.currentTarget
        const datos = new FormData(formulario)
        const texto = (clave: string) => String(datos.get(clave) ?? "").trim()
        const pedido = {
          id: item?.id,
          local,
          categoria: texto("categoria"),
          nombre: texto("nombre"),
          descripcion: texto("descripcion") || undefined,
          precio: Number(texto("precio").replace(/\D/g, "")),
        }
        const faltan: Record<string, string> = {}
        if (pedido.categoria.length < 2) faltan.categoria = "Escribí la categoría."
        if (pedido.nombre.length < 2) faltan.nombre = "Escribí el nombre."
        if (!pedido.precio) faltan.precio = "Escribí el precio en pesos."
        setErrores(faltan)
        if (Object.keys(faltan).length) {
          avisarRevisar("Revisá lo que está marcado en rojo.")
          return
        }
        iniciar(async () => {
          const resultado = await llamar(() => guardarItemDeMenu(pedido))
          if (!resultado.ok) {
            avisarError(resultado.error)
            if (resultado.campos) setErrores(resultado.campos)
            return
          }
          avisarExito(item ? `Listo, se actualizó «${pedido.nombre}».` : `Listo, «${pedido.nombre}» ya está en la carta.`)
          if (!item) formulario.reset()
          onListo()
        })
      }}
    >
      <label className="text-sm font-semibold text-panel-muted">
        Categoría
        <input name="categoria" list={lista} defaultValue={item?.categoria ?? categorias.at(-1) ?? ""} placeholder="Minutas" className={cn(campo, borde("categoria"))} />
        <datalist id={lista}>
          {categorias.map((categoria) => (
            <option key={categoria} value={categoria} />
          ))}
        </datalist>
        <Error texto={errores.categoria} />
      </label>
      <label className="text-sm font-semibold text-panel-muted">
        Nombre
        <input name="nombre" defaultValue={item?.nombre} placeholder="Milanesa con papas" className={cn(campo, borde("nombre"))} />
        <Error texto={errores.nombre} />
      </label>
      <label className="text-sm font-semibold text-panel-muted">
        Descripción (opcional)
        <input name="descripcion" defaultValue={item?.descripcion ?? ""} maxLength={200} placeholder="De ternera, con papas fritas" className={cn(campo, borde("descripcion"))} />
        <Error texto={errores.descripcion} />
      </label>
      <label className="text-sm font-semibold text-panel-muted">
        Precio
        <input name="precio" inputMode="numeric" defaultValue={item?.precio} placeholder="12000" className={cn(campo, borde("precio"))} />
        <Error texto={errores.precio} />
      </label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1 lg:pt-6">
        <Button type="submit" disabled={pendiente} className="h-11 flex-1 bg-panel-naranja px-5 text-white hover:bg-panel-tostado">
          {pendiente ? "Guardando…" : item ? "Guardar" : "Agregar"}
        </Button>
        {item ? (
          <button type="button" onClick={onListo} aria-label="Cancelar" className="grid size-11 place-items-center rounded-full hover:bg-white">
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>
    </form>
  )
}

/// La carta del local: agregar, editar, marcar sin stock y borrar platos.
export function EditorDeMenu({ local, items }: { local: Local; items: ItemDelMenu[] }) {
  const [agregando, setAgregando] = useState(items.length === 0)
  const [editando, setEditando] = useState<number | null>(null)
  const [pendiente, iniciar] = useTransition()
  const grupos = porCategoria(items)
  const categorias = grupos.map((grupo) => grupo.categoria)

  return (
    <div className="space-y-4">
      {agregando ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Agregar a la carta</h3>
            {items.length ? (
              <button type="button" onClick={() => setAgregando(false)} className="text-sm font-semibold text-panel-muted underline-offset-4 hover:underline">
                Cerrar
              </button>
            ) : null}
          </div>
          <div className="mt-2">
            <FormularioDePlato local={local} categorias={categorias} onListo={() => undefined} />
          </div>
        </div>
      ) : (
        <Button type="button" className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado" onClick={() => setAgregando(true)}>
          <Plus className="size-4" aria-hidden />
          Agregar plato o bebida
        </Button>
      )}

      {grupos.length === 0 ? <p className="text-sm text-panel-muted">La carta está vacía. Empezá agregando el primer plato.</p> : null}
      {grupos.map((grupo) => (
        <section key={grupo.categoria} aria-label={grupo.categoria}>
          <h3 className="font-display text-xl tracking-tight">{grupo.categoria}</h3>
          <ul className="mt-1 divide-y divide-panel-line">
            {grupo.items.map((item) =>
              editando === item.id ? (
                <li key={item.id} className="py-2">
                  <FormularioDePlato local={local} categorias={categorias} item={item} onListo={() => setEditando(null)} />
                </li>
              ) : (
                <li key={item.id} className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5", !item.disponible && "opacity-60")}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {item.nombre}
                      {!item.disponible ? <span className="ml-2 rounded-full bg-[#fde9e7] px-2 py-0.5 text-xs font-bold text-[#a32020]">Sin stock</span> : null}
                    </span>
                    {item.descripcion ? <span className="block text-sm text-panel-muted">{item.descripcion}</span> : null}
                  </span>
                  <span className="font-semibold tabular-nums">{pesos(item.precio)}</span>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      key={`${item.id}-${item.disponible}`}
                      type="checkbox"
                      defaultChecked={item.disponible}
                      disabled={pendiente}
                      onChange={(evento) => {
                        const disponible = evento.target.checked
                        iniciar(async () => void (await conAviso(() => cambiarDisponible({ id: item.id, disponible }), disponible ? `«${item.nombre}» vuelve a la carta.` : `«${item.nombre}» queda sin stock: no se muestra en el menú digital.`)))
                      }}
                      className="size-5 accent-[#3a2a18]"
                    />
                    Hay
                  </label>
                  <button type="button" onClick={() => setEditando(item.id)} aria-label={`Editar ${item.nombre}`} className="grid size-9 place-items-center rounded-full text-panel-muted hover:bg-panel hover:text-panel-ink">
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={pendiente}
                    aria-label={`Borrar ${item.nombre}`}
                    onClick={() => {
                      if (!window.confirm(`¿Sacar «${item.nombre}» de la carta?`)) return
                      iniciar(async () => void (await conAviso(() => borrarItemDeMenu({ id: item.id }), `Listo, «${item.nombre}» salió de la carta.`)))
                    }}
                    className="grid size-9 place-items-center rounded-full text-panel-muted hover:bg-[#fde9e7] hover:text-[#c62828]"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  )
}
