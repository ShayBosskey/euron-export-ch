import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import DriverDashboard from "@/components/driver/DriverDashboard"
import type { Metadata } from "next"
import type { PendingGarage } from "@/lib/routing"

export const metadata: Metadata = {
  title: "Driver Dashboard | Euron Export",
  robots: { index: false, follow: false },
}

async function fetchPendingGarages(): Promise<PendingGarage[]> {
  const baseUrl   = process.env.ERPNEXT_BASE_URL
  const apiKey    = process.env.ERPNEXT_API_KEY
  const apiSecret = process.env.ERPNEXT_API_SECRET

  if (!baseUrl || !apiKey || !apiSecret) {
    console.error("[driver/page] ERPNext env vars not configured")
    return []
  }

  const fields  = JSON.stringify(["name", "garage_name", "address", "latitude", "longitude", "urgency", "request_date", "status"])
  const filters = JSON.stringify([["status", "=", "Pending"]])

  try {
    const res = await fetch(
      `${baseUrl}/api/resource/Tire%20Pickup%20Request?fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}&order_by=urgency%20asc&limit=50`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) {
      console.error("[driver/page] ERPNext responded:", res.status)
      return []
    }

    const json = await res.json()
    const rows = (json?.data ?? []) as Array<Record<string, unknown>>

    return rows.map((row) => ({
      id:          String(row.name ?? ""),
      garageName:  String(row.garage_name ?? ""),
      address:     row.address ? String(row.address) : undefined,
      lat:         row.latitude  != null ? Number(row.latitude)  : undefined,
      lng:         row.longitude != null ? Number(row.longitude) : undefined,
      urgency:     Number(row.urgency ?? 3),
      requestDate: String(row.request_date ?? ""),
      status:      String(row.status ?? "Pending"),
    }))
  } catch (err) {
    console.error("[driver/page] Failed to fetch garages:", err)
    return []
  }
}

export default async function DriverPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/portal")

  const garages = await fetchPendingGarages()

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #16191a 0%, #1a1e1f 100%)" }}
    >
      <DriverDashboard
        garages={garages}
        driverName={session.user?.name ?? "Driver"}
      />
    </main>
  )
}
