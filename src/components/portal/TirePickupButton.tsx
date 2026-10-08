"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"

import { requestTirePickup, type PickupResult } from "@/actions/garageActions"
import { ERP_REAUTH_REDIRECT } from "@/lib/erp/errors"

type Status = "idle" | "loading" | "success" | "error"

interface Props {
  garageId: string
  garageName: string
}

export default function TirePickupButton({ garageId, garageName }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<PickupResult | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const handleRequest = async () => {
    if (status === "loading") return
    setStatus("loading")
    setResult(null)

    // Press-down micro-interaction
    gsap.to(buttonRef.current, { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 })

    let data: PickupResult
    try {
      data = await requestTirePickup(garageId)
    } catch {
      // Network failure or server action unreachable (e.g. after a deploy).
      data = { success: false, message: "Could not reach the server. Please check your connection and try again." }
    }

    if (!data.success && data.reauth) {
      window.location.assign(ERP_REAUTH_REDIRECT)
      return
    }

    setResult(data)
    if (data.success) {
      setStatus("success")
      gsap.fromTo(buttonRef.current, { scale: 0.97 }, { scale: 1, duration: 0.35, ease: "back.out(2)" })
      // Re-render the server component so the garage card shows the active request.
      router.refresh()
    } else {
      setStatus("error")
      gsap.fromTo(buttonRef.current, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" })
    }
  }

  const bgColor =
    status === "success" ? "var(--eu-success)" : status === "error" ? "var(--eu-error)" : "var(--eu-recycle-green)"
  const isLoading = status === "loading"

  return (
    <div className="space-y-3">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleRequest}
        disabled={isLoading || status === "success"}
        aria-label={`Request tire pickup for ${garageName}`}
        className="inline-flex items-center gap-2.5 px-6 py-3.5 font-semibold rounded-xl text-sm transition-opacity"
        style={{
          background: isLoading ? "rgba(15,122,63,0.5)" : bgColor,
          color: "var(--eu-on-dark)",
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading && (
          <span
            aria-hidden="true"
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}
          />
        )}
        {status === "idle" && (
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        )}
        {status === "success" && (
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === "error" && (
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {isLoading
          ? "Submitting request…"
          : status === "success"
            ? "Pickup requested"
            : status === "error"
              ? "Try again"
              : "Request Tire Pickup"}
      </button>

      {result && (
        <p
          role="status"
          className="text-sm"
          style={{ color: result.success ? "var(--eu-success)" : "var(--eu-error)" }}
        >
          {result.message}
        </p>
      )}
    </div>
  )
}
