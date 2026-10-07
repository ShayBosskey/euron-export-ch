import type { DefaultSession } from "next-auth"
import type { AppRole } from "@/lib/erp/roles"

/** Server-only ERP credentials. Stored in the encrypted JWT, never in the Session. */
type ErpTokenCredentials = {
  sid: string
  csrfToken: string
  /** Epoch ms. */
  expiresAt: number
}

declare module "next-auth" {
  interface User {
    roles: AppRole[]
    erp: ErpTokenCredentials
  }

  /** What client JavaScript can read via /api/auth/session — keep it minimal. */
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
    roles: AppRole[]
    error?: "ErpSessionExpired"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    roles?: AppRole[]
    erp?: ErpTokenCredentials
    error?: "ErpSessionExpired"
  }
}
