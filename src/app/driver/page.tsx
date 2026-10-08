import type { Metadata } from "next"
import { redirect } from "next/navigation"

import DriverDashboard from "@/components/driver/DriverDashboard"
import { DRIVER_HOME, rolesAllow } from "@/lib/access"
import { LOG_ROLES } from "@/lib/collection"
import { loadDriverRoute } from "@/lib/driver-route"
import { ERP_REAUTH_REDIRECT } from "@/lib/erp/errors"
import { requirePageAccess } from "@/lib/guards"

export const metadata: Metadata = {
  title: "Driver Dashboard | Euron Export",
  robots: { index: false, follow: false },
}

/**
 * FE-02 — Euron Driver / Euron Admin only. Data comes from the ERP as the logged-in user
 * (`driver.get_route_list`, no-store); the old integration-key call to a non-existent DocType is gone.
 * FE-04 — drivers log collections per stop (`driver.log_collection`); the form is only rendered for
 * LOG_ROLES and the server action re-checks the role.
 */
export default async function DriverPage() {
  const session = await requirePageAccess(DRIVER_HOME)

  const route = await loadDriverRoute()
  // redirect() throws by design — keep it outside any try/catch.
  if (route.status === "reauth") redirect(ERP_REAUTH_REDIRECT)

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #16191a 0%, #1a1e1f 100%)" }}
    >
      <DriverDashboard
        garages={route.status === "ok" ? route.garages : []}
        fetchError={route.status === "error" ? route.error : null}
        driverName={session.user?.name ?? "Driver"}
        canLogCollection={rolesAllow(session.roles, LOG_ROLES)}
      />
    </main>
  )
}
