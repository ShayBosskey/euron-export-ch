import type { ReactNode } from "react"
import AuthProvider from "@/components/portal/AuthProvider"

export default function DriverLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
