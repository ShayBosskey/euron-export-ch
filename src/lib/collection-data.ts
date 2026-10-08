/**
 * FE-04 — pure validation and mapping for `euron_export_erp.api.driver.log_collection`.
 *
 * Client-safe on purpose (no I/O, no secrets): the form uses it for instant feedback and the server
 * action runs it again on the untrusted input before anything reaches the ERP. The ERP controller
 * (Tire Collection Log) re-checks every rule and stays the final authority — the limits below
 * mirror it so a driver gets a precise message instead of a generic rejection.
 */
import { parseGarageId } from "./portal-data"

export const LOG_COLLECTION_METHOD = "euron_export_erp.api.driver.log_collection"

/** ERP `VALID_PAYMENT_METHODS` (tire_collection_log.py) — exact, case-sensitive strings. */
export const PAYMENT_METHODS = ["TWINT", "Card", "Cash"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** ERP `MAX_TIRES_PER_CATEGORY`. */
export const MAX_TIRES_PER_CATEGORY = 10_000
/**
 * Front-end typo guard only (the ERP has no upper bound): CHF 99'999.99 is far above any single
 * collection, so a slipped thumb ("15000" for "150.00") is caught before it is booked.
 */
export const MAX_AMOUNT_CHF = 99_999.99
/** The ERP accepts 2000; a driver note on a phone never needs more than this. */
export const MAX_NOTES_LENGTH = 500

export type CollectionField = "garageId" | "high" | "mid" | "trash" | "counts" | "amount" | "paymentMethod" | "notes" | "clientUuid"

export const FIELD_MESSAGES: Readonly<Record<CollectionField, string>> = {
  garageId: "Please choose a garage from today's route.",
  high: `Enter a whole number from 0 to ${MAX_TIRES_PER_CATEGORY}.`,
  mid: `Enter a whole number from 0 to ${MAX_TIRES_PER_CATEGORY}.`,
  trash: `Enter a whole number from 0 to ${MAX_TIRES_PER_CATEGORY}.`,
  counts: "Log at least one tire.",
  amount: "Enter an amount in CHF, e.g. 120 or 120.50.",
  paymentMethod: "Choose TWINT, Card or Cash for the amount charged.",
  notes: `Notes can be at most ${MAX_NOTES_LENGTH} characters, without special control characters.`,
  clientUuid: "This form is out of date. Please reload the page.",
}

export interface CollectionInput {
  garageId: string
  high: number
  mid: number
  trash: number
  /** CHF, at most two decimals. */
  amount: number
  /** null when nothing was charged (a method without an amount carries no meaning). */
  paymentMethod: PaymentMethod | null
  /** "" when empty. */
  notes: string
  /** Idempotency key: the same key never creates a second log (ERP unique constraint). */
  clientUuid: string
}

export type CollectionValidation =
  | { ok: true; value: CollectionInput }
  | { ok: false; errors: Partial<Record<CollectionField, string>> }

const DIGITS = /^\d{1,6}$/
const AMOUNT = /^\d{1,5}(?:\.\d{1,2})?$/
/** Same pattern as the ERP's `to_client_uuid` (RFC 4122 / 9562 versions 1–8, variant 10xx). */
const CLIENT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
/** Control characters other than tab / line feed / carriage return. */
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/

/** A tire count from a form field: "" → 0; only whole, non-negative numbers up to the ERP limit. */
export function parseTireCount(raw: unknown): number | null {
  let n: number
  if (typeof raw === "number") {
    n = raw
  } else if (typeof raw === "string") {
    const s = raw.trim()
    if (s === "") return 0
    if (!DIGITS.test(s)) return null
    n = Number(s)
  } else {
    return null
  }
  return Number.isSafeInteger(n) && n >= 0 && n <= MAX_TIRES_PER_CATEGORY ? n : null
}

/**
 * CHF from a form field. Accepts Swiss input habits: "120", "120.50", "120,50", "1'250.50", "1 250".
 * "" → 0. Rejects negatives, exponents, more than two decimals and anything above MAX_AMOUNT_CHF.
 */
export function parseAmountChf(raw: unknown): number | null {
  let s: string
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null
    s = String(raw)
  } else if (typeof raw === "string") {
    s = raw.trim()
    if (s === "") return 0
  } else {
    return null
  }
  // Thousands separators (apostrophe, right single quote, spaces incl. NBSP / narrow NBSP), then a
  // single decimal comma → dot. Two separators of different kinds ("1.250,50") are rejected below.
  s = s.replace(/['’\s  ]/g, "")
  if ((s.match(/,/g) ?? []).length === 1 && !s.includes(".")) s = s.replace(",", ".")
  if (!AMOUNT.test(s)) return null
  const n = Math.round(Number(s) * 100) / 100
  return Number.isFinite(n) && n >= 0 && n <= MAX_AMOUNT_CHF ? n : null
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value)
}

/** Lower-cased idempotency key, or null when it is not a UUID the ERP will accept. */
export function parseClientUuid(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const s = raw.trim().toLowerCase()
  return CLIENT_UUID.test(s) ? s : null
}

/**
 * A fresh UUID v4 for one log entry. Uses `crypto.getRandomValues` rather than `randomUUID`
 * because the latter only exists in secure contexts — a driver phone testing against the dev
 * server over plain http on the LAN would otherwise crash. `source` is injectable for tests.
 */
export function newClientUuid(source: Pick<Crypto, "getRandomValues"> = globalThis.crypto): string {
  const bytes = source.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Validate untrusted input (form state or a server-action argument). Never throws. */
export function validateCollection(raw: unknown): CollectionValidation {
  const r: Record<string, unknown> = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const errors: Partial<Record<CollectionField, string>> = {}

  const garageId = parseGarageId(r.garageId)
  if (!garageId) errors.garageId = FIELD_MESSAGES.garageId

  const high = parseTireCount(r.high)
  const mid = parseTireCount(r.mid)
  const trash = parseTireCount(r.trash)
  if (high === null) errors.high = FIELD_MESSAGES.high
  if (mid === null) errors.mid = FIELD_MESSAGES.mid
  if (trash === null) errors.trash = FIELD_MESSAGES.trash
  if (high !== null && mid !== null && trash !== null && high + mid + trash === 0) {
    errors.counts = FIELD_MESSAGES.counts
  }

  const amount = parseAmountChf(r.amount)
  if (amount === null) errors.amount = FIELD_MESSAGES.amount

  // ERP rule: an amount needs a method. Without an amount the method is dropped, not rejected.
  let paymentMethod: PaymentMethod | null = null
  if (amount !== null && amount > 0) {
    if (isPaymentMethod(r.paymentMethod)) paymentMethod = r.paymentMethod
    else errors.paymentMethod = FIELD_MESSAGES.paymentMethod
  }

  let notes = ""
  if (r.notes !== undefined && r.notes !== null) {
    if (typeof r.notes !== "string") {
      errors.notes = FIELD_MESSAGES.notes
    } else {
      notes = r.notes.trim()
      if (notes.length > MAX_NOTES_LENGTH || CONTROL_CHARS.test(notes)) errors.notes = FIELD_MESSAGES.notes
    }
  }

  const clientUuid = parseClientUuid(r.clientUuid)
  if (!clientUuid) errors.clientUuid = FIELD_MESSAGES.clientUuid

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: {
      garageId: garageId!,
      high: high!,
      mid: mid!,
      trash: trash!,
      amount: amount!,
      paymentMethod,
      notes,
      clientUuid: clientUuid!,
    },
  }
}

/**
 * Body for `log_collection`. `collection_date` is deliberately omitted (ERP uses its own "today");
 * FE-12's offline queue will add the capture date. Empty optional fields are not sent at all.
 */
export function toErpBody(input: CollectionInput): Record<string, string | number> {
  const body: Record<string, string | number> = {
    garage_id: input.garageId,
    high_profile_count: input.high,
    mid_profile_count: input.mid,
    trash_count: input.trash,
    amount_charged: input.amount,
    client_uuid: input.clientUuid,
  }
  if (input.paymentMethod) body.payment_method = input.paymentMethod
  if (input.notes) body.notes = input.notes
  return body
}

/**
 * Result of the log-collection server action. Declared here (pure module), not in the action file:
 * a "use server" module may only export async functions (tests/server-actions.test.ts).
 */
export type CollectionResult =
  | {
      success: true
      message: string
      logId: string
      tireCount: number
      /** The key was already stored (e.g. a retry after a lost answer). */
      duplicate: boolean
      /** duplicate AND the stored counts differ from this submission — the driver must tell dispatch. */
      mismatch: boolean
    }
  | {
      success: false
      message: string
      /** Field-level texts for the form (validation failures only). */
      fieldErrors?: Partial<Record<CollectionField, string>>
      reauth?: true
      /** true = the outcome is unknown; resend with the SAME client_uuid. */
      retrySafe?: true
    }

export interface LoggedCollection {
  logId: string
  garageId: string
  clientUuid: string
  high: number
  mid: number
  trash: number
  tireCount: number
  /** true = this client_uuid had already been stored; nothing new was written. */
  duplicate: boolean
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null
}

/** Response of `log_collection` → LoggedCollection, or null if it is not what the ERP sends. */
export function fromLogResponse(payload: unknown): LoggedCollection | null {
  if (!payload || typeof payload !== "object") return null
  const r = payload as Record<string, unknown>
  const logId = parseGarageId(r.log) // same shape rule: Frappe document name
  const garageId = parseGarageId(r.garage)
  const clientUuid = parseClientUuid(r.client_uuid)
  const high = count(r.high_profile_count)
  const mid = count(r.mid_profile_count)
  const trash = count(r.trash_count)
  const tireCount = count(r.tire_count)
  if (!logId || !garageId || !clientUuid || typeof r.duplicate !== "boolean") return null
  if (high === null || mid === null || trash === null || tireCount === null) return null
  return { logId, garageId, clientUuid, high, mid, trash, tireCount, duplicate: r.duplicate }
}

/** Did the stored log record exactly the tire counts this submission carried? */
export function sameCounts(input: Pick<CollectionInput, "high" | "mid" | "trash">, logged: LoggedCollection): boolean {
  return input.high === logged.high && input.mid === logged.mid && input.trash === logged.trash
}
