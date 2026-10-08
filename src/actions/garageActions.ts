"use server"

import { authorizeAction } from "@/lib/guards"
import { PICKUP_MESSAGES, PICKUP_ROLES, requestPickup } from "@/lib/pickup"
import type { PickupResult } from "@/lib/portal-data"

// Only async functions may be exported from a "use server" module (pinned by tests/server-actions.test.ts).

/**
 * FE-01 — server action behind the "Request Tire Pickup" button.
 *
 * Reachable by POST from any route, so it checks the role itself (A9: Garage Portal User only;
 * admins may view the dashboard but not file pickups as a garage). The ERP repeats every check as
 * the logged-in user — role, garage ownership, idempotency, rate limit — so nothing here is trusted
 * from the browser except the garage id, which the ERP validates against `Garage.portal_user`.
 */
export async function requestTirePickup(garageId: unknown): Promise<PickupResult> {
  const auth = await authorizeAction(PICKUP_ROLES)
  if (!auth.ok) {
    return auth.reason === "forbidden"
      ? { success: false, message: "Your account cannot request pickups." }
      : { success: false, message: PICKUP_MESSAGES.reauth, reauth: true }
  }
  return requestPickup(garageId)
}
