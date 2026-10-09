import { Download, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { periodoDeCaja } from "@/app/panel/caja/periodo";
import { SelectorDePeriodo, textoDelPeriodo } from "@/components/panel/caja/partes";
import { seccionesDeActividad, type SeccionDeActividad } from "@/lib/panel/actividad";
import { fechaLargaPanel } from "@/lib/panel/formato";
import { diaDelPredio, esSeccionDeActividad, POR_PAGINA, registroDeActividad, type FilaDeRegistro } from "@/lib/panel/registro";
import { exigirPanel } from "@/lib/panel/sesion";
import { hoyEnElPredio } from "@/lib/predio/fechas";
import { pesos } from "@/lib/predio/tarifas";
import { cn } from "cn";

export const metadata: Metadata = { title: "Actividad del equipo" };

const hora = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});
const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]";

const colorDeSeccion: Record<SeccionDeActividad, string> = {
  acceso: "bg-panel text-panel-muted",
  reservas: "bg-[#eaf3fb] text-[#1f5a8a]",
  puerta: "bg-[#e6f5e4] text-[#24622a]",
  caja: "bg-[#fff7d6] text-[#6b5200]",
  restaurante: "bg-[#ffeedb] text-[#7a4200]",
  bar: "bg-[#efe6fb] text-[#5b2d91]",
  actividades: "bg-[#e3f4f4] text-[#1d5c5c]",
  usuarios: "bg-[#fde9e7] text-[#a32020]",
};

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

/// Quién hizo qué en el panel, con el rol que tiene cada persona.
export default async function ActividadDelEquipo({ searchParams }: PageProps<"/panel/general/actividad">) {
  await exigirPanel("general");
  const params = await searchParams;
  const hoy = hoyEnElPredio();
  const { desde, hasta } = periodoDeCaja(primero(params.desde), primero(params.hasta), hoy);
  const userId = primero(params.usuario) || undefined;
  const pedida = primero(params.seccion);
  const seccion = esSeccionDeActividad(pedida) ? pedida : undefined;
  const texto = (primero(params.q) ?? "").trim().slice(0, 60) || undefined;
  const cantidad = Math.min(Math.max(Number(primero(params.ver)) || POR_PAGINA, POR_PAGINA), 2000);
  const filtros: Record<string, string> = Object.fromEntries(Object.entries({ usuario: userId, seccion, q: texto }).filter(([, valor]) => valor)) as Record<string, string>;
  const enlace = (cambios: Record<string, string | undefined>) => {
    const valores = Object.fromEntries(Object.entries({ desde, hasta, ...filtros, ...cambios }).filter(([, valor]) => valor)) as Record<string, string>;
    return `/panel/general/actividad?${new URLSearchParams(valores)}`;
  };

  const { total, filas, porUsuario, usuarios } = await registroDeActividad({ desde, hasta, userId, seccion, texto }, cantidad);
  const porDia = new Map<string, FilaDeRegistro[]>();
  for (const fila of filas) {
    const dia = diaDelPredio(fila.creadoEn);
    porDia.set(dia, [...(porDia.get(dia) ?? []), fila]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Actividad del equipo</h2>
          <p className="text-sm text-panel-muted">
            {textoDelPeriodo(desde, hasta)} · {total} {total === 1 ? "acción" : "acciones"}
          </p>
        </div>
        <a
          href={`/panel/general/actividad/csv?${new URLSearchParams({ desde, hasta, ...filtros })}`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"
        >
          <Download className="size-4" aria-hidden />
          Exportar a Excel
        </a>
      </div>

      <SelectorDePeriodo ruta="/panel/general/actividad" hoy={hoy} desde={desde} hasta={hasta} extras={filtros} />

      <form action="/panel/general/actividad" className={cn("mt-4 flex flex-wrap items-end gap-3 rounded-3xl bg-white p-4", sombra)}>
        <input type="hidden" name="desde" value={desde} />
        <input type="hidden" name="hasta" value={hasta} />
        {seccion ? <input type="hidden" name="seccion" value={seccion} /> : null}
        <label className="w-full min-w-0 text-sm font-semibold text-panel-muted sm:w-auto">
          Persona
          <select name="usuario" defaultValue={userId ?? ""} className="mt-1 block h-11 w-full rounded-xl sm:w-72 border border-panel-line bg-white px-3 text-base text-panel-ink">
            <option value="">Todo el equipo</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre}
                {usuario.roles.length ? ` · ${usuario.roles.join(", ")}` : ""}
                {usuario.deshabilitado ? " (deshabilitado)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="relative min-w-0 basis-full text-sm font-semibold text-panel-muted sm:min-w-56 sm:flex-1 sm:basis-0">
          Buscar
          <Search className="pointer-events-none absolute bottom-3.5 left-3 size-4" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={texto}
            placeholder="Reserva, mesa, nombre, «canceló»…"
            className="mt-1 block h-11 w-full rounded-xl border border-panel-line bg-white pr-3 pl-9 text-base text-panel-ink"
          />
        </label>
        <button type="submit" className="h-11 w-full rounded-full sm:w-auto bg-panel-ink px-6 text-sm font-semibold text-white hover:bg-panel-tostado">
          Ver
        </button>
        {userId || texto || seccion ? (
          <Link href={`/panel/general/actividad?${new URLSearchParams({ desde, hasta })}`} className="h-11 content-center text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
            Limpiar filtros
          </Link>
        ) : null}
      </form>

      <nav aria-label="Sección" className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {[undefined, ...(Object.keys(seccionesDeActividad) as SeccionDeActividad[])].map((cual) => (
          <Link
            key={cual ?? "todas"}
            href={enlace({ seccion: cual })}
            aria-current={seccion === cual ? "true" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm font-semibold whitespace-nowrap",
              seccion === cual ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
            )}
          >
            {cual ? seccionesDeActividad[cual] : "Todas las secciones"}
          </Link>
        ))}
      </nav>

      <div className="mt-5 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Registro" className="min-w-0 space-y-5">
          {filas.length === 0 ? (
            <p className={cn("rounded-3xl bg-white p-6 text-sm text-panel-muted", sombra)}>No hay acciones registradas con estos filtros.</p>
          ) : (
            [...porDia].map(([dia, lista]) => (
              <section key={dia} aria-label={fechaLargaPanel(dia)} className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}>
                <h3 className="font-display text-xl tracking-tight">{fechaLargaPanel(dia)}</h3>
                <ul className="mt-2 divide-y divide-panel-line">
                  {lista.map((fila) => (
                    <li key={fila.id} className="flex gap-3 py-3">
                      <span className="w-11 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-panel-muted">{hora.format(fila.creadoEn)}</span>
                      <span aria-hidden className="hidden size-9 shrink-0 place-items-center rounded-full bg-panel-naranja sm:grid text-xs font-bold text-white">
                        {iniciales(fila.usuario)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <strong>{fila.usuario}</strong>
                          {fila.roles.map((rol) => (
                            <span key={rol} className="rounded-full border border-panel-line px-2 py-0.5 text-xs font-semibold text-panel-muted">
                              {rol}
                            </span>
                          ))}
                          {fila.eliminado ? <span className="text-xs text-panel-muted">(usuario eliminado)</span> : null}
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", colorDeSeccion[fila.seccion])}>{seccionesDeActividad[fila.seccion]}</span>
                        </span>
                        <span className="mt-0.5 block text-sm">
                          {fila.detalle}
                          {fila.reservaId ? (
                            <>
                              {" "}
                              <Link href={`/panel/reservas/${fila.reservaId}`} className="font-semibold text-panel-tostado underline-offset-4 hover:underline">
                                Ver reserva
                              </Link>
                            </>
                          ) : null}
                        </span>
                        {fila.monto ? <span className="mt-0.5 block text-sm font-semibold tabular-nums sm:hidden">{pesos(fila.monto)}</span> : null}
                      </span>
                      {fila.monto ? <span className="hidden shrink-0 text-sm font-semibold tabular-nums sm:block">{pesos(fila.monto)}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
          {total > filas.length ? (
            <div className="text-center">
              <Link
                href={enlace({ ver: String(cantidad + POR_PAGINA) })}
                scroll={false}
                className="inline-block rounded-full border border-panel-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-panel-muted"
              >
                Ver {Math.min(POR_PAGINA, total - filas.length)} más
              </Link>
            </div>
          ) : null}
        </section>

        <aside aria-label="Por persona" className={cn("rounded-3xl bg-white p-4 md:p-5 xl:sticky xl:top-6", sombra)}>
          <h3 className="font-display text-xl tracking-tight">Por persona</h3>
          <p className="text-xs text-panel-muted">Acciones en el período, con su rol actual.</p>
          {porUsuario.length === 0 ? (
            <p className="mt-2 text-sm text-panel-muted">Nadie hizo nada todavía.</p>
          ) : (
            <ul className="mt-2 divide-y divide-panel-line">
              {porUsuario.map((fila) => {
                const id = fila.clave.startsWith("nombre:") ? undefined : fila.clave;
                return (
                  <li key={fila.clave} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      {id ? (
                        <Link href={enlace({ usuario: id })} className="block truncate font-semibold hover:underline">
                          {fila.nombre}
                        </Link>
                      ) : (
                        <span className="block truncate font-semibold">{fila.nombre}</span>
                      )}
                      <span className="block truncate text-xs text-panel-muted">{fila.roles.join(", ") || "Sin rol"}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{fila.acciones}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
