export interface PendingGarage {
  id: string
  garageName: string
  address?: string
  lat?: number
  lng?: number
  urgency: number
  requestDate: string
  status: string
}

export interface GarageWaypoint {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
  urgency: number
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
