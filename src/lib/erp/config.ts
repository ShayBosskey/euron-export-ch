import { ErpError } from "./errors"

/** Default timeout for one ERP request. Login + context = two requests. */
export const ERP_TIMEOUT_MS = 10_000

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"])

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost")
}

/**
 * Base URL of the Frappe ERP (env `ERPNEXT_BASE_URL`), validated on every call so a missing or
 * malformed value fails loudly as `kind: "config"` instead of producing odd fetch errors.
 * HTTPS is mandatory except for localhost during development (devcontainer: http://localhost:8000).
 */
export function getErpBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.ERPNEXT_BASE_URL?.trim()
  if (!raw) throw new ErpError("config", "ERPNEXT_BASE_URL is not configured")

  let url: URL
  try {
    url = new URL(raw)
  } catch (cause) {
    throw new ErpError("config", "ERPNEXT_BASE_URL is not a valid URL", { cause })
  }

  const local = isLocalHost(url.hostname)
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local && env.NODE_ENV !== "production")) {
    throw new ErpError("config", "ERPNEXT_BASE_URL must use https (http is allowed for localhost in development only)")
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new ErpError("config", "ERPNEXT_BASE_URL must not contain credentials, a query string or a fragment")
  }
  return url.origin + url.pathname.replace(/\/+$/, "")
}

/** Frappe whitelisted-method paths are dotted Python identifiers; anything else never reaches fetch. */
const METHOD_PATTERN = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)+$/

export function methodUrl(baseUrl: string, method: string): string {
  if (!METHOD_PATTERN.test(method)) {
    throw new ErpError("config", `Invalid ERP method name: ${JSON.stringify(method).slice(0, 80)}`)
  }
  return `${baseUrl}/api/method/${method}`
}
