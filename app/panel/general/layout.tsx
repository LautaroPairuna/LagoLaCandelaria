import { PestanasGeneral } from "@/components/panel/pestanas-general"
import { exigirPanel } from "@/lib/panel/sesion"

export default async function GeneralLayout({ children }: LayoutProps<"/panel/general">) {
  await exigirPanel("general")
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Panel General</p>
      <h1 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">Todo el predio en un lugar</h1>
      <PestanasGeneral />
      <div className="mt-6">{children}</div>
    </main>
  )
}
