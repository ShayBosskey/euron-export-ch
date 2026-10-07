import "server-only"

import { cookies } from "next/headers"
import { getToken } from "next-auth/jwt"

import { ErpError } from "./errors"
import { callErp, type ErpCallOptions, type ErpSession } from "./http"

/**
 * FE-03c — the single entry point for server components, server actions and route handlers.
 *
 *   const route = await erpCall<RouteRow[]>("euron_export_erp.api.driver.get_route_list", {
 *     params: { max_rank: 3 },
 *   })
 *
 * On `isReauthRequired(error)` redirect to ERP_REAUTH_REDIRECT. Never import this from a client
 * component — `server-only` turns that into a build error.
 */
export async function erpCall<T = unknown>(method: string, options: ErpCallOptions = {}): Promise<T> {
  return callErp<T>(await getErpSession(), method, options)
}

/** Read the ERP credentials out of the encrypted NextAuth JWT cookie of the current request. */
export async function getErpSession(): Promise<ErpSession | null> {
  const cookieStore = await cookies()
  let token
  try {
    // `headers: {}` on purpose: credentials come from the HttpOnly cookie only, never from an
    // `Authorization: Bearer` header a caller could supply.
    token = await getToken({ req: { cookies: cookieStore, headers: {} } as never })
  } catch (cause) {
    throw new ErpError("unauthenticated", "Session token could not be read", { cause })
  }
  if (!token || token.error || !token.erp) return null
  return { sid: token.erp.sid, csrfToken: token.erp.csrfToken, expiresAt: token.erp.expiresAt }
}
