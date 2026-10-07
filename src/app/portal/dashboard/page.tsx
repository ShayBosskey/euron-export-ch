import type { Metadata } from "next"

import DashboardClient from "@/components/portal/DashboardClient"
import { PORTAL_HOME } from "@/lib/access"
import { requirePageAccess } from "@/lib/guards"

export const metadata: Metadata = {
  title: "Dashboard | Garage Portal — Euron Export",
  robots: { index: false, follow: false },
}

/** FE-02 — Garage Portal User / Euron Admin only (drivers are sent to /driver). */
export default async function DashboardPage() {
  const session = await requirePageAccess(PORTAL_HOME)

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #16191a 0%, #23272a 100%)" }}
    >
      <DashboardClient
        userName={session.user?.name ?? "Partner"}
        userEmail={session.user?.email ?? ""}
      />
    </main>
  )
}
