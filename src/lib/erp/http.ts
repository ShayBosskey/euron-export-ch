import "server-only"

import { ERP_TIMEOUT_MS, getErpBaseUrl, methodUrl } from "./config"
import { isValidSid } from "./cookies"
import { ErpError, extractFrappeMessage, isReauthExcType } from "./errors"

/** The server-side ERP credentials of one logged-in user. Never sent to the browser. */
export type ErpSession = {
  sid: string
  csrfToken: string
  /** Epoch ms after which the session is treated as expired (≤ Frappe's own cookie expiry). */
  expiresAt: number
}

export type ErpParams = Record<string, string | number | boolean | null | undefined>

export type ErpCallOptions = {
  httpMethod?: "GET" | "POST"
  /** Query-string parameters (GET). */
  params?: ErpParams
  /** JSON body (POST). */
  body?: Record<string, unknown>
  timeoutMs?: number
  signal?: AbortSignal
}

const CSRF_PATTERN = /^[A-Za-z0-9_-]{8,256}$/

export function isValidCsrfToken(value: unknown): value is string {
  return typeof value === "string" && CSRF_PATTERN.test(value)
}

/** Shared by login and calls: one fetch with timeout, no redirects, no caching, typed failures. */
export async function erpFetch(
  url: string,
  init: RequestInit,
  { timeoutMs = ERP_TIMEOUT_MS, signal }: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<Response> {
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([timeout, signal]) : timeout
  try {
    return await fetch(url, {
      ...init,
      redirect: "manual", // a redirect from the API means something is wrong; never follow it
      cache: "no-store", // per-user data must never land in Next.js' data cache
      signal: combined,
    })
  } catch (cause) {
    if (timeout.aborted) throw new ErpError("timeout", `ERP did not answer within ${timeoutMs} ms`, { cause })
    if (signal?.aborted) throw new ErpError("network", "ERP request was aborted", { cause })
    throw new ErpError("network", "ERP is unreachable", { cause })
  }
}

/** Read a response body as JSON; `undefined` if it is empty or not JSON. */
export async function readJson(res: Response): Promise<unknown> {
  let text: string
  try {
    text = await res.text()
  } catch {
    return undefined
  }
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function excTypeOf(body: unknown): string | undefined {
  if (body && typeof body === "object") {
    const value = (body as Record<string, unknown>).exc_type
    if (typeof value === "string" && /^[A-Za-z][A-Za-z0-9_]{0,80}$/.test(value)) return value
  }
  return undefined
}

/** Map a non-2xx Frappe response to an ErpError (403 is refined later by the caller's probe). */
export function errorFromResponse(method: string, status: number, body: unknown): ErpError {
  const excType = excTypeOf(body)
  const message = extractFrappeMessage(body)
  const details = { status, excType }

  if (status === 401 || isReauthExcType(excType)) {
    return new ErpError("unauthenticated", `ERP session rejected for ${method}`, details)
  }
  if (status === 403) {
    return new ErpError("forbidden", `ERP refused ${method}`, { ...details, userMessage: message })
  }
  if (status === 404) return new ErpError("not_found", `ERP method or record not found: ${method}`, details)
  if (status === 429) {
    return new ErpError("rate_limited", `ERP rate limit hit for ${method}`, { ...details, userMessage: message })
  }
  if (status >= 500) return new ErpError("server", `ERP server error (${status}) for ${method}`, details)
  if (status >= 400) {
    return new ErpError("validation", `ERP rejected the request for ${method}`, { ...details, userMessage: message })
  }
  // 1xx / 3xx (redirects are not followed)
  return new ErpError("bad_response", `Unexpected ERP status ${status} for ${method}`, details)
}

function buildQuery(params: ErpParams | undefined): string {
  if (!params) return ""
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ""
}

function assertUsableSession(session: ErpSession | null | undefined, now: number): asserts session is ErpSession {
  if (!session || !isValidSid(session.sid) || !isValidCsrfToken(session.csrfToken)) {
    throw new ErpError("unauthenticated", "No ERP session")
  }
  if (!Number.isFinite(session.expiresAt) || session.expiresAt <= now) {
    throw new ErpError("unauthenticated", "ERP session expired")
  }
}

function log(method: string, error: ErpError): void {
  // Method, status and exception type only — never headers, cookies, tokens or bodies.
  console.warn(`[erp] ${method} failed: ${error.kind}${error.status ? ` (HTTP ${error.status})` : ""}${error.excType ? ` ${error.excType}` : ""}`)
}

const SESSION_PROBE_METHOD = "euron_export_erp.api.session.get_session_context"

/**
 * Call a whitelisted Frappe method as the logged-in user.
 *
 * - GET: `Cookie: sid=…`; POST additionally `X-Frappe-CSRF-Token` and a JSON body.
 * - Returns Frappe's `message` payload, typed by the caller.
 * - Throws ErpError. A 403 is re-checked with one session probe: if the session itself is dead
 *   (Frappe answers Guest requests with 403) the error becomes `unauthenticated` → re-login;
 *   otherwise it stays `forbidden`.
 */
export async function callErp<T = unknown>(
  session: ErpSession | null | undefined,
  method: string,
  options: ErpCallOptions = {},
  now: number = Date.now()
): Promise<T> {
  const httpMethod = options.httpMethod ?? "GET"
  try {
    assertUsableSession(session, now)
    const baseUrl = getErpBaseUrl()
    const url = methodUrl(baseUrl, method)

    const headers: Record<string, string> = {
      Accept: "application/json",
      Cookie: `sid=${session.sid}`,
    }
    let body: string | undefined
    if (httpMethod === "POST") {
      headers["Content-Type"] = "application/json"
      headers["X-Frappe-CSRF-Token"] = session.csrfToken
      body = JSON.stringify(options.body ?? {})
    } else if (options.body !== undefined) {
      throw new ErpError("config", `A GET call cannot have a body (${method})`)
    }

    const res = await erpFetch(
      url + (httpMethod === "GET" ? buildQuery(options.params) : ""),
      { method: httpMethod, headers, body },
      { timeoutMs: options.timeoutMs, signal: options.signal }
    )
    const json = await readJson(res)

    if (res.ok) {
      if (!json || typeof json !== "object") {
        throw new ErpError("bad_response", `ERP sent a non-JSON answer for ${method}`, { status: res.status })
      }
      return (json as { message?: T }).message as T
    }

    let error = errorFromResponse(method, res.status, json)
    if (error.kind === "forbidden") {
      // The session endpoint allows every logged-in user, so its 403 can only mean "Guest".
      const alive = method === SESSION_PROBE_METHOD ? false : await sessionIsAlive(baseUrl, session.sid)
      if (!alive) {
        error = new ErpError("unauthenticated", `ERP session expired (${method})`, { status: error.status, excType: error.excType })
      }
    }
    throw error
  } catch (caught) {
    const error = caught instanceof ErpError ? caught : new ErpError("bad_response", `Unexpected failure calling ${method}`, { cause: caught })
    log(method, error)
    throw error
  }
}

/** One GET to the session endpoint. Unknown (network) counts as alive, so we never log out on a blip. */
async function sessionIsAlive(baseUrl: string, sid: string): Promise<boolean> {
  try {
    const res = await erpFetch(methodUrl(baseUrl, SESSION_PROBE_METHOD), {
      method: "GET",
      headers: { Accept: "application/json", Cookie: `sid=${sid}` },
    })
    await res.body?.cancel().catch(() => undefined)
    return res.ok || !(res.status === 401 || res.status === 403)
  } catch {
    return true
  }
}
