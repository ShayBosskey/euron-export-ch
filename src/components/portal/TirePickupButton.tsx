"use client"

import { useRef, useState } from "react"
import gsap from "gsap"
import { requestTirePickup, type PickupResult } from "@/actions/garageActions"

type Status = "idle" | "loading" | "success" | "error"

export default function TirePickupButton() {
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<PickupResult | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleRequest = async () => {
    if (status === "loading") return
    setStatus("loading")
    setResult(null)

    // Press-down micro-interaction
    gsap.to(buttonRef.current, {
      scale: 0.97,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
    })

    const data = await requestTirePickup()
    setResult(data)

    if (data.success) {
      setStatus("success")
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.97 },
        { scale: 1, duration: 0.35, ease: "back.out(2)" }
      )
    } else {
      setStatus("error")
      // Elastic shake on failure
      gsap.fromTo(
        buttonRef.current,
        { x: -10 },
        { x: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }
      )
    }
  }

  const handleReset = () => {
    setStatus("idle")
    setResult(null)
  }

  const bgColor =
    status === "success"
      ? "var(--eu-success)"
      : status === "error"
      ? "var(--eu-error)"
      : "var(--eu-recycle-green)"

  const isDisabled = status === "loading"
  const isResettable = status === "success" || status === "error"

  return (
    <div className="space-y-3">
      <button
        ref={buttonRef}
        onClick={isResettable ? handleReset : handleRequest}
        disabled={isDisabled}
        className="inline-flex items-center gap-2.5 px-6 py-3.5 font-semibold rounded-xl text-sm transition-opacity"
        style={{
          background: isDisabled ? "rgba(15,122,63,0.5)" : bgColor,
          color: "var(--eu-on-dark)",
          opacity: isDisabled ? 0.6 : 1,
        }}
      >
        {/* Spinner */}
        {status === "loading" && (
          <span
            aria-hidden="true"
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{
              borderColor: "rgba(255,255,255,0.3)",
              borderTopColor: "white",
            }}
          />
        )}

        {/* Idle truck icon */}
        {status === "idle" && (
          <svg
            className="w-4 h-4"
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
        )}

        {/* Success checkmark */}
        {status === "success" && (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}

        {/* Error X */}
        {status === "error" && (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}

        {status === "loading"
          ? "Submitting Request…"
          : status === "success"
          ? "Request Sent — Submit Another?"
          : status === "error"
          ? "Failed — Click to Retry"
          : "Request Tire Pickup"}
      </button>

      {result && (
        <p
          role="status"
          className="text-sm"
          style={{ color: result.success ? "var(--eu-success)" : "var(--eu-error)" }}
        >
          {result.message}
          {result.requestId && (
            <span style={{ color: "var(--eu-muted)" }} className="ml-1.5">
              (ID: {result.requestId})
            </span>
          )}
        </p>
      )}
    </div>
  )
}
