import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

// Chequeo optimista: solo mira que exista la cookie. La sesión de verdad se valida en
// cada página y cada acción del panel.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/ingresar", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/panel/:path*"],
}
