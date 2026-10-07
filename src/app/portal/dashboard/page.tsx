import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import DashboardClient from "@/components/portal/DashboardClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Garage Portal — Euron Export",
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.error) redirect("/portal")

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
