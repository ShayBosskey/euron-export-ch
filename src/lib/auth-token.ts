/**
 * FE-03b — the bridge between the NextAuth JWT and what the browser may see.
 *
 * The JWT is encrypted (JWE, NEXTAUTH_SECRET) and lives in an HttpOnly cookie: it may hold the
 * Frappe `sid` + CSRF token. The NextAuth *session* object is served as JSON to client JavaScript
 * by /api/auth/session — it must NEVER contain them. Only `toClientSession` decides what it holds.
 *
 * No `server-only` import: middleware (edge) uses `isTokenUsable`.
 */
import type { Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { AppRole } from "./erp/roles"

/** NextAuth session + JWT lifetime. The ERP part may expire earlier (see computeErpExpiry). */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

/** Treat the ERP session as expired a little early so a request never races Frappe's own expiry. */
const EXPIRY_SKEW_MS = 60_000

export const ERP_SESSION_EXPIRED = "ErpSessionExpired" as const

export function computeErpExpiry(sidExpiresAt: number | null, now: number = Date.now()): number {
  const ownLimit = now + SESSION_MAX_AGE_SECONDS * 1000
  const frappeLimit = sidExpiresAt ?? Number.POSITIVE_INFINITY
  return Math.min(ownLimit, frappeLimit) - EXPIRY_SKEW_MS
}

/** jwt callback body: copy login data in once; afterwards only re-check expiry. */
export function buildJwt({ token, user }: { token: JWT; user?: User | null }, now: number = Date.now()): JWT {
  if (user) {
    return {
      ...token,
      sub: user.id,
      id: user.id,
      name: user.name ?? token.name,
      email: user.email ?? token.email,
      roles: user.roles,
      erp: user.erp,
      error: undefined,
    }
  }
  if (!erpCredentialsAlive(token, now)) {
    // Drop the dead credentials; keep a marker so the UI and middleware can force a re-login.
    return { ...token, erp: undefined, error: ERP_SESSION_EXPIRED }
  }
  return token
}

/** session callback body: an explicit allow-list — nothing from the token leaks by accident. */
export function toClientSession({ session, token }: { session: Session; token: JWT }): Session {
  return {
    expires: session.expires,
    user: {
      id: token.id ?? token.sub ?? "",
      name: token.name ?? null,
      email: token.email ?? null,
    },
    roles: token.roles ?? [],
    ...(token.error ? { error: token.error } : {}),
  }
}

/** Single definition of "the ERP credentials in this token can still be used". */
export function erpCredentialsAlive(token: JWT | null | undefined, now: number = Date.now()): boolean {
  const erp = token?.erp
  return Boolean(erp && typeof erp.expiresAt === "number" && Number.isFinite(erp.expiresAt) && erp.expiresAt > now)
}

/** Middleware gate: a token is usable only with live ERP credentials and at least one app role. */
export function isTokenUsable(token: JWT | null | undefined, now: number = Date.now()): boolean {
  return Boolean(token && !token.error && erpCredentialsAlive(token, now) && Array.isArray(token.roles) && token.roles.length > 0)
}

export function hasRole(roles: readonly string[] | undefined, role: AppRole): boolean {
  return Array.isArray(roles) && roles.includes(role)
}
