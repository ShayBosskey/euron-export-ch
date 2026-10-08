import "server-only"

import { erpCall } from "./erp/client"
import { EURON_DRIVER, type AppRole } from "./erp/roles"
import { isErpError, isReauthRequired } from "./erp/errors"
import type { ErpCallOptions } from "./erp/http"
import {
  fromLogResponse,
  LOG_COLLECTION_METHOD,
  sameCounts,
  toErpBody,
  validateCollection,
  type CollectionResult,
} from "./collection-data"

/**
 * A9 — who may log a collection: Euron Driver only. Euron Admin may open /driver (D12) and corrects
 * or back-fills logs in Desk; a person who also drives gets the Euron Driver role as well. Every log
 * is stored with the logged-in user as owner, so this keeps the field log attributable to drivers.
 * The ERP lets admins through (require_roles) — this list is the Next-side policy. Pinned by tests.
 */
export const LOG_ROLES: readonly AppRole[] = [EURON_DRIVER]

/** Fixed texts only (A11): ERP messages are never forwarded to the browser. */
export const COLLECTION_MESSAGES = {
  invalid: "Please check the highlighted fields.",
  reauth: "Your session has expired. Please sign in again.",
  forbidden: "Your account cannot log collections.",
  rejected: "The ERP did not accept this log (garage inactive, date or numbers out of range). Refresh the route or contact dispatch.",
  garageGone: "This garage no longer exists in the ERP. Refresh the route.",
  // Network/timeout/5xx: the log may or may not have been stored. Resending is safe because the
  // same client_uuid can never create a second log.
  unconfirmed: "Couldn't confirm the save. Tap “Save log” again — it will not be recorded twice.",
} as const

export type { CollectionResult }

type Caller = <T>(method: string, options?: ErpCallOptions) => Promise<T>

function tires(n: number): string {
  return n === 1 ? "1 tire" : `${n} tires`
}

/**
 * FE-04 — store one collection as the logged-in driver (`driver.log_collection`, POST with the
 * user's CSRF token). Input comes from the browser and is re-validated here; the ERP checks the role,
 * that the garage is active, all business rules and idempotency on `client_uuid`. Never throws.
 */
export async function logCollection(raw: unknown, call: Caller = erpCall): Promise<CollectionResult> {
  const validation = validateCollection(raw)
  if (!validation.ok) {
    return { success: false, message: COLLECTION_MESSAGES.invalid, fieldErrors: validation.errors }
  }
  const input = validation.value

  let payload: unknown
  try {
    payload = await call<unknown>(LOG_COLLECTION_METHOD, { httpMethod: "POST", body: toErpBody(input) })
  } catch (error) {
    if (isReauthRequired(error)) return { success: false, message: COLLECTION_MESSAGES.reauth, reauth: true }
    const kind = isErpError(error) ? error.kind : "unknown"
    console.error(`[collection] log failed: ${kind}`)
    if (kind === "forbidden") return { success: false, message: COLLECTION_MESSAGES.forbidden }
    if (kind === "not_found") return { success: false, message: COLLECTION_MESSAGES.garageGone }
    if (kind === "validation") return { success: false, message: COLLECTION_MESSAGES.rejected }
    return { success: false, message: COLLECTION_MESSAGES.unconfirmed, retrySafe: true }
  }

  const logged = fromLogResponse(payload)
  if (!logged || logged.garageId !== input.garageId || logged.clientUuid !== input.clientUuid) {
    // The ERP answered 2xx but not with this log: treat as unconfirmed, the key keeps a resend safe.
    console.error("[collection] log failed: bad_response")
    return { success: false, message: COLLECTION_MESSAGES.unconfirmed, retrySafe: true }
  }

  const mismatch = logged.duplicate && !sameCounts(input, logged)
  let message: string
  if (mismatch) {
    message =
      `This entry was already saved earlier with different numbers (${tires(logged.tireCount)}). ` +
      `Do not log it again — ask dispatch to correct log ${logged.logId}.`
  } else if (logged.duplicate) {
    message = `Already saved: ${tires(logged.tireCount)} (log ${logged.logId}).`
  } else {
    message = `Collection saved: ${tires(logged.tireCount)} (log ${logged.logId}).`
  }

  return {
    success: true,
    message,
    logId: logged.logId,
    tireCount: logged.tireCount,
    duplicate: logged.duplicate,
    mismatch,
  }
}
