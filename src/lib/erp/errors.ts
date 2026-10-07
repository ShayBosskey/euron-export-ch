/**
 * Typed errors for every call from the Next.js server to the Frappe ERP.
 *
 * Callers branch on `kind`, never on message text. `userMessage` is only set when the ERP sent a
 * message that is safe to show an end user (validation / permission / rate-limit); server errors
 * never leak details. Nothing in here ever contains cookies, tokens or request headers.
 */

export type ErpErrorKind =
  | "config" // ERP base URL missing or invalid
  | "network" // DNS / connection refused / TLS
  | "timeout" // no answer within the timeout
  | "unauthenticated" // ERP session gone (401, Guest 403, CSRF mismatch) → force re-login
  | "forbidden" // logged in, but not allowed (real 403)
  | "validation" // 400 / 417 — bad input, business rule
  | "not_found" // 404 — unknown method or record
  | "rate_limited" // 429
  | "server" // 5xx
  | "bad_response" // ERP answered something we cannot interpret
  | "no_app_role" // login OK, but the user has none of the Euron app roles

export class ErpError extends Error {
  readonly kind: ErpErrorKind
  readonly status?: number
  readonly excType?: string
  readonly userMessage?: string

  constructor(
    kind: ErpErrorKind,
    message: string,
    details: { status?: number; excType?: string; userMessage?: string; cause?: unknown } = {}
  ) {
    super(message, details.cause === undefined ? undefined : { cause: details.cause })
    this.name = "ErpError"
    this.kind = kind
    this.status = details.status
    this.excType = details.excType
    this.userMessage = details.userMessage
  }
}

export function isErpError(value: unknown): value is ErpError {
  return value instanceof ErpError
}

/** True when the only sensible reaction is to send the user back to the login page. */
export function isReauthRequired(value: unknown): boolean {
  return isErpError(value) && value.kind === "unauthenticated"
}

/** Where pages / server actions send the user when `isReauthRequired` is true. */
export const ERP_REAUTH_REDIRECT = "/portal?error=SessionExpired"

/** Frappe exception types that mean "this session is no longer usable". */
const REAUTH_EXC_TYPES = new Set(["AuthenticationError", "SessionExpired", "CSRFTokenError"])

export function isReauthExcType(excType: string | undefined): boolean {
  return excType !== undefined && REAUTH_EXC_TYPES.has(excType)
}

const MAX_USER_MESSAGE_LENGTH = 300

/** Strip HTML that Frappe puts into messages (e.g. <strong>) and collapse whitespace. */
export function toPlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_USER_MESSAGE_LENGTH)
}

/**
 * Extract the first human-readable message from a Frappe error body.
 * Frappe sends `_server_messages` as a JSON string containing a list of JSON strings, each an
 * object with a `message` field. Anything malformed is ignored (returns undefined).
 */
export function extractFrappeMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined
  const record = body as Record<string, unknown>

  const raw = record._server_messages
  if (typeof raw === "string") {
    try {
      const outer: unknown = JSON.parse(raw)
      if (Array.isArray(outer)) {
        for (const item of outer) {
          let parsed: unknown = item
          if (typeof item === "string") {
            try {
              parsed = JSON.parse(item)
            } catch {
              parsed = item
            }
          }
          const text =
            typeof parsed === "string"
              ? parsed
              : parsed && typeof parsed === "object" && typeof (parsed as { message?: unknown }).message === "string"
                ? (parsed as { message: string }).message
                : undefined
          if (text) {
            const plain = toPlainText(text)
            if (plain) return plain
          }
        }
      }
    } catch {
      // malformed _server_messages → fall through
    }
  }

  if (typeof record.message === "string") {
    const plain = toPlainText(record.message)
    if (plain) return plain
  }
  return undefined
}
