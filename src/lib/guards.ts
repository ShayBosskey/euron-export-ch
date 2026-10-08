import "server-only"

import type { Session } from "next-auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { canAccess, homeFor, LOGIN_PATH, rolesAllow, type ProtectedRoute } from "./access"
import { authOptions } from "./auth"
import { ERP_REAUTH_REDIRECT } from "./erp/errors"
import type { AppRole } from "./erp/roles"

/**
 * FE-02 — authoritative role checks inside Next.js (A8). `proxy.ts` only redirects early; every
 * protected page and server action must call one of these, because Proxy coverage can silently
 * disappear (matcher changes, server actions posted to another route).
 */

/** Page guard: returns the session or redirects (login / re-login / the user's own home). */
export async function requirePageAccess(route: ProtectedRoute): Promise<Session> {
  const session = await getServerSession(authOptions)
  if (!session) redirect(LOGIN_PATH)
  if (session.error) redirect(ERP_REAUTH_REDIRECT)
  if (!canAccess(session.roles, route)) {
    // homeFor() is always a route the user may open (pinned by tests), so this cannot loop.
    redirect(homeFor(session.roles) ?? LOGIN_PATH)
  }
  return session
}

export type ActionAuth =
  | { ok: true; session: Session }
  | { ok: false; reason: "unauthenticated" | "forbidden" }

/**
 * Server-action guard: never throws or redirects, the caller turns a denial into a result.
 * Takes an explicit role list (not a page route): what a user may *do* is often narrower than what
 * they may *see* — e.g. Euron Admin can open the garage dashboard but must not request pickups.
 */
export async function authorizeAction(allowed: readonly AppRole[]): Promise<ActionAuth> {
  let session: Session | null
  try {
    session = await getServerSession(authOptions)
  } catch {
    return { ok: false, reason: "unauthenticated" }
  }
  if (!session || session.error) return { ok: false, reason: "unauthenticated" }
  if (!rolesAllow(session.roles, allowed)) return { ok: false, reason: "forbidden" }
  return { ok: true, session }
}
