import { ButtonLink } from "@/components/button-link"

export const metadata = { title: "Página no encontrada" }

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center bg-cream text-ink">
      <div className="mx-auto max-w-[1120px] px-5 py-32 md:px-8">
        <p className="kicker">404</p>
        <h1 className="font-display mt-4 max-w-xl text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Esa página no está en el predio.
        </h1>
        <p className="mt-5 max-w-md text-text-muted">
          Puede que el enlace esté viejo. El lago, las actividades y la reserva siguen donde siempre.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/">Volver al inicio</ButtonLink>
          <ButtonLink
            href="/actividades"
            variant="outline"
            className=""
          >
            Ver actividades
          </ButtonLink>
        </div>
      </div>
    </main>
  )
}
