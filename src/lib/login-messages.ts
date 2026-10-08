/**
 * FE-02 — user-facing text for login outcomes. Only fixed strings are shown: the error code from
 * NextAuth or the URL is a lookup key, never echoed (no reflected content on the login page).
 */
import { AUTH_ERROR_CODES } from "./auth-errors"

const MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password. Please try again.",
  [AUTH_ERROR_CODES.noAppRole]:
    "This account has no access to the Euron Export portal. Please contact Euron Export.",
  [AUTH_ERROR_CODES.rateLimited]: "Too many sign-in attempts. Please wait a few minutes and try again.",
  [AUTH_ERROR_CODES.erpUnavailable]:
    "Sign-in is temporarily unavailable. Please try again in a few minutes.",
  SessionExpired: "Your session has expired. Please sign in again.",
}

const FALLBACK = "Sign-in failed. Please try again."

/** Message for a failed `signIn()` result. */
export function loginErrorMessage(code: unknown): string {
  return typeof code === "string" && Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : FALLBACK
}

/** Notice for `/portal?error=…` (redirects from guards / NextAuth). Unknown codes show nothing. */
export function loginNotice(code: unknown): string | null {
  return typeof code === "string" && Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : null
}
