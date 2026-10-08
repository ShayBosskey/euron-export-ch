/**
 * Error codes surfaced to the login form (`signIn(...).error`). Wrong credentials → NextAuth's own
 * "CredentialsSignin". Codes carry no detail an attacker could use.
 *
 * Kept outside `auth.ts` (server-only) so the client login form can map them to messages.
 */
export const AUTH_ERROR_CODES = {
  noAppRole: "NoAppRole",
  rateLimited: "RateLimited",
  erpUnavailable: "ErpUnavailable",
} as const
