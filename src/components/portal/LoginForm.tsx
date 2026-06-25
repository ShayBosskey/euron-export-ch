"use client"

import { useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

export default function LoginForm() {
  const rootRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useGSAP(
    () => {
      gsap.from(rootRef.current, {
        opacity: 0,
        y: 48,
        duration: 0.7,
        ease: "power3.out",
      })
      gsap.from(logoRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        delay: 0.35,
        ease: "back.out(1.7)",
      })
    },
    { scope: rootRef }
  )

  const shakeCard = () => {
    gsap.fromTo(
      cardRef.current,
      { x: -10 },
      { x: 0, duration: 0.45, ease: "elastic.out(1, 0.4)" }
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid email or password. Please try again.")
      shakeCard()
    } else {
      router.push("/portal/dashboard")
      router.refresh()
    }
  }

  return (
    <div ref={rootRef} className="w-full max-w-md">
      <div
        ref={cardRef}
        className="rounded-2xl p-8 shadow-2xl border"
        style={{
          background: "var(--eu-surface-dark-elevated)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo / Branding */}
        <div ref={logoRef} className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "var(--eu-recycle-green)" }}
          >
            {/* Tire / pickup icon */}
            <svg
              className="w-7 h-7"
              style={{ color: "var(--eu-on-dark)" }}
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
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--eu-on-dark)" }}
          >
            Garage Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--eu-on-dark-soft)" }}>
            Euron Export Partner Access
          </p>
        </div>

        {/* Cargo stripe accent */}
        <div className="eu-cargo-stripe rounded-full mb-6" />

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 rounded-xl text-sm border"
            style={{
              background: "rgba(200,51,31,0.1)",
              borderColor: "rgba(200,51,31,0.3)",
              color: "var(--eu-error)",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="portal-email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--eu-on-dark-soft)" }}
            >
              Email address
            </label>
            <input
              id="portal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="garage@example.com"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--eu-on-dark)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--eu-recycle-green)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
              }}
            />
          </div>

          <div>
            <label
              htmlFor="portal-password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--eu-on-dark-soft)" }}
            >
              Password
            </label>
            <input
              id="portal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--eu-on-dark)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--eu-recycle-green)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-semibold rounded-xl flex items-center justify-center gap-2 mt-2 text-sm transition-opacity"
            style={{
              background: loading
                ? "rgba(15,122,63,0.5)"
                : "var(--eu-recycle-green)",
              color: "var(--eu-on-dark)",
            }}
          >
            {loading ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                  }}
                />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--eu-muted)" }}
        >
          Access restricted to registered Euron Export partners only.
        </p>
      </div>
    </div>
  )
}
