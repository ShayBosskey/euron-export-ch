"use client"

import { useRef } from "react"
import { signOut } from "next-auth/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import TirePickupButton from "./TirePickupButton"
import { formatSwissDate, type PortalGarage } from "@/lib/portal-data"

interface Props {
  userName: string
  userEmail: string
  /** The user's own garages (ERP `portal.get_my_garages`); empty on error or for admins. */
  garages: PortalGarage[]
  /** The garage list could not be loaded — show a fallback, never "no garages". */
  loadError: boolean
  /** Only Garage Portal Users file pickups (admins view the dashboard read-only, A9). */
  canRequestPickup: boolean
}

const cardStyle = {
  background: "var(--eu-surface-dark-elevated)",
  borderColor: "rgba(255,255,255,0.07)",
}

export default function DashboardClient({ userName, userEmail, garages, loadError, canRequestPickup }: Props) {
  const activePickups = garages.filter((g) => g.pickup).length
  const stats = [
    { label: "Your garages", value: loadError ? "—" : String(garages.length) },
    { label: "Active pickup requests", value: loadError ? "—" : String(activePickups) },
  ]

  const rootRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline()

      tl.from(headerRef.current, {
        opacity: 0,
        y: -24,
        duration: 0.6,
        ease: "power3.out",
      })
        .from(
          Array.from(cardsRef.current?.children ?? []),
          {
            opacity: 0,
            y: 32,
            stagger: 0.1,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.3"
        )
        .from(
          ctaRef.current,
          {
            opacity: 0,
            scale: 0.96,
            duration: 0.45,
            ease: "back.out(1.5)",
          },
          "-=0.2"
        )
    },
    { scope: rootRef }
  )

  return (
    <div ref={rootRef} className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Cargo stripe header accent */}
      <div className="eu-cargo-stripe rounded-full mb-8" />

      {/* Page header */}
      <header
        ref={headerRef}
        className="flex items-start justify-between mb-10"
      >
        <div>
          <p className="text-sm" style={{ color: "var(--eu-on-dark-soft)" }}>
            Welcome back,
          </p>
          <h1
            className="text-2xl font-bold mt-0.5"
            style={{ color: "var(--eu-on-dark)" }}
          >
            {userName}
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--eu-muted)" }}>
            {userEmail}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
            style={{
              background: "var(--eu-recycle-green)",
              color: "var(--eu-on-dark)",
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/portal" })}
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--eu-on-dark-soft)" }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Stat cards (live from the ERP) */}
      <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((card) => (
          <div key={card.label} className="rounded-xl p-5 border" style={cardStyle}>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--eu-on-dark)" }}>
              {card.value}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--eu-on-dark-soft)" }}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tire pickup — one card per garage of this user */}
      <section ref={ctaRef} aria-labelledby="pickup-heading" className="space-y-4">
        <h2 id="pickup-heading" className="text-lg font-bold" style={{ color: "var(--eu-on-dark)" }}>
          Request Tire Pickup
        </h2>

        {loadError ? (
          <div role="alert" className="rounded-2xl p-6 border" style={{ ...cardStyle, borderColor: "rgba(200,51,31,0.25)" }}>
            <p className="font-semibold" style={{ color: "var(--eu-on-dark)" }}>
              Your garages couldn&apos;t be loaded
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--eu-muted)" }}>
              The ERP system is not reachable right now. Please refresh in a few minutes.
            </p>
          </div>
        ) : garages.length === 0 ? (
          <div className="rounded-2xl p-6 border" style={cardStyle}>
            <p className="font-semibold" style={{ color: "var(--eu-on-dark)" }}>
              No active garage is linked to this account
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--eu-muted)" }}>
              {canRequestPickup
                ? "Please contact Euron Export so we can link your garage."
                : "Pickups are requested by garage accounts."}
            </p>
          </div>
        ) : (
          garages.map((garage) => {
            const until = formatSwissDate(garage.pickup?.validUntil ?? null)
            const location = [garage.postalCode, garage.city].filter(Boolean).join(" ")
            return (
              <article key={garage.id} className="rounded-2xl p-6 border" style={cardStyle}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold" style={{ color: "var(--eu-on-dark)" }}>
                      {garage.name}
                    </h3>
                    {location && (
                      <p className="text-sm" style={{ color: "var(--eu-muted)" }}>
                        {location}
                      </p>
                    )}
                    <p className="text-sm mt-2" style={{ color: "var(--eu-on-dark-soft)" }}>
                      {garage.pickup
                        ? `Pickup requested${until ? ` — valid until ${until}` : ""}. Our team will schedule the collection.`
                        : "No pickup requested."}
                    </p>
                  </div>
                  {canRequestPickup && !garage.pickup && (
                    <TirePickupButton garageId={garage.id} garageName={garage.name} />
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
