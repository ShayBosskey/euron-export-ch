"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import CollectionLogForm from "./CollectionLogForm"
import GarageCard from "./GarageCard"
import RouteButton from "./RouteButton"
import { newClientUuid, type CollectionResult } from "@/lib/collection-data"
import { toWaypoints, type PendingGarage } from "@/lib/routing"

type Notice = { tone: "success" | "warning"; text: string }

export type DriverFetchError = "unavailable" | "forbidden"

const FETCH_ERROR_TEXT: Record<DriverFetchError, { title: string; body: string }> = {
  unavailable: {
    title: "Couldn't reach the ERP system",
    body: "Pickup data is unavailable right now — this is not the same as an empty route. Try refreshing, or contact dispatch if the problem continues.",
  },
  forbidden: {
    title: "No access to the route list",
    body: "Your account is not allowed to load driver routes. Sign out and in again; if this persists, contact dispatch.",
  },
}

interface Props {
  garages: PendingGarage[]
  driverName: string
  /** null = data loaded; otherwise why the route list is missing. */
  fetchError?: DriverFetchError | null
  /** A9 — Euron Driver only (LOG_ROLES); admins see the route but log in Desk. */
  canLogCollection?: boolean
}

export default function DriverDashboard({ garages, driverName, fetchError = null, canLogCollection = false }: Props) {
  const router = useRouter()
  const [openGarageId, setOpenGarageId] = useState<string | null>(null)
  // One idempotency key per garage, replaced only after a confirmed save: closing and reopening the
  // form after a lost answer resends the same key, so a retry can never create a second log.
  const [entryKeys, setEntryKeys] = useState<Record<string, string>>({})
  // Shown above the list, not in the card: after a save the garage is re-ranked and may leave the list.
  const [notice, setNotice] = useState<Notice | null>(null)

  const keyFor = (garageId: string) => entryKeys[garageId] ?? ""

  const openForm = (garageId: string) => {
    setNotice(null)
    setEntryKeys((keys) => (keys[garageId] ? keys : { ...keys, [garageId]: newClientUuid() }))
    setOpenGarageId(garageId)
  }

  const handleSaved = (garageId: string, result: Extract<CollectionResult, { success: true }>) => {
    setOpenGarageId(null)
    setEntryKeys(({ [garageId]: _used, ...rest }) => rest)
    setNotice({ tone: result.mismatch ? "warning" : "success", text: result.message })
    // Reload the route: the ERP completed the pickup request and re-ranked the garage.
    router.refresh()
  }

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
        {notice && (
          <div
            role="status"
            className="rounded-2xl p-4 border mb-3 flex items-start justify-between gap-3"
            style={{
              background: "var(--eu-surface-dark-elevated)",
              borderColor: notice.tone === "success" ? "rgba(39,160,90,0.35)" : "rgba(232,148,58,0.45)",
            }}
          >
            <p className="text-sm" style={{ color: notice.tone === "success" ? "var(--eu-success)" : "#e8943a" }}>
              {notice.text}
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
              className="text-xs flex-shrink-0"
              style={{ color: "var(--eu-on-dark-soft)" }}
            >
              ✕
            </button>
          </div>
        )}
        {fetchError ? (
          <div
            className="rounded-2xl p-8 border text-center"
            style={{
              background: "var(--eu-surface-dark-elevated)",
              borderColor: "rgba(200,51,31,0.25)",
            }}
          >
            <div className="flex justify-center mb-3">
              <svg
                className="w-10 h-10"
                style={{ color: "var(--eu-error)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: "var(--eu-on-dark)" }}>
              {FETCH_ERROR_TEXT[fetchError].title}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--eu-muted)" }}>
              {FETCH_ERROR_TEXT[fetchError].body}
            </p>
          </div>
        ) : garages.length === 0 ? (
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
              No garages need a pickup right now.
            </p>
          </div>
        ) : (
          <div ref={listRef} className="space-y-3 pb-4">
            {garages.map((garage, i) => (
              <div key={garage.id || i} className="space-y-2">
                <GarageCard garage={garage} rank={i + 1} />
                {canLogCollection && garage.id && keyFor(garage.id) && openGarageId === garage.id ? (
                  <CollectionLogForm
                    garageId={garage.id}
                    garageName={garage.garageName}
                    clientUuid={keyFor(garage.id)}
                    onSaved={(result) => handleSaved(garage.id, result)}
                    onCancel={() => setOpenGarageId(null)}
                  />
                ) : canLogCollection && garage.id ? (
                  <button
                    type="button"
                    onClick={() => openForm(garage.id)}
                    aria-label={`Log collection at ${garage.garageName}`}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border"
                    style={{ borderColor: "rgba(39,160,90,0.35)", color: "var(--eu-recycle-green)" }}
                  >
                    Log collection
                  </button>
                ) : null}
              </div>
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
