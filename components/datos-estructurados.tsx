import { channels, mapPoint, phones } from "@/lib/site"
import { urlSitio } from "@/lib/url-sitio"

const redes = ["facebook", "instagram", "youtube", "tiktok"]

export function DatosEstructurados() {
  const datos = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TouristAttraction"],
    name: "Lago La Candelaria",
    description:
      "Predio recreativo de 27 hectáreas en Tristán Suárez con canotaje, tirolesa, parque aéreo, restaurante, bungalows y campamentos estudiantiles.",
    url: urlSitio,
    image: `${urlSitio}/opengraph-image.jpg`,
    telephone: phones.map((phone) => phone.href.replace("tel:", "")),
    email: "lagolacandelaria@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tristán Suárez",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    geo: { "@type": "GeoCoordinates", latitude: mapPoint.lat, longitude: mapPoint.lng },
    sameAs: channels.filter((channel) => redes.includes(channel.id)).map((channel) => channel.href),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  )
}
