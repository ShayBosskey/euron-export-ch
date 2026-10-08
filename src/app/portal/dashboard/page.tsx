import type { Metadata } from "next"
import { redirect } from "next/navigation"

import DashboardClient from "@/components/portal/DashboardClient"
import { PORTAL_HOME, rolesAllow } from "@/lib/access"
import { ERP_REAUTH_REDIRECT } from "@/lib/erp/errors"
import { requirePageAccess } from "@/lib/guards"
import { PICKUP_ROLES } from "@/lib/pickup"
import { loadMyGarages } from "@/lib/portal-garages"

export const metadata: Metadata = {
  title: "Dashboard | Garage Portal — Euron Export",
  robots: { index: false, follow: false },
}

/**
 * FE-02 — Garage Portal User / Euron Admin only (drivers are sent to /driver).
 * FE-01 — the user's own garages and active pickups come from the ERP as that user.
 */
export default async function DashboardPage() {
  const session = await requirePageAccess(PORTAL_HOME)

  const result = await loadMyGarages()
  // redirect() throws by design — keep it outside any try/catch.
  if (result.status === "reauth") redirect(ERP_REAUTH_REDIRECT)

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #16191a 0%, #23272a 100%)" }}
    >
      <DashboardClient
        userName={session.user?.name ?? "Partner"}
        userEmail={session.user?.email ?? ""}
        garages={result.status === "ok" ? result.garages : []}
        loadError={result.status === "error"}
        canRequestPickup={rolesAllow(session.roles, PICKUP_ROLES)}
      />
    </main>
  )
}
