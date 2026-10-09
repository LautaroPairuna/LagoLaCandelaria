import { EquipoFotos } from "@/components/equipo-fotos"
import { GoogleReviews } from "@/components/google-reviews"
import { PlaceMap } from "@/components/place-map"
import { VideoFondo } from "@/components/video-fondo"
import { fotoUrl } from "@/lib/fotos"
import { channels } from "@/lib/site"

type Channel = (typeof channels)[number]
type ChannelId = Channel["id"]

const directIds = ["whatsapp", "phone", "mail"] as const satisfies readonly ChannelId[]
const socialIds = ["facebook", "instagram", "youtube", "tiktok"] as const satisfies readonly ChannelId[]

const shell =
  "group h-full overflow-hidden transition duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#24362c]"

const surfaces: Record<ChannelId, string> = {
  whatsapp: "bg-[#25D366] text-[#05351c] shadow-[0_16px_34px_rgba(7,94,84,0.28)]",
  phone: "bg-[#24362c] text-[#f6f1e6] shadow-[0_16px_34px_rgba(36,54,44,0.3)]",
  mail: "bg-[#C5221F] text-white shadow-[0_16px_34px_rgba(197,34,31,0.32)]",
  facebook: "bg-[#0F5CC4] text-white shadow-[0_16px_34px_rgba(24,119,242,0.32)]",
  instagram:
    "bg-[linear-gradient(145deg,#f9ce34_0%,#f77737_18%,#ee2a7b_46%,#c13584_68%,#6228d7_100%)] text-white shadow-[0_16px_34px_rgba(193,53,132,0.34)]",
  youtube: "bg-[#CC0000] text-white shadow-[0_16px_34px_rgba(204,0,0,0.32)]",
  tiktok: "bg-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.38)] ring-1 ring-white/12",
}

function pick(ids: readonly ChannelId[]) {
  return ids.map((id) => {
    const channel = channels.find((item) => item.id === id)
    if (!channel) throw new Error(`Canal faltante: ${id}`)
    return channel
  })
}

function Mark({ id }: { id: ChannelId }) {
  if (id === "whatsapp") {
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#075E54] text-white shadow-[0_8px_16px_rgba(7,94,84,0.28)]">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            fill="currentColor"
            d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 14.15c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.12.1-1.81-.11-.41-.13-.95-.31-1.63-.61-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.37.24-.26.64-.38.85-.38h.61c.2 0 .46-.07.72.55.24.68.85 2.34.92 2.51.07.17.12.37.02.59-.1.22-.14.36-.28.55-.14.19-.3.42-.42.56-.14.16-.28.34-.12.66.16.32.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.29 1.39.32.14.5.12.69-.07.19-.19.8-.93 1.01-1.25.21-.32.42-.26.7-.16.28.1 1.79.84 2.1.99.3.16.5.23.58.36.07.13.07.76-.17 1.44Z"
          />
        </svg>
      </span>
    )
  }

  if (id === "mail") {
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_8px_16px_rgba(66,133,244,0.16)] ring-1 ring-[#eadfce]">
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
          <path fill="#EA4335" d="M2 7.2 12 13.2 22 7.2V6.2A2.2 2.2 0 0 0 19.8 4H4.2A2.2 2.2 0 0 0 2 6.2v1Z" />
          <path fill="#FBBC05" d="M2 7.2V18a2 2 0 0 0 2 2h3.2L12 14.6 2 7.2Z" />
          <path fill="#34A853" d="M22 7.2V18a2 2 0 0 1-2 2h-3.2L12 14.6 22 7.2Z" />
          <path fill="#4285F4" d="M7.2 20h9.6L12 14.6 7.2 20Z" />
        </svg>
      </span>
    )
  }

  if (id === "facebook") {
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/18 text-white">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            fill="currentColor"
            d="M14.2 8.4V6.7c0-.7.4-1.1 1.2-1.1h1.6V3h-2.5C11.6 3 10.2 4.5 10.2 6.6v1.8H8.2V11h2v9h3.6v-9h2.4l.4-2.6h-2.4Z"
          />
        </svg>
      </span>
    )
  }

  if (id === "instagram") {
    return (
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-white">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </svg>
      </span>
    )
  }

  if (id === "youtube") {
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-[#FF0000] shadow-[0_8px_16px_rgba(255,0,0,0.16)] ring-1 ring-[#eadfce]">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            fill="currentColor"
            d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM9.8 15.5v-6.6l6.2 3.3-6.2 3.3Z"
          />
        </svg>
      </span>
    )
  }

  if (id === "phone") {
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#24362c] text-[#f6f1e6] shadow-[0_8px_16px_rgba(36,54,44,0.22)]">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
          <path
            d="M7.2 3.6h2.8l1.2 3-1.9 1.1a12.2 12.2 0 0 0 6 6l1.1-1.9 3 1.2v2.8a1.8 1.8 0 0 1-2 1.8A16.2 16.2 0 0 1 5.4 5.6a1.8 1.8 0 0 1 1.8-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  return (
    <span className="grid size-12 shrink-0 place-items-center">
      <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
        <path
          fill="#25F4EE"
          d="M14 3.2h2a5.2 5.2 0 0 0 3.6 3.4v2.1A7.3 7.3 0 0 1 16 7.6v6.4a5.6 5.6 0 1 1-5.6-5.6c.28 0 .56.02.84.08v2.3a3.3 3.3 0 1 0 2.3 3.2V3.2Z"
          transform="translate(-0.7 0.35)"
        />
        <path
          fill="#FE2C55"
          d="M14 3.2h2a5.2 5.2 0 0 0 3.6 3.4v2.1A7.3 7.3 0 0 1 16 7.6v6.4a5.6 5.6 0 1 1-5.6-5.6c.28 0 .56.02.84.08v2.3a3.3 3.3 0 1 0 2.3 3.2V3.2Z"
          transform="translate(0.7 -0.2)"
        />
        <path
          fill="#fff"
          d="M14 3.2h2a5.2 5.2 0 0 0 3.6 3.4v2.1A7.3 7.3 0 0 1 16 7.6v6.4a5.6 5.6 0 1 1-5.6-5.6c.28 0 .56.02.84.08v2.3a3.3 3.3 0 1 0 2.3 3.2V3.2Z"
        />
      </svg>
    </span>
  )
}

function ChannelDetail({ channel, layout }: { channel: Channel; layout: "direct" | "social" }) {
  if (layout === "direct" && channel.detail.includes("@")) {
    const at = channel.detail.indexOf("@")
    return (
      <span className="mt-1 block font-display text-[1.2rem] leading-[1.15] font-semibold tracking-tight">
        {channel.detail.slice(0, at)}
        <span className="block">{channel.detail.slice(at)}</span>
      </span>
    )
  }

  return (
    <span
      className={
        layout === "direct"
          ? "mt-1 block font-display text-[1.45rem] leading-tight font-semibold tracking-tight"
          : "mt-1 block text-[0.82rem] leading-snug font-semibold"
      }
    >
      {channel.detail}
    </span>
  )
}

function ChannelCard({ channel, layout }: { channel: Channel; layout: "direct" | "social" }) {
  const external = channel.href.startsWith("http")
  return (
    <a
      href={channel.href}
      className={
        layout === "direct"
          ? `${shell} ${surfaces[channel.id]} flex min-h-[7.25rem] items-center gap-4 rounded-[1.4rem] px-5 py-4`
          : `${shell} ${surfaces[channel.id]} flex flex-col items-center justify-center gap-2.5 rounded-[1.4rem] px-4 py-5 text-center`
      }
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <Mark id={channel.id} />
      <span className={layout === "direct" ? "min-w-0" : "min-w-0 max-w-full"}>
        <span className="block text-[0.72rem] font-bold tracking-[0.16em] uppercase opacity-90">
          {channel.label}
        </span>
        <ChannelDetail channel={channel} layout={layout} />
      </span>
    </a>
  )
}

export function AboutPlace() {
  return (
    <div className="text-ink" data-nav="nosotros">
      <section id="nosotros" aria-labelledby="nosotros-titulo" className="nosotros-ground">
        <div className="mx-auto max-w-[1120px] px-5 py-20 md:px-8 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
          <div>
            <p className="kicker">Nosotros</p>
            <h2 id="nosotros-titulo" className="font-display mt-3 text-5xl leading-[0.95] tracking-tight md:text-7xl">
              Nuestro equipo
            </h2>
            <p className="font-display mt-6 max-w-xl text-[1.65rem] leading-[1.25] tracking-tight text-balance md:text-3xl">
              Lago La Candelaria es un espacio recreativo para compartir y disfrutar de actividades de aventura y descanso con amigos, familia y grupos estudiantiles.
            </p>
          </div>
          <figure className="team-print">
            <EquipoFotos />
            <figcaption>Equipo de Lago La Candelaria</figcaption>
          </figure>
        </div>

        <div className="mt-16 text-center md:mt-20">
          <h3 className="font-display text-4xl tracking-tight md:text-6xl">¡Contactanos!</h3>
          <ul aria-label="Canales directos" className="mt-8 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            {pick(directIds).map((channel) => (
              <li key={channel.id}>
                <ChannelCard channel={channel} layout="direct" />
              </li>
            ))}
          </ul>
          <ul aria-label="Redes sociales" className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {pick(socialIds).map((channel) => (
              <li key={channel.id}>
                <ChannelCard channel={channel} layout="social" />
              </li>
            ))}
          </ul>
        </div>
        </div>
      </section>

      <section id="ubicacion" aria-labelledby="ubicacion-titulo" className="ubicacion-section section-snap">
        <VideoFondo
          src="/ubicacion.mp4?v=5"
          poster={fotoUrl("/posters/ubicacion.jpg", 1280)}
          className="ubicacion-video"
          diferido
        />
        <div className="ubicacion-frame">
          <div className="ubicacion-layout">
            <div className="ubicacion-col">
              <h2 id="ubicacion-titulo" className="ubicacion-title font-display">
                Ubicación
              </h2>
              <PlaceMap />
            </div>
            <div className="ubicacion-col">
              <h2 id="puntuacion-titulo" className="ubicacion-title font-display">
                Puntuación
              </h2>
              <GoogleReviews />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
