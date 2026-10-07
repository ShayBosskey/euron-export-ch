import "server-only"

import { getErpBaseUrl, methodUrl } from "./config"
import { extractSessionCookie } from "./cookies"
import { ErpError } from "./errors"
import { erpFetch, errorFromResponse, isValidCsrfToken, readJson, type ErpSession } from "./http"
import { APP_ROLES, type AppRole } from "./roles"

export type ErpSessionContext = {
  user: string
  fullName: string
  roles: AppRole[]
  csrfToken: string
}

export type ErpLoginResult = ErpSessionContext & {
  sid: string
  /** Frappe cookie expiry (epoch ms) or null if Frappe sent none. */
  sidExpiresAt: number | null
}

const MAX_USER_LENGTH = 254
const MAX_PASSWORD_LENGTH = 512

const SESSION_CONTEXT_METHOD = "euron_export_erp.api.session.get_session_context"

/** Keep only roles this app knows; unknown strings from the ERP are dropped. */
export function toAppRoles(value: unknown): AppRole[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(APP_ROLES)
  const roles = value.filter((role): role is AppRole => typeof role === "string" && allowed.has(role))
  return [...new Set(roles)].sort()
}

/** GET get_session_context with the given sid → user, app roles, CSRF token. */
export async function fetchSessionContext(sid: string): Promise<ErpSessionContext> {
  const baseUrl = getErpBaseUrl()
  const res = await erpFetch(methodUrl(baseUrl, SESSION_CONTEXT_METHOD), {
    method: "GET",
    headers: { Accept: "application/json", Cookie: `sid=${sid}` },
  })
  const json = await readJson(res)
  if (!res.ok) throw errorFromResponse(SESSION_CONTEXT_METHOD, res.status, json)

  const message = json && typeof json === "object" ? (json as { message?: unknown }).message : undefined
  if (!message || typeof message !== "object") {
    throw new ErpError("bad_response", "Session context missing in ERP answer", { status: res.status })
  }
  const ctx = message as Record<string, unknown>
  if (typeof ctx.user !== "string" || !ctx.user || ctx.user === "Guest") {
    throw new ErpError("unauthenticated", "ERP session context has no logged-in user", { status: res.status })
  }
  if (!isValidCsrfToken(ctx.csrf_token)) {
    throw new ErpError("bad_response", "ERP session context has no usable CSRF token", { status: res.status })
  }
  return {
    user: ctx.user,
    fullName: typeof ctx.full_name === "string" && ctx.full_name.trim() ? ctx.full_name.trim() : ctx.user,
    roles: toAppRoles(ctx.roles),
    csrfToken: ctx.csrf_token,
  }
}

/**
 * FE-03a — log in to Frappe with the user's own credentials.
 *
 * Returns null for wrong credentials (→ NextAuth "CredentialsSignin"). Throws ErpError for
 * everything else: `no_app_role` (valid Frappe user without a Euron role — the fresh ERP session
 * is logged out again), `rate_limited`, `network`/`timeout`/`server`, `bad_response`.
 *
 * Success is decided by HTTP 200 + a real `sid` cookie, NOT by the message text: Frappe answers
 * "Logged In" for Desk users but "No App" for website users such as Garage Portal Users.
 */
export async function erpLogin(username: unknown, password: unknown): Promise<ErpLoginResult | null> {
  if (typeof username !== "string" || typeof password !== "string") return null
  const usr = username.trim()
  if (!usr || usr.length > MAX_USER_LENGTH || !password || password.length > MAX_PASSWORD_LENGTH) return null

  const baseUrl = getErpBaseUrl()
  const loginMethod = "login"
  const res = await erpFetch(`${baseUrl}/api/method/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ usr, pwd: password }),
  })

  if (res.status === 401) {
    await res.body?.cancel().catch(() => undefined)
    return null
  }
  if (!res.ok) {
    const error = errorFromResponse(loginMethod, res.status, await readJson(res))
    // A 403 on login is "user disabled / not allowed" — same answer as bad credentials, no oracle.
    if (error.kind === "forbidden" || error.kind === "unauthenticated") return null
    throw error
  }
  await res.body?.cancel().catch(() => undefined)

  const cookie = extractSessionCookie(res.headers)
  if (!cookie) throw new ErpError("bad_response", "ERP login succeeded but set no session cookie", { status: res.status })

  let context: ErpSessionContext
  try {
    context = await fetchSessionContext(cookie.sid)
  } catch (error) {
    // Best effort only: without the CSRF token Frappe may refuse this logout, leaving the fresh sid
    // to expire on its own. It never reaches the browser, so it cannot be used by anyone.
    await erpLogout({ sid: cookie.sid, csrfToken: "" }).catch(() => undefined)
    throw error
  }

  if (context.roles.length === 0) {
    await erpLogout({ sid: cookie.sid, csrfToken: context.csrfToken }).catch(() => undefined)
    throw new ErpError("no_app_role", "User has no Euron Export role")
  }

  return { ...context, sid: cookie.sid, sidExpiresAt: cookie.expiresAt }
}

/** End the Frappe session (POST-only in v16). Best effort: never throws for an already-dead session. */
export async function erpLogout(session: Pick<ErpSession, "sid" | "csrfToken">): Promise<void> {
  const baseUrl = getErpBaseUrl()
  const headers: Record<string, string> = { Accept: "application/json", Cookie: `sid=${session.sid}` }
  if (isValidCsrfToken(session.csrfToken)) headers["X-Frappe-CSRF-Token"] = session.csrfToken
  const res = await erpFetch(`${baseUrl}/api/method/logout`, { method: "POST", headers })
  await res.body?.cancel().catch(() => undefined)
  if (!res.ok && res.status !== 401 && res.status !== 403) {
    throw errorFromResponse("logout", res.status, undefined)
  }
}
