import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

// Chequeo optimista: solo mira que exista la cookie. La sesión de verdad se valida en
// cada página y cada acción del panel.
// Solo se redirigen las páginas: las Server Actions y las subidas responden ellas mismas
// que la sesión venció.
export function proxy(request: NextRequest) {
  const esPagina = request.method === "GET" || request.method === "HEAD"
  if (!getSessionCookie(request) && esPagina && !request.headers.has("next-action")) {
    return NextResponse.redirect(new URL("/ingresar", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/panel/:path*"],
}
