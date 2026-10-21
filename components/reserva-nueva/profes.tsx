import { MessageCircle } from "lucide-react"

import { useContenido } from "@/components/contenido-del-sitio"
import { Foto } from "@/components/foto"
import { enlaceWhatsapp } from "@/lib/contenido/derivados"

export function Profes() {
  const { propuestas } = useContenido()
  const foto = propuestas.aventura[1].foto
  return (
    <div className="grid overflow-hidden rounded-[1.8rem] bg-white shadow-[0_18px_44px_rgba(58,53,48,0.08)] md:grid-cols-[1.05fr_0.95fr]">
      <div className="relative min-h-80">
        <Foto src={foto.src} alt={foto.alt} sizes="(min-width: 768px) 42vw, 100vw" className="absolute inset-0 size-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/15" />
        <p className="absolute inset-x-0 bottom-0 p-6 font-display text-4xl leading-[0.95] tracking-tight text-cream md:p-8 md:text-5xl">
          Kayak, sendero, trail y escalada
        </p>
      </div>
      <div className="flex flex-col justify-center p-6 md:p-8">
        <p className="text-lg leading-relaxed">
          Estas actividades no se reservan por la web. Se coordinan directo con los profes: les escribís y arman el grupo.
        </p>
        <ul className="mt-6 grid gap-3">
          {propuestas.profes.map((profe) => (
            <li key={`${profe.nombre}-${profe.telefono}`}>
              <a
                href={enlaceWhatsapp(profe.telefono, "Hola, quiero coordinar una actividad en Lago La Candelaria.")}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-[1.3rem] border border-ink/10 bg-foam px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#25a95a]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#25a95a] text-white">
                  <MessageCircle className="size-6" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-3xl leading-none tracking-tight">{profe.nombre}</span>
                  <span className="mt-1 block text-lg text-ink/70 tabular-nums">{profe.telefono}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
