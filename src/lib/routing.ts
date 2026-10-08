/** One stop on the driver's list, as passed to client components (minimal fields only). */
export interface PendingGarage {
  id: string
  garageName: string
  address?: string
  lat?: number
  lng?: number
  /** ERP urgency rank: 1 = most urgent … 5 = least urgent. */
  urgency: number
  /** The garage requested a pickup via the portal (ERP `pickup_boost_active`). */
  pickupRequested: boolean
}

export interface GarageWaypoint {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
  urgency: number
}

const MAX_TEXT = 200

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, MAX_TEXT) : undefined
}

function coordinate(value: unknown, limit: number): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : undefined
}

function rank(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  // Unknown rank → 5 (least urgent): never invent urgency the ERP did not report.
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 5
}

/**
 * FE-02 — map rows of `euron_export_erp.api.driver.get_route_list` to PendingGarage.
 * Returns `null` when the payload is not a list (treated as an ERP error, not as "no stops").
 * Rows without a usable id are dropped. Frappe Float fields default to 0, so 0/0 means "no GPS".
 */
export function fromRouteRows(payload: unknown): PendingGarage[] | null {
  if (!Array.isArray(payload)) return null
  const garages: PendingGarage[] = []
  for (const row of payload) {
    if (!row || typeof row !== "object") continue
    const r = row as Record<string, unknown>
    const id = text(r.name)
    if (!id) continue

    let lat = coordinate(r.latitude, 90)
    let lng = coordinate(r.longitude, 180)
    if (lat === undefined || lng === undefined || (lat === 0 && lng === 0)) {
      lat = undefined
      lng = undefined
    }

    const cityLine = [text(r.postal_code), text(r.city)].filter(Boolean).join(" ")
    const address = [text(r.address_line_1), text(r.address_line_2), cityLine || undefined]
      .filter(Boolean)
      .join(", ")

    garages.push({
      id,
      garageName: text(r.garage_name) ?? id,
      address: address || undefined,
      lat,
      lng,
      urgency: rank(r.urgency_rank),
      pickupRequested: r.pickup_boost_active === 1 || r.pickup_boost_active === true,
    })
  }
  return garages
}

export function toWaypoints(garages: PendingGarage[]): GarageWaypoint[] {
  return garages
    .filter(
      (g): g is PendingGarage & { lat: number; lng: number } =>
        g.lat != null && g.lng != null && !isNaN(g.lat) && !isNaN(g.lng)
    )
    .map((g) => ({
      id: g.id,
      name: g.garageName,
      lat: g.lat,
      lng: g.lng,
      address: g.address,
      urgency: g.urgency,
    }))
}

// Builds Google Maps deep-link for turn-by-turn navigation.
// Google Maps caps deep-link waypoints at 10 — excess stops are silently dropped.
export function buildGoogleMapsUrl(waypoints: GarageWaypoint[]): string {
  if (waypoints.length === 0) return "https://www.google.com/maps"

  const capped = waypoints.slice(0, 10)
  const destination = capped[capped.length - 1]
  const stops = capped.slice(0, -1)

  let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${destination.lat},${destination.lng}`
  if (stops.length > 0) {
    url += `&waypoints=${stops.map((w) => `${w.lat},${w.lng}`).join("|")}`
  }
  return url
}

// Prepared payload for Mapbox Optimization API v1
// POST https://api.mapbox.com/optimized-trips/v1/mapbox/driving/{coords}?access_token=TOKEN
export function buildMapboxOptimizationPayload(waypoints: GarageWaypoint[]) {
  return {
    coordinates: waypoints.map((w) => [w.lng, w.lat]),
    source: "first",
    destination: "last",
    roundtrip: false,
    overview: "full",
    steps: true,
  }
}

// Prepared payload for Google Cloud Fleet Routing API (OR-Tools)
// POST https://cloudoptimization.googleapis.com/v1/projects/{project}:optimizeTours
export function buildFleetRoutingPayload(
  depotLat: number,
  depotLng: number,
  stops: GarageWaypoint[]
) {
  return {
    model: {
      shipments: stops.map((stop, i) => ({
        deliveries: [
          {
            arrivalLocation: { latitude: stop.lat, longitude: stop.lng },
            label: stop.name,
          },
        ],
        label: `stop_${i}_${stop.id}`,
      })),
      vehicles: [
        {
          startLocation: { latitude: depotLat, longitude: depotLng },
          endLocation: { latitude: depotLat, longitude: depotLng },
          label: "euron_driver",
        },
      ],
    },
  }
}
