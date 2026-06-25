import type { ReactNode } from "react"
import AuthProvider from "@/components/portal/AuthProvider"

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
