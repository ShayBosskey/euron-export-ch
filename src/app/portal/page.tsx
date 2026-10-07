import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import LoginForm from "@/components/portal/LoginForm"
import { postLoginTarget, safeCallbackPath } from "@/lib/access"
import { authOptions } from "@/lib/auth"
import { loginNotice } from "@/lib/login-messages"

export const metadata: Metadata = {
  title: "Garage Portal | Euron Export",
  description: "Sign in to the Euron Export garage partner portal.",
  robots: { index: false, follow: false },
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; callbackUrl?: string | string[] }>
}) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  const error = first(params.error)
  const callbackUrl = first(params.callbackUrl)

  // Stay on the login page when the ERP session is gone — either flagged in the JWT, or detected by
  // the ERP itself (ERP_REAUTH_REDIRECT). Redirecting away here would loop.
  // FE-02: a signed-in user goes to the callbackUrl (if it is an app route their roles allow) or to
  // their role's home; a user without any app role stays here (no target → no loop).
  if (session && !session.error && error !== "SessionExpired") {
    const target = postLoginTarget(session.roles, callbackUrl)
    if (target) redirect(target)
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #16191a 0%, #23272a 100%)" }}
    >
      <LoginForm notice={loginNotice(error)} callbackUrl={safeCallbackPath(callbackUrl)} />
    </main>
  )
}
