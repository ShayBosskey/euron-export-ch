/**
 * Read the Frappe session cookie (`sid`) from a /api/method/login response.
 *
 * Frappe sets several cookies on login (sid, system_user, full_name, user_id, user_image);
 * only `sid` matters. `sid=Guest` means "not logged in" and is ignored.
 */

export type ErpSessionCookie = {
  sid: string
  /** Epoch milliseconds, or null when the cookie carries no expiry (browser-session cookie). */
  expiresAt: number | null
}

/** Frappe session ids are random hashes; anything else is rejected (also blocks header injection). */
const SID_PATTERN = /^[A-Za-z0-9]{8,256}$/

export function isValidSid(value: unknown): value is string {
  return typeof value === "string" && SID_PATTERN.test(value)
}

/** All Set-Cookie header values. Node ≥ 19.7 / undici exposes getSetCookie(); keep a safe fallback. */
export function readSetCookieHeaders(headers: Headers): string[] {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] }
  if (typeof withGetter.getSetCookie === "function") return withGetter.getSetCookie()
  const joined = headers.get("set-cookie")
  // Fallback split: only on commas that start a new "name=" pair (Expires dates contain commas).
  return joined ? joined.split(/,(?=\s*[A-Za-z0-9_.-]+=)/) : []
}

export function parseSetCookie(header: string, now: number): { name: string; value: string; expiresAt: number | null } | null {
  const parts = header.split(";")
  const first = parts.shift()
  if (!first) return null
  const eq = first.indexOf("=")
  if (eq <= 0) return null
  const name = first.slice(0, eq).trim()
  let value = first.slice(eq + 1).trim()
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) value = value.slice(1, -1)

  let maxAge: number | null = null
  let expires: number | null = null
  for (const part of parts) {
    const idx = part.indexOf("=")
    const key = (idx === -1 ? part : part.slice(0, idx)).trim().toLowerCase()
    const attr = idx === -1 ? "" : part.slice(idx + 1).trim()
    if (key === "max-age" && /^-?\d+$/.test(attr)) {
      maxAge = Number.parseInt(attr, 10)
    } else if (key === "expires") {
      const parsed = Date.parse(attr)
      if (!Number.isNaN(parsed)) expires = parsed
    }
  }
  // RFC 6265: Max-Age wins over Expires.
  const expiresAt = maxAge !== null ? now + maxAge * 1000 : expires
  return { name, value, expiresAt }
}

/** The last valid, non-Guest, non-expired `sid` set by the response — or null. */
export function extractSessionCookie(headers: Headers, now: number = Date.now()): ErpSessionCookie | null {
  let found: ErpSessionCookie | null = null
  for (const header of readSetCookieHeaders(headers)) {
    const cookie = parseSetCookie(header, now)
    if (!cookie || cookie.name !== "sid") continue
    if (cookie.value === "Guest" || !isValidSid(cookie.value)) {
      found = null
      continue
    }
    if (cookie.expiresAt !== null && cookie.expiresAt <= now) {
      found = null
      continue
    }
    found = { sid: cookie.value, expiresAt: cookie.expiresAt }
  }
  return found
}
