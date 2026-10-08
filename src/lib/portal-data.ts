/**
 * FE-01 — pure mapping of the garage-portal ERP endpoints (`euron_export_erp.api.portal.*`) to the
 * minimal shapes passed to client components. No I/O here (see portal-garages.ts / pickup.ts).
 */

export const MY_GARAGES_METHOD = "euron_export_erp.api.portal.get_my_garages"
export const REQUEST_PICKUP_METHOD = "euron_export_erp.api.portal.request_my_pickup"

/** Frappe document names are ≤ 140 chars (varchar(140)). */
export const MAX_GARAGE_ID_LENGTH = 140

export interface ActivePickup {
  /** ISO date (YYYY-MM-DD) until which the request keeps the garage boosted. */
  validUntil: string | null
}

export interface PortalGarage {
  id: string
  name: string
  city?: string
  postalCode?: string
  pickup: ActivePickup | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function text(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function isoDate(value: unknown): string | null {
  const s = text(value, 10)
  return s && ISO_DATE.test(s) && !Number.isNaN(Date.parse(s)) ? s : null
}

/** A garage id as accepted from the browser: a non-empty string without control characters. */
export function parseGarageId(value: unknown): string | null {
  if (typeof value !== "string") return null
  const id = value.trim()
  if (!id || id.length > MAX_GARAGE_ID_LENGTH || /[\u0000-\u001f\u007f]/.test(id)) return null
  return id
}

/**
 * Rows of `get_my_garages` → PortalGarage. `null` when the payload is not a list (ERP error, not
 * "no garages"). Rows without an id are dropped.
 */
export function fromMyGarages(payload: unknown): PortalGarage[] | null {
  if (!Array.isArray(payload)) return null
  const garages: PortalGarage[] = []
  for (const row of payload) {
    if (!row || typeof row !== "object") continue
    const r = row as Record<string, unknown>
    const id = text(r.name, MAX_GARAGE_ID_LENGTH)
    if (!id) continue

    let pickup: ActivePickup | null = null
    const raw = r.pickup_request
    if (raw && typeof raw === "object") {
      const p = raw as Record<string, unknown>
      const pickupId = text(p.name, MAX_GARAGE_ID_LENGTH)
      if (pickupId) pickup = { validUntil: isoDate(p.valid_until) }
    }

    garages.push({
      id,
      name: text(r.garage_name) ?? id,
      city: text(r.city),
      postalCode: text(r.postal_code, 20),
      pickup,
    })
  }
  return garages
}

/**
 * Result of the pickup server action. Declared here (pure module) rather than in the action file:
 * a "use server" module may only export async functions — a re-exported type there becomes a
 * runtime reference and crashes the action module ("PickupResult is not defined").
 */
export type PickupResult =
  | { success: true; message: string; requestId: string; created: boolean }
  | { success: false; message: string; reauth?: true }

export interface PickupConfirmation {
  requestId: string
  garageId: string
  /** false = an active request already existed (idempotent replay), nothing new was created. */
  created: boolean
  validUntil: string | null
}

/** Response of `request_my_pickup` → PickupConfirmation, or `null` if it is not what we expect. */
export function fromPickupResponse(payload: unknown): PickupConfirmation | null {
  if (!payload || typeof payload !== "object") return null
  const r = payload as Record<string, unknown>
  const requestId = text(r.pickup_request, MAX_GARAGE_ID_LENGTH)
  const garageId = text(r.garage, MAX_GARAGE_ID_LENGTH)
  if (!requestId || !garageId || typeof r.created !== "boolean") return null
  return { requestId, garageId, created: r.created, validUntil: isoDate(r.valid_until) }
}

/** 2026-10-15 → 15.10.2026 (Swiss notation, no timezone shifts: the ERP sends a plain date). */
export function formatSwissDate(iso: string | null): string | null {
  if (!iso || !ISO_DATE.test(iso)) return null
  const [y, m, d] = iso.split("-")
  return `${d}.${m}.${y}`
}
