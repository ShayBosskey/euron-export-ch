import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import LoginForm from "@/components/portal/LoginForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Garage Portal | Euron Export",
  description: "Sign in to the Euron Export garage partner portal.",
  robots: { index: false, follow: false },
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const session = await getServerSession(authOptions)
  const { error } = await searchParams
  // Stay on the login page when the ERP session is gone — either flagged in the JWT, or detected by
  // the ERP itself (ERP_REAUTH_REDIRECT). Redirecting to the dashboard here would loop.
  if (session && !session.error && error !== "SessionExpired") redirect("/portal/dashboard")

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #16191a 0%, #23272a 100%)" }}
    >
      <LoginForm />
    </main>
  )
}
