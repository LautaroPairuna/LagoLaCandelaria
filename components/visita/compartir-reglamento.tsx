import { MessageCircle } from "lucide-react"

import { ReglamentoVista } from "@/components/visita/reglamento"
import { contenidoDelSitio } from "@/lib/contenido/leer"
import { mensajeParaElGrupo, reglamentos as deFabrica, type TipoDeReglamento } from "@/lib/reglamentos"

/// En el ticket, a la par del ticket: el reglamento (y los horarios) a la vista y un botón
/// para reenviarlos al grupo.
export async function CompartirReglamento({ tipo, fecha, enlace }: { tipo: TipoDeReglamento; fecha: string; enlace: string }) {
  const { reglamentos } = await contenidoDelSitio()
  const texto = mensajeParaElGrupo(tipo, fecha, enlace, reglamentos.horarioDelPredio)
  return (
    <div className="rounded-[1.8rem] border border-ink/10 bg-white p-5 shadow-[0_18px_50px_rgba(58,53,48,0.08)] md:p-6">
      <p className="font-display text-xl tracking-tight">
        {reglamentos[tipo].titulo}
        {deFabrica[tipo].conHorarios ? " y horarios" : ""}
      </p>
      <p className="mt-1 text-ink/75">Leelo antes de venir y mandáselo a todos los que vienen con vos.</p>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white"
      >
        <MessageCircle className="size-5" aria-hidden />
        Compartir con el grupo por WhatsApp
      </a>
      <div className="mt-6 border-t border-ink/10 pt-5">
        <ReglamentoVista tipo={tipo} titulo={false} />
      </div>
    </div>
  )
}
