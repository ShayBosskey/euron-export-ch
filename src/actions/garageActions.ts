"use server"

import { GARAGE_PORTAL_USER } from "@/lib/erp/roles"
import { authorizeAction } from "@/lib/guards"

export type PickupResult = {
  success: boolean
  message: string
  requestId?: string
}

// TODO(FE-01): replace the integration-key call below with erpCall("…portal.request_my_pickup").
export async function requestTirePickup(): Promise<PickupResult> {
  // FE-02: a server action is reachable by POST from any route, Proxy or not — check the role here.
  // Garage Portal User only: admins may view the dashboard (D12) but not file pickups as a garage.
  const auth = await authorizeAction([GARAGE_PORTAL_USER])
  if (!auth.ok) {
    return {
      success: false,
      message:
        auth.reason === "forbidden"
          ? "Your account cannot request pickups."
          : "Unauthorized. Please sign in again.",
    }
  }
  const { session } = auth

  if (!session.user?.email) {
    return { success: false, message: "Unauthorized. Please sign in again." }
  }

  const baseUrl = process.env.ERPNEXT_BASE_URL
  const apiKey = process.env.ERPNEXT_API_KEY
  const apiSecret = process.env.ERPNEXT_API_SECRET

  if (!baseUrl || !apiKey || !apiSecret) {
    console.error("[requestTirePickup] ERP environment variables are not configured")
    return {
      success: false,
      message: "ERP system is not configured. Contact the administrator.",
    }
  }

  try {
    const res = await fetch(`${baseUrl}/api/resource/Tire%20Pickup%20Request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
      body: JSON.stringify({
        doctype: "Tire Pickup Request",
        garage_email: session.user.email,
        garage_name: session.user.name ?? session.user.email,
        status: "Pending",
        request_date: new Date().toISOString().split("T")[0],
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      const detail =
        (errData?.exc_type as string | undefined) ??
        (errData?.message as string | undefined) ??
        `HTTP ${res.status}`
      console.error("[requestTirePickup] ERP responded:", detail)
      return { success: false, message: "Could not submit the request. Please try again." }
    }

    const data = await res.json()
    return {
      success: true,
      message: "Tire pickup request submitted successfully!",
      requestId: data?.data?.name as string | undefined,
    }
  } catch (err) {
    console.error("[requestTirePickup] Network error:", err)
    return {
      success: false,
      message: "Could not reach the ERP system. Please check your connection and try again.",
    }
  }
}
