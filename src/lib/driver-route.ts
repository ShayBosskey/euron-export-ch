import "server-only"

import { erpCall } from "./erp/client"
import { isErpError, isReauthRequired } from "./erp/errors"
import type { ErpCallOptions } from "./erp/http"
import { fromRouteRows, type PendingGarage } from "./routing"

export const ROUTE_LIST_METHOD = "euron_export_erp.api.driver.get_route_list"

/** Ranks shown on "Today's route": 1 Critical · 2 High · 3 Normal. Ranks 4–5 need no pickup yet. */
export const ROUTE_MAX_RANK = 3
/** ERP caps at 500; the Google Maps deep link uses the first 10 GPS stops anyway. */
export const ROUTE_LIMIT = 100

export type DriverRouteError = "unavailable" | "forbidden"

export type DriverRouteResult =
  | { status: "ok"; garages: PendingGarage[] }
  | { status: "reauth" }
  | { status: "error"; error: DriverRouteError }

type Caller = <T>(method: string, options?: ErpCallOptions) => Promise<T>

/**
 * FE-02 — load the driver's route as the logged-in user (Frappe sid; ERP checks Euron Driver/Admin).
 * Never throws: the page decides between redirect (reauth) and a fallback UI (error).
 * `call` is injectable for tests; production uses the server-only `erpCall`.
 */
export async function loadDriverRoute(call: Caller = erpCall): Promise<DriverRouteResult> {
  let payload: unknown
  try {
    payload = await call<unknown>(ROUTE_LIST_METHOD, {
      params: { max_rank: ROUTE_MAX_RANK, limit: ROUTE_LIMIT },
    })
  } catch (error) {
    if (isReauthRequired(error)) return { status: "reauth" }
    const kind = isErpError(error) ? error.kind : "unknown"
    console.error(`[driver] route list failed: ${kind}`)
    return { status: "error", error: kind === "forbidden" ? "forbidden" : "unavailable" }
  }

  const garages = fromRouteRows(payload)
  if (!garages) {
    console.error("[driver] route list failed: bad_response (not a list)")
    return { status: "error", error: "unavailable" }
  }
  return { status: "ok", garages }
}
