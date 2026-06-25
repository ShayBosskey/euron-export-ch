"use client"

import { useRef } from "react"
import gsap from "gsap"
import {
  buildGoogleMapsUrl,
  buildMapboxOptimizationPayload,
  type GarageWaypoint,
} from "@/lib/routing"

interface Props {
  waypoints: GarageWaypoint[]
}

export default function RouteButton({ waypoints }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hasRoute = waypoints.length >= 1
  const cappedCount = Math.min(waypoints.length, 10)

  const handleOpenRoute = () => {
    if (!hasRoute) return

    gsap.fromTo(
      buttonRef.current,
      { scale: 0.96 },
      { scale: 1, duration: 0.35, ease: "back.out(2)" }
    )

    // Log prepared Mapbox payload — wire MAPBOX_API_KEY in Sprint 6 to activate
    console.info("[RouteButton] Mapbox optimization payload:", buildMapboxOptimizationPayload(waypoints))

    window.open(buildGoogleMapsUrl(waypoints), "_blank", "noopener,noreferrer")
  }

  return (
    <div className="px-4 pb-8 pt-3">
      <button
        ref={buttonRef}
        onClick={handleOpenRoute}
        disabled={!hasRoute}
        className="w-full py-4 font-bold text-base rounded-2xl flex items-center justify-center gap-3"
        style={{
          background: hasRoute ? "var(--eu-recycle-green)" : "rgba(255,255,255,0.06)",
          color: hasRoute ? "var(--eu-on-dark)" : "var(--eu-muted)",
          cursor: hasRoute ? "pointer" : "not-allowed",
        }}
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        {hasRoute
          ? `Navigate in Google Maps (${cappedCount} stop${cappedCount !== 1 ? "s" : ""})`
          : "No GPS data — route unavailable"}
      </button>
      {waypoints.length > 10 && (
        <p className="text-xs text-center mt-2" style={{ color: "var(--eu-muted)" }}>
          Top 10 stops sent to Maps. Full {waypoints.length}-stop payload ready for Mapbox / OR-Tools.
        </p>
      )}
    </div>
  )
}
