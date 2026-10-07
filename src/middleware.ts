import { withAuth } from "next-auth/middleware"

import { isTokenUsable } from "@/lib/auth-token"

/**
 * FE-03b gate: a request is authorised only while the ERP credentials inside the JWT are still
 * valid (and the user holds an app role). Per-route role checks (/driver vs /portal/dashboard)
 * follow in FE-02. Rename to proxy.ts is FE-05.
 */
export default withAuth({
  callbacks: {
    authorized: ({ token }) => isTokenUsable(token),
  },
  pages: {
    signIn: "/portal",
  },
})

export const config = {
  matcher: ["/portal/dashboard/:path*", "/driver/:path*"],
}
