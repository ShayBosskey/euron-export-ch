"use client"

import { useEffect } from "react"

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[portal/error]", error)
  }, [error])

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #16191a 0%, #23272a 100%)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 border text-center"
        style={{
          background: "var(--eu-surface-dark-elevated)",
          borderColor: "rgba(200,51,31,0.25)",
        }}
      >
        <p className="font-semibold" style={{ color: "var(--eu-on-dark)" }}>
          Something went wrong
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--eu-muted)" }}>
          The garage portal couldn&apos;t load. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--eu-recycle-green)", color: "var(--eu-on-dark)" }}
        >
          Try again
        </button>
      </div>
    </main>
  )
}
