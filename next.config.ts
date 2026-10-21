import type { NextConfig } from "next";

const esDesarrollo = process.env.NODE_ENV === "development"

// Content Security Policy sin nonces (la variante de la guía de Next que permite seguir
// pregenerando las páginas). Lo único externo que carga el sitio son los mosaicos del
// mapa de ArcGIS; los QR y el ticket descargable usan data: y blob:.
const politicaDeContenido = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://server.arcgisonline.com",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ")

const headersDeSeguridad = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: politicaDeContenido },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb", "mariadb", "sharp", "ffmpeg-static"],
  // El binario de ffmpeg se usa por ruta: el rastreo de standalone no lo ve solo.
  outputFileTracingIncludes: { "/api/subir/video": ["./node_modules/ffmpeg-static/ffmpeg"] },
  async headers() {
    return [
      { source: "/:path*", headers: headersDeSeguridad },
      {
        source: "/reserva/t/:id",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
