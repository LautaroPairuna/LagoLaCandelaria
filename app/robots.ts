import type { MetadataRoute } from "next"

import { urlSitio } from "@/lib/url-sitio"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/reserva/t/"] },
    sitemap: `${urlSitio}/sitemap.xml`,
  }
}
