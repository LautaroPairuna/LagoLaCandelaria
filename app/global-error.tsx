"use client"

export default function ErrorGeneral({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", background: "#fbf5ea", color: "#3a3530", fontFamily: "system-ui, sans-serif" }}>
        <title>Lago La Candelaria</title>
        <main style={{ maxWidth: 480, padding: 24 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: 0 }}>El sitio no llegó a abrirse.</h1>
          <p style={{ color: "#6b635b", lineHeight: 1.5 }}>
            Fue un problema de nuestro lado. Probá de nuevo en un momento; si sigue igual, escribinos por WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 8, height: 48, padding: "0 20px", border: 0, borderRadius: 999, background: "#3a3530", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
          >
            Probar de nuevo
          </button>
          {error.digest ? <p style={{ marginTop: 24, fontSize: 12, color: "#6b635b" }}>Si nos escribís, pasanos este código: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  )
}
