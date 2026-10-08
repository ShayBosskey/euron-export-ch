import "server-only"

import { erpCall } from "./erp/client"
import { GARAGE_PORTAL_USER, type AppRole } from "./erp/roles"
import { isErpError, isReauthRequired } from "./erp/errors"
import type { ErpCallOptions } from "./erp/http"
import { formatSwissDate, fromPickupResponse, parseGarageId, REQUEST_PICKUP_METHOD } from "./portal-data"

export type PickupResult =
  | { success: true; message: string; requestId: string; created: boolean }
  | { success: false; message: string; reauth?: true }

type Caller = <T>(method: string, options?: ErpCallOptions) => Promise<T>

/**
 * A9 — who may file a pickup. Garage Portal User only: Euron Admin can open the dashboard (D12) but
 * must not file pickups as a garage. ⚠ The ERP's require_roles() lets admins through, so this list
 * is currently the only place A9 is enforced (ERP-23 adds the server-side check). Pinned by tests.
 */
export const PICKUP_ROLES: readonly AppRole[] = [GARAGE_PORTAL_USER]

export const PICKUP_MESSAGES = {
  invalidGarage: "Please choose one of your garages.",
  reauth: "Your session has expired. Please sign in again.",
  rateLimited: "You have sent several pickup requests recently. Please try again later.",
  notYourGarage: "This garage is not linked to your account. Please contact Euron Export.",
  rejected: "The pickup request was not accepted. Please contact Euron Export.",
  unavailable: "The pickup service is temporarily unavailable. Please try again in a few minutes.",
} as const

/**
 * FE-01 — request a pickup for one of the caller's garages, as the logged-in user
 * (`portal.request_my_pickup`, POST with the user's CSRF token). The ERP checks the role, that the
 * garage belongs to this user, idempotency (one active request per garage) and a per-user rate limit.
 * The garage id comes from the browser, so it is only shape-checked here and never trusted.
 * Never throws.
 */
export async function requestPickup(rawGarageId: unknown, call: Caller = erpCall): Promise<PickupResult> {
  const garageId = parseGarageId(rawGarageId)
  if (!garageId) return { success: false, message: PICKUP_MESSAGES.invalidGarage }

  let payload: unknown
  try {
    payload = await call<unknown>(REQUEST_PICKUP_METHOD, { httpMethod: "POST", body: { garage_id: garageId } })
  } catch (error) {
    if (isReauthRequired(error)) return { success: false, message: PICKUP_MESSAGES.reauth, reauth: true }
    const kind = isErpError(error) ? error.kind : "unknown"
    console.error(`[pickup] request failed: ${kind}`)
    if (kind === "rate_limited") return { success: false, message: PICKUP_MESSAGES.rateLimited }
    // Fixed texts only: ERP messages (userMessage) can carry internal names or validation details.
    if (kind === "forbidden") return { success: false, message: PICKUP_MESSAGES.notYourGarage }
    if (kind === "validation" || kind === "not_found") return { success: false, message: PICKUP_MESSAGES.rejected }
    return { success: false, message: PICKUP_MESSAGES.unavailable }
  }

  const confirmation = fromPickupResponse(payload)
  if (!confirmation || confirmation.garageId !== garageId) {
    console.error("[pickup] request failed: bad_response")
    return { success: false, message: PICKUP_MESSAGES.unavailable }
  }

  const until = formatSwissDate(confirmation.validUntil)
  const suffix = until ? ` (valid until ${until})` : ""
  return {
    success: true,
    requestId: confirmation.requestId,
    created: confirmation.created,
    message: confirmation.created
      ? `Pickup requested${suffix}. Our team will schedule the collection.`
      : `A pickup is already requested for this garage${suffix}.`,
  }
}
