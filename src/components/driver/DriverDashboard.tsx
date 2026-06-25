"use client"

import { useRef } from "react"
import { signOut } from "next-auth/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import GarageCard from "./GarageCard"
import RouteButton from "./RouteButton"
import { toWaypoints, type PendingGarage } from "@/lib/routing"

interface Props {
  garages: PendingGarage[]
  driverName: string
}

export default function DriverDashboard({ garages, driverName }: Props) {
  const rootRef    = useRef<HTMLDivElement>(null)
  const headerRef  = useRef<HTMLElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const listRef    = useRef<HTMLDivElement>(null)

  const waypoints = toWaypoints(garages)
  const criticalCount = garages.filter((g) => g.urgency === 1).length

  useGSAP(
    () => {
      const tl = gsap.timeline()

      tl.from(headerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power3.out",
      })
        .from(
          summaryRef.current,
          { opacity: 0, y: 16, duration: 0.45, ease: "power2.out" },
          "-=0.2"
        )
        .from(
          Array.from(listRef.current?.children ?? []),
          { opacity: 0, y: 24, stagger: 0.08, duration: 0.4, ease: "power2.out" },
          "-=0.15"
        )
    },
    { scope: rootRef }
  )

  return (
    <div ref={rootRef} className="max-w-md mx-auto min-h-screen flex flex-col">

      {/* Sticky top nav */}
      <header
        ref={headerRef}
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b"
        style={{
          background: "rgba(22,25,26,0.92)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div>
          <p className="text-xs" style={{ color: "var(--eu-muted)" }}>Driver Dashboard</p>
          <p className="text-sm font-semibold" style={{ color: "var(--eu-on-dark)" }}>
            {driverName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="eu-cargo-stripe rounded-full"
            style={{ width: 32, height: 4 }}
          />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/portal" })}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "var(--eu-on-dark-soft)" }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Route summary card */}
      <div ref={summaryRef} className="px-4 pt-5 pb-4">
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: "var(--eu-surface-dark-elevated)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-xs font-medium tracking-wide mb-3" style={{ color: "var(--eu-muted)" }}>
            TODAY'S ROUTE
          </p>
          <div className="grid grid-cols-3 divide-x divide-white/10">
            <div className="pr-3">
              <p className="text-2xl font-bold" style={{ color: "var(--eu-on-dark)" }}>
                {garages.length}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--eu-on-dark-soft)" }}>
                Total stops
              </p>
            </div>
            <div className="px-3">
              <p className="text-2xl font-bold" style={{ color: "var(--eu-error)" }}>
                {criticalCount}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--eu-on-dark-soft)" }}>
                Critical
              </p>
            </div>
            <div className="pl-3">
              <p className="text-2xl font-bold" style={{ color: "var(--eu-recycle-green)" }}>
                {waypoints.length}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--eu-on-dark-soft)" }}>
                GPS-ready
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Garage list */}
      <div className="flex-1 px-4">
        {garages.length === 0 ? (
          <div
            className="rounded-2xl p-8 border text-center"
            style={{
              background: "var(--eu-surface-dark-elevated)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex justify-center mb-3">
              <svg
                className="w-10 h-10"
                style={{ color: "var(--eu-success)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: "var(--eu-on-dark)" }}>
              All clear
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--eu-muted)" }}>
              No pending pickups today.
            </p>
          </div>
        ) : (
          <div ref={listRef} className="space-y-3 pb-4">
            {garages.map((garage, i) => (
              <GarageCard key={garage.id || i} garage={garage} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div
        className="sticky bottom-0"
        style={{
          background: "linear-gradient(to top, #16191a 65%, transparent)",
        }}
      >
        <RouteButton waypoints={waypoints} />
      </div>
    </div>
  )
}
