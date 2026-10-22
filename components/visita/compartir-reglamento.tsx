import { MessageCircle } from "lucide-react"

import { ReglamentoVista } from "@/components/visita/reglamento"
import { contenidoDelSitio } from "@/lib/contenido/leer"
import { mensajeParaElGrupo, reglamentos as deFabrica, type TipoDeReglamento } from "@/lib/reglamentos"

/// En el ticket: el reglamento (y los horarios) y un botón para reenviarlos al grupo.
export async function CompartirReglamento({ tipo, fecha, enlace }: { tipo: TipoDeReglamento; fecha: string; enlace: string }) {
  const { reglamentos } = await contenidoDelSitio()
  const texto = mensajeParaElGrupo(tipo, fecha, enlace, reglamentos.horarioDelPredio)
  return (
    <section className="no-print rounded-[1.6rem] border border-ink/10 bg-white p-5 md:p-6" aria-labelledby="reglamento-titulo">
      <p className="kicker">Antes de venir</p>
      <h2 id="reglamento-titulo" className="font-display mt-1 text-3xl tracking-tight">
        {reglamentos[tipo].titulo}
        {deFabrica[tipo].conHorarios ? " y horarios" : ""}
      </h2>
      <p className="mt-2 text-ink/75">Mandáselo a todos los que vienen con vos.</p>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white"
      >
        <MessageCircle className="size-5" aria-hidden />
        Compartir con el grupo por WhatsApp
      </a>
      <details className="mt-5">
        <summary className="cursor-pointer font-semibold text-lake-ink">Leer el reglamento{deFabrica[tipo].conHorarios ? " y los horarios" : ""}</summary>
        <div className="mt-4">
          <ReglamentoVista tipo={tipo} titulo={false} />
        </div>
      </details>
    </section>
  )
}
