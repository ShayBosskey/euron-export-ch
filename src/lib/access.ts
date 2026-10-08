/**
 * FE-02 — which app role may open which protected route, and where each user lands.
 *
 * Pure and dependency-free on purpose: used by `proxy.ts` (optimistic redirect), by the server-side
 * guards in `guards.ts` (authoritative in Next.js) and by the login page. The ERP endpoints enforce
 * the same roles again (final authority) — this module never grants data access on its own.
 *
 * D12 (2026-10-07): Euron Admin may open both areas. Landing priority for users with several roles:
 * Euron Admin → /driver, Euron Driver → /driver, Garage Portal User → /portal/dashboard.
 */
import { APP_ROLES, EURON_ADMIN, EURON_DRIVER, GARAGE_PORTAL_USER, type AppRole } from "./erp/roles"

export const LOGIN_PATH = "/portal"
export const DRIVER_HOME = "/driver"
export const PORTAL_HOME = "/portal/dashboard"

export type ProtectedRoute = typeof DRIVER_HOME | typeof PORTAL_HOME

/** Route prefix → roles allowed to open it (any one of them is enough). */
export const ROUTE_ROLES: Readonly<Record<ProtectedRoute, readonly AppRole[]>> = {
  [DRIVER_HOME]: [EURON_ADMIN, EURON_DRIVER],
  [PORTAL_HOME]: [EURON_ADMIN, GARAGE_PORTAL_USER],
}

/** First matching role wins. */
const LANDING_PRIORITY: ReadonlyArray<readonly [AppRole, ProtectedRoute]> = [
  [EURON_ADMIN, DRIVER_HOME],
  [EURON_DRIVER, DRIVER_HOME],
  [GARAGE_PORTAL_USER, PORTAL_HOME],
]

const KNOWN_ROLES: ReadonlySet<string> = new Set(APP_ROLES)

/** Only known app-role strings survive; anything else (or a non-array) yields []. */
export function normalizeRoles(roles: unknown): AppRole[] {
  if (!Array.isArray(roles)) return []
  return roles.filter((role): role is AppRole => typeof role === "string" && KNOWN_ROLES.has(role))
}

/** `/driver` matches `/driver` and `/driver/...` but not `/driver-x`. */
export function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** The protected route a pathname belongs to, or `undefined` for a public path. */
export function protectedRouteOf(pathname: string): ProtectedRoute | undefined {
  return (Object.keys(ROUTE_ROLES) as ProtectedRoute[]).find((prefix) => isUnder(pathname, prefix))
}

/** May a user with `roles` open `pathname`? Public paths: always. Protected: needs an allowed role. */
export function canAccess(roles: unknown, pathname: string): boolean {
  const route = protectedRouteOf(pathname)
  if (!route) return true
  const held = normalizeRoles(roles)
  return ROUTE_ROLES[route].some((role) => held.includes(role))
}

/** Landing page for a user, or `null` if they hold no app role (they belong on the login page). */
export function homeFor(roles: unknown): ProtectedRoute | null {
  const held = normalizeRoles(roles)
  for (const [role, home] of LANDING_PRIORITY) {
    if (held.includes(role)) return home
  }
  return null
}

const INTERNAL_ORIGIN = "http://internal.invalid"

/**
 * Turn an untrusted `callbackUrl` into a same-site path, or `null`.
 * Only relative paths into a protected app route are honoured (no open redirect, no bounce to
 * arbitrary pages); `..` segments and encodings are resolved by the URL parser before the check.
 */
export function safeCallbackPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return null
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null
  let url: URL
  try {
    url = new URL(raw, INTERNAL_ORIGIN)
  } catch {
    return null
  }
  if (url.origin !== INTERNAL_ORIGIN) return null
  if (!protectedRouteOf(url.pathname)) return null
  return `${url.pathname}${url.search}`
}

/** Where to send a freshly signed-in user: their callbackUrl if allowed for their roles, else home. */
export function postLoginTarget(roles: unknown, callbackUrl: unknown): string | null {
  const callback = safeCallbackPath(callbackUrl)
  if (callback && canAccess(roles, new URL(callback, INTERNAL_ORIGIN).pathname)) return callback
  return homeFor(roles)
}
