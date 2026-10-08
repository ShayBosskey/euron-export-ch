import { withAuth, type NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

import { canAccess, homeFor, LOGIN_PATH } from "@/lib/access"
import { isTokenUsable } from "@/lib/auth-token"

/**
 * Proxy (Next.js 16; formerly middleware.ts — FE-05 folded into FE-02).
 *
 * Optimistic gate only (A8): reads the encrypted NextAuth JWT cookie, no ERP call.
 *  1. No token at all → /portal?callbackUrl=…  (withAuth)
 *  2. Token no longer usable (ERP session expired, no app role) → /portal?error=SessionExpired&callbackUrl=…
 *     so the login page tells the user why (the /portal page does not auto-redirect on that flag)
 *  3. Token, but wrong role for this area → the user's own home (never /portal: no redirect loop)
 * The authoritative checks are `requirePageAccess` / `authorizeAction` (src/lib/guards.ts) and the
 * ERP endpoints themselves. Runs on the Node.js runtime (Proxy default; `runtime` is not allowed).
 */
export default withAuth(
  function proxy(req: NextRequestWithAuth) {
    const token = req.nextauth.token
    if (!isTokenUsable(token)) {
      const login = new URL(LOGIN_PATH, req.url)
      login.searchParams.set("error", "SessionExpired")
      login.searchParams.set("callbackUrl", `${req.nextUrl.pathname}${req.nextUrl.search}`)
      return NextResponse.redirect(login)
    }
    const roles = token?.roles
    if (canAccess(roles, req.nextUrl.pathname)) return NextResponse.next()
    return NextResponse.redirect(new URL(homeFor(roles) ?? LOGIN_PATH, req.url))
  },
  {
    callbacks: {
      // Only "is there a decodable token" here; usability is decided in proxy() to set the notice.
      authorized: ({ token }) => token !== null,
    },
    pages: {
      signIn: LOGIN_PATH,
    },
  }
)

export const config = {
  // Keep in sync with ROUTE_ROLES (src/lib/access.ts); a test pins this.
  matcher: ["/portal/dashboard/:path*", "/driver/:path*"],
}
