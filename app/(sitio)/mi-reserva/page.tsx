import { Foto } from "@/components/foto"
import { BuscarMiReserva } from "@/components/visita/buscar-mi-reserva"
import { seoDePagina, seoDePaginas } from "@/lib/seo"

export const metadata = seoDePagina({ ...seoDePaginas["mi-reserva"], ruta: "/mi-reserva" })

export default function MiReservaPage() {
  return (
    <main className="min-h-svh bg-foam pt-[var(--site-header)] text-ink">
      <section className="mx-auto flex min-h-[calc(100svh-var(--site-header))] max-w-[1180px] flex-col justify-center gap-4 px-5 py-4 md:px-8 md:py-5">
        <header className="relative min-h-40 overflow-hidden rounded-[1.7rem] md:min-h-44">
          <Foto
            src="/covers/playa.jpg"
            alt="Vista de la playa y las instalaciones de Lago La Candelaria."
            prioridad
            sizes="(min-width: 1180px) 1120px, 100vw"
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: "center 54%" }}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/52 to-black/15" />
          <div className="relative flex min-h-40 max-w-2xl flex-col justify-center px-5 py-5 text-cream sm:px-7 md:min-h-44 md:px-9">
            <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">Ver mi reserva</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/85 sm:text-base">
              Consultá los datos, abrí la reserva completa o descargá el ticket para presentarlo al ingresar.
            </p>
          </div>
        </header>
        <BuscarMiReserva />
      </section>
    </main>
  )
}
