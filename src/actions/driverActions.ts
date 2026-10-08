"use server"

import { COLLECTION_MESSAGES, LOG_ROLES, logCollection } from "@/lib/collection"
import type { CollectionResult } from "@/lib/collection-data"
import { authorizeAction } from "@/lib/guards"

// Only async functions may be exported from a "use server" module (pinned by tests/server-actions.test.ts).

/**
 * FE-04 — server action behind the driver's "Log collection" form.
 *
 * Reachable by POST from any route, so it checks the role itself (A9: Euron Driver only). The input
 * is untrusted and re-validated in `logCollection`; the ERP repeats every check as the logged-in user.
 */
export async function submitCollectionLog(input: unknown): Promise<CollectionResult> {
  const auth = await authorizeAction(LOG_ROLES)
  if (!auth.ok) {
    return auth.reason === "forbidden"
      ? { success: false, message: COLLECTION_MESSAGES.forbidden }
      : { success: false, message: COLLECTION_MESSAGES.reauth, reauth: true }
  }
  return logCollection(input)
}
