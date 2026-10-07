import "server-only"

import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { AUTH_ERROR_CODES } from "./auth-errors"
import { buildJwt, computeErpExpiry, SESSION_MAX_AGE_SECONDS, toClientSession } from "./auth-token"
import { ErpError, isErpError } from "./erp/errors"
import { erpLogin, erpLogout } from "./erp/login"

/** A fresh login must stay valid at least this long. */
const MIN_SESSION_MS = 5 * 60_000

/** Login error codes (see auth-errors.ts — shared with the client login form). */
export const AUTH_ERROR = AUTH_ERROR_CODES

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Euron ERP",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /** FE-03a — log in to Frappe as this user; keep the Frappe session server-side. */
      async authorize(credentials) {
        try {
          const login = await erpLogin(credentials?.email, credentials?.password)
          if (!login) return null
          const expiresAt = computeErpExpiry(login.sidExpiresAt)
          if (expiresAt <= Date.now() + MIN_SESSION_MS) {
            // Frappe sid (nearly) expired already, or clocks disagree — a login that bounces at once.
            await erpLogout({ sid: login.sid, csrfToken: login.csrfToken }).catch(() => undefined)
            throw new ErpError("bad_response", "ERP session lifetime too short")
          }
          return {
            id: login.user,
            email: login.user,
            name: login.fullName,
            roles: login.roles,
            erp: {
              sid: login.sid,
              csrfToken: login.csrfToken,
              expiresAt,
            },
          }
        } catch (error) {
          if (isErpError(error)) {
            console.warn(`[auth] ERP login failed: ${error.kind}${error.status ? ` (HTTP ${error.status})` : ""}`)
            if (error.kind === "no_app_role") throw new Error(AUTH_ERROR.noAppRole)
            if (error.kind === "rate_limited") throw new Error(AUTH_ERROR.rateLimited)
          } else {
            console.error("[auth] Unexpected login failure")
          }
          throw new Error(AUTH_ERROR.erpUnavailable)
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/portal",
    error: "/portal",
  },
  callbacks: {
    /** FE-03b — sid / CSRF go into the encrypted JWT only. */
    jwt: (params) => buildJwt(params),
    /** FE-03b — the browser-visible session: user + roles (+ expiry marker), nothing else. */
    session: (params) => toClientSession(params),
  },
  events: {
    /** Also end the Frappe session (POST /api/method/logout), best effort. */
    async signOut({ token }) {
      const erp = token?.erp
      if (!erp) return
      try {
        await erpLogout(erp)
      } catch (error) {
        console.warn(`[auth] ERP logout failed: ${isErpError(error) ? error.kind : "unknown"}`)
      }
    },
  },
}
