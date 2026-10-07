import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"

import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

import { authOptions, AUTH_ERROR } from "../src/lib/auth"
import { buildJwt, computeErpExpiry, isTokenUsable, SESSION_MAX_AGE_SECONDS, toClientSession } from "../src/lib/auth-token"
import { ErpError } from "../src/lib/erp/errors"
import { erpLogin, toAppRoles } from "../src/lib/erp/login"
import { BASE, CSRF, SID, captureLogs, frappeError, json, scriptFetch, setEnv } from "./helpers"

const NOW = Date.parse("2026-10-07T10:00:00Z")
const CONTEXT = "euron_export_erp.api.session.get_session_context"

function loginOk(message = "Logged In") {
  return json({ message, full_name: "Hans Muster" }, 200, {
    "Set-Cookie": [`sid=${SID}; Max-Age=604800; HttpOnly; Path=/; SameSite=Lax`, "system_user=yes; Path=/"],
  })
}
function contextOk(roles: unknown = ["Euron Driver"], extra: Record<string, unknown> = {}) {
  return json({ message: { user: "hans@garage.ch", full_name: "Hans Muster", roles, garages: [], csrf_token: CSRF, ...extra } })
}

describe("erpLogin (FE-03a)", () => {
  let logs: ReturnType<typeof captureLogs>
  let restoreFetch: (() => void) | undefined
  beforeEach(() => {
    setEnv()
    logs = captureLogs()
  })
  afterEach(() => {
    restoreFetch?.()
    restoreFetch = undefined
    logs.restore()
  })

  it("logs in, reads sid from Set-Cookie, loads roles + CSRF with that sid", async () => {
    const f = scriptFetch(loginOk(), contextOk(["Euron Driver", "System Manager", "Garage Portal User"]))
    restoreFetch = f.restore
    const result = await erpLogin("  hans@garage.ch ", "pw")
    assert.ok(result)
    assert.equal(result.sid, SID)
    assert.equal(result.csrfToken, CSRF)
    assert.equal(result.user, "hans@garage.ch")
    assert.equal(result.fullName, "Hans Muster")
    assert.deepEqual(result.roles, ["Euron Driver", "Garage Portal User"]) // unknown roles dropped
    assert.ok(result.sidExpiresAt && result.sidExpiresAt > Date.now())

    const [login, ctx] = f.calls
    assert.equal(login.url, `${BASE}/api/method/login`)
    assert.equal(login.init.method, "POST")
    assert.deepEqual(JSON.parse(String(login.init.body)), { usr: "hans@garage.ch", pwd: "pw" })
    assert.equal(ctx.url, `${BASE}/api/method/${CONTEXT}`)
    assert.equal(ctx.init.method, "GET")
    assert.equal(ctx.init.headers.Cookie, `sid=${SID}`)
  })

  it('accepts Frappe\'s "No App" answer for website users (garage portal)', async () => {
    restoreFetch = scriptFetch(loginOk("No App"), contextOk(["Garage Portal User"])).restore
    const result = await erpLogin("garage@x.ch", "pw")
    assert.deepEqual(result?.roles, ["Garage Portal User"])
  })

  it("wrong credentials (401) and disabled user (403) → null, no second request", async () => {
    for (const res of [frappeError(401, "AuthenticationError", "Invalid Login Credentials"), frappeError(403, "PermissionError")]) {
      const f = scriptFetch(res)
      assert.equal(await erpLogin("a@b.ch", "bad"), null)
      assert.equal(f.calls.length, 1)
      f.restore()
    }
  })

  it("rejects bad input without calling the ERP", async () => {
    const f = scriptFetch()
    restoreFetch = f.restore
    for (const [u, p] of [[undefined, "x"], ["a@b.ch", ""], ["", "x"], ["a".repeat(255), "x"], ["a@b.ch", "x".repeat(513)], [{}, "x"]] as const) {
      assert.equal(await erpLogin(u, p), null)
    }
    assert.equal(f.calls.length, 0)
  })

  it("valid user without an app role → no_app_role, and the fresh ERP session is logged out", async () => {
    const f = scriptFetch(loginOk(), contextOk(["System User"]), json({ message: "ok" }))
    restoreFetch = f.restore
    await assert.rejects(erpLogin("intern@euron.ch", "pw"), (e: unknown) => e instanceof ErpError && e.kind === "no_app_role")
    const logout = f.calls[2]
    assert.equal(logout.url, `${BASE}/api/method/logout`)
    assert.equal(logout.init.method, "POST")
    assert.equal(logout.init.headers.Cookie, `sid=${SID}`)
    assert.equal(logout.init.headers["X-Frappe-CSRF-Token"], CSRF)
  })

  it("200 without a sid cookie, or a context without CSRF → bad_response", async () => {
    let f = scriptFetch(json({ message: "Logged In" }))
    await assert.rejects(erpLogin("a@b.ch", "pw"), (e: unknown) => e instanceof ErpError && e.kind === "bad_response")
    f.restore()

    f = scriptFetch(loginOk(), contextOk(["Euron Driver"], { csrf_token: "" }), json({ message: "ok" }))
    await assert.rejects(erpLogin("a@b.ch", "pw"), (e: unknown) => e instanceof ErpError && e.kind === "bad_response")
    f.restore()
  })

  it("rate limit and ERP outage surface as typed errors", async () => {
    let f = scriptFetch(frappeError(429, "RateLimitExceededError"))
    await assert.rejects(erpLogin("a@b.ch", "pw"), (e: unknown) => e instanceof ErpError && e.kind === "rate_limited")
    f.restore()
    f = scriptFetch(new TypeError("fetch failed"))
    await assert.rejects(erpLogin("a@b.ch", "pw"), (e: unknown) => e instanceof ErpError && e.kind === "network")
    f.restore()
  })

  it("toAppRoles keeps only known roles, de-duplicated and sorted", () => {
    assert.deepEqual(toAppRoles(["Garage Portal User", "Euron Admin", "Euron Admin", 3, "Administrator"]), ["Euron Admin", "Garage Portal User"])
    assert.deepEqual(toAppRoles("Euron Admin"), [])
  })
})

describe("NextAuth bridge (FE-03b)", () => {
  let logs: ReturnType<typeof captureLogs>
  let restoreFetch: (() => void) | undefined
  beforeEach(() => {
    setEnv()
    logs = captureLogs()
  })
  afterEach(() => {
    restoreFetch?.()
    restoreFetch = undefined
    logs.restore()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authorize = (authOptions.providers[0] as any).options.authorize as (c: Record<string, string>) => Promise<unknown>

  it("authorize returns the user with roles + ERP credentials", async () => {
    restoreFetch = scriptFetch(loginOk(), contextOk(["Euron Admin"])).restore
    const user = (await authorize({ email: "hans@garage.ch", password: "pw" })) as Record<string, any>
    assert.equal(user.id, "hans@garage.ch")
    assert.deepEqual(user.roles, ["Euron Admin"])
    assert.equal(user.erp.sid, SID)
    assert.equal(user.erp.csrfToken, CSRF)
    assert.ok(user.erp.expiresAt <= Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
  })

  it("authorize: wrong password → null; no role / rate limit / outage → coded errors", async () => {
    let f = scriptFetch(frappeError(401, "AuthenticationError"))
    assert.equal(await authorize({ email: "a@b.ch", password: "bad" }), null)
    f.restore()
    const cases: Array<[Response[], string]> = [
      [[loginOk(), contextOk([]), json({ message: "ok" })], AUTH_ERROR.noAppRole],
      [[frappeError(429, "RateLimitExceededError")], AUTH_ERROR.rateLimited],
      [[frappeError(502, "BadGateway")], AUTH_ERROR.erpUnavailable],
    ]
    for (const [responses, code] of cases) {
      f = scriptFetch(...responses)
      await assert.rejects(authorize({ email: "a@b.ch", password: "pw" }), (e: unknown) => e instanceof Error && e.message === code)
      f.restore()
    }
  })

  it("authorize refuses a Frappe session that would expire within minutes (and logs it out)", async () => {
    const shortLived = json({ message: "Logged In" }, 200, { "Set-Cookie": `sid=${SID}; Max-Age=120; Path=/` })
    const f = scriptFetch(shortLived, contextOk(["Euron Driver"]), json({ message: "ok" }))
    restoreFetch = f.restore
    await assert.rejects(authorize({ email: "a@b.ch", password: "pw" }), (e: unknown) => e instanceof Error && e.message === AUTH_ERROR.erpUnavailable)
    assert.equal(f.calls[2].url, `${BASE}/api/method/logout`)
  })

  it("computeErpExpiry never exceeds the Frappe cookie nor the NextAuth max age", () => {
    assert.equal(computeErpExpiry(NOW + 10 * 60_000, NOW), NOW + 9 * 60_000)
    assert.equal(computeErpExpiry(null, NOW), NOW + SESSION_MAX_AGE_SECONDS * 1000 - 60_000)
    assert.equal(computeErpExpiry(NOW + 30 * 24 * 3600_000, NOW), NOW + SESSION_MAX_AGE_SECONDS * 1000 - 60_000)
  })

  const user = {
    id: "hans@garage.ch",
    email: "hans@garage.ch",
    name: "Hans Muster",
    roles: ["Euron Driver" as const],
    erp: { sid: SID, csrfToken: CSRF, expiresAt: NOW + 3600_000 },
  }

  it("jwt keeps sid/CSRF; the browser-visible session never contains them", () => {
    const token = buildJwt({ token: { name: "x" } as JWT, user }, NOW)
    assert.equal(token.erp?.sid, SID)
    const session = toClientSession({ session: { expires: "2026-10-07T18:00:00Z" } as Session, token })
    const serialized = JSON.stringify(session)
    assert.ok(!serialized.includes(SID), "sid leaked into session")
    assert.ok(!serialized.includes(CSRF), "csrf leaked into session")
    assert.deepEqual(session, {
      expires: "2026-10-07T18:00:00Z",
      user: { id: "hans@garage.ch", name: "Hans Muster", email: "hans@garage.ch" },
      roles: ["Euron Driver"],
    })
  })

  it("expired ERP credentials are dropped and flagged; middleware then refuses the token", () => {
    const fresh = buildJwt({ token: {} as JWT, user }, NOW)
    assert.equal(isTokenUsable(fresh, NOW), true)
    const later = buildJwt({ token: fresh }, NOW + 3600_000)
    assert.equal(later.erp, undefined)
    assert.equal(later.error, "ErpSessionExpired")
    assert.equal(isTokenUsable(later, NOW + 3600_000), false)
    const session = toClientSession({ session: { expires: "x" } as Session, token: later })
    assert.equal(session.error, "ErpSessionExpired")
  })

  it("non-finite expiry is treated as expired by BOTH jwt and middleware (no redirect loop)", () => {
    const broken = { id: "x", roles: ["Euron Driver"], erp: { ...user.erp, expiresAt: Number.NaN } } as JWT
    assert.equal(isTokenUsable(broken, NOW), false)
    assert.equal(buildJwt({ token: broken }, NOW).error, "ErpSessionExpired")
  })

  it("tokens from before this change (no erp, no roles) are not usable", () => {
    const legacy = buildJwt({ token: { id: "old@x.ch", email: "old@x.ch" } as JWT }, NOW)
    assert.equal(legacy.error, "ErpSessionExpired")
    assert.equal(isTokenUsable({ id: "x", erp: user.erp, roles: [] } as JWT, NOW), false)
    assert.equal(isTokenUsable(null, NOW), false)
  })

  it("signOut event POSTs /api/method/logout with sid + CSRF and swallows ERP errors", async () => {
    let f = scriptFetch(json({ message: "ok" }))
    await authOptions.events!.signOut!({ token: { erp: user.erp } as JWT, session: undefined as never })
    assert.equal(f.calls[0].url, `${BASE}/api/method/logout`)
    assert.equal(f.calls[0].init.headers["X-Frappe-CSRF-Token"], CSRF)
    f.restore()

    f = scriptFetch(new TypeError("fetch failed"))
    await authOptions.events!.signOut!({ token: { erp: user.erp } as JWT, session: undefined as never })
    f.restore()
    assert.ok(!logs.lines.join("\n").includes(SID))
  })
})
