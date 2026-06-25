"use client"

import { useRef } from "react"
import { signOut } from "next-auth/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import TirePickupButton from "./TirePickupButton"

interface Props {
  userName: string
  userEmail: string
}

const STAT_CARDS = [
  { label: "Pending Pickups", note: "Live data — Sprint 5" },
  { label: "Completed", note: "Live data — Sprint 5" },
  { label: "Total Requests", note: "Live data — Sprint 5" },
]

export default function DashboardClient({ userName, userEmail }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

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

      {/* Stat cards */}
      <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5 border"
            style={{
              background: "var(--eu-surface-dark-elevated)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--eu-on-dark)" }}
            >
              —
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--eu-on-dark-soft)" }}>
              {card.label}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--eu-muted)" }}>
              {card.note}
            </p>
          </div>
        ))}
      </div>

      {/* Tire Pickup CTA */}
      <div
        ref={ctaRef}
        className="rounded-2xl p-8 border"
        style={{
          background: "var(--eu-surface-dark-elevated)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-start gap-5">
          {/* Icon badge */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(15,122,63,0.12)",
              border: "1px solid rgba(15,122,63,0.25)",
            }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: "var(--eu-recycle-green)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: "var(--eu-on-dark)" }}
            >
              Request Tire Pickup
            </h2>
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: "var(--eu-on-dark-soft)" }}
            >
              Schedule a collection of used tires from your garage. Our logistics team will
              confirm a pickup window within 24 business hours.
            </p>
            <TirePickupButton />
          </div>
        </div>
      </div>
    </div>
  )
}
