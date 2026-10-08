import "server-only"

import { erpCall } from "./erp/client"
import { isErpError, isReauthRequired } from "./erp/errors"
import type { ErpCallOptions } from "./erp/http"
import { fromMyGarages, MY_GARAGES_METHOD, type PortalGarage } from "./portal-data"

export type MyGaragesResult =
  | { status: "ok"; garages: PortalGarage[] }
  | { status: "reauth" }
  | { status: "error" }

type Caller = <T>(method: string, options?: ErpCallOptions) => Promise<T>

/**
 * FE-01 — the logged-in garage user's own garages (+ active pickup), as that user. The ERP derives
 * the garages from `Garage.portal_user`; the browser never names a garage to read.
 * Never throws: the page chooses between re-login and a fallback card.
 */
export async function loadMyGarages(call: Caller = erpCall): Promise<MyGaragesResult> {
  let payload: unknown
  try {
    payload = await call<unknown>(MY_GARAGES_METHOD)
  } catch (error) {
    if (isReauthRequired(error)) return { status: "reauth" }
    console.error(`[portal] garage list failed: ${isErpError(error) ? error.kind : "unknown"}`)
    return { status: "error" }
  }
  const garages = fromMyGarages(payload)
  if (!garages) {
    console.error("[portal] garage list failed: bad_response (not a list)")
    return { status: "error" }
  }
  return { status: "ok", garages }
}
