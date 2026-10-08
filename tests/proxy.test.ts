import assert from "node:assert/strict"
import { before, describe, it } from "node:test"

import type { JWT } from "next-auth/jwt"
import { encode } from "next-auth/jwt"
import { NextRequest, type NextFetchEvent } from "next/server"

import { EURON_ADMIN, EURON_DRIVER, GARAGE_PORTAL_USER, type AppRole } from "../src/lib/erp/roles"
import { CSRF, SID } from "./helpers"

const SECRET = "test-secret-for-proxy-tests-0123456789abcdef"
const ORIGIN = "http://localhost:3000"
const COOKIE = "next-auth.session-token" // non-secure cookie name (http origin)

type ProxyFn = (req: NextRequest, event: NextFetchEvent) => Promise<Response | undefined>
let proxy: ProxyFn

before(async () => {
  process.env.NEXTAUTH_SECRET = SECRET
  process.env.NEXTAUTH_URL = ORIGIN
  proxy = (await import("../src/proxy")).default as unknown as ProxyFn
})

async function tokenCookie(overrides: Omit<Partial<JWT>, "roles"> & { roles?: unknown }): Promise<string> {
  const token = {
    sub: "user@example.ch",
    id: "user@example.ch",
    name: "Test",
    email: "user@example.ch",
    roles: [EURON_DRIVER],
    erp: { sid: SID, csrfToken: CSRF, expiresAt: Date.now() + 60 * 60_000 },
    ...overrides,
  } as JWT
  return encode({ token, secret: SECRET })
}

async function run(path: string, cookie?: string) {
  const req = new NextRequest(new URL(path, ORIGIN), {
    headers: cookie ? { cookie: `${COOKIE}=${cookie}` } : {},
  })
  const res = await proxy(req, {} as NextFetchEvent)
  const location = res?.headers.get("location") ?? null
  return { status: res?.status ?? 200, location: location ? new URL(location).pathname + new URL(location).search : null }
}

function asRoles(...roles: AppRole[]) {
  return { roles }
}

describe("proxy.ts (FE-02 optimistic gate)", () => {
  it("no cookie → login with callbackUrl", async () => {
    const r = await run("/driver")
    assert.equal(r.status, 307)
    assert.equal(r.location, "/portal?callbackUrl=%2Fdriver")
  })

  it("tampered / foreign-secret cookie → login", async () => {
    const forged = await encode({ token: { roles: [EURON_ADMIN] } as JWT, secret: "another-secret-entirely-xyz" })
    assert.equal((await run("/driver", forged)).location, "/portal?callbackUrl=%2Fdriver")
    assert.equal((await run("/driver", "not-a-jwe")).location, "/portal?callbackUrl=%2Fdriver")
  })

  it("expired ERP credentials or no app role → login with SessionExpired notice", async () => {
    const expired = await tokenCookie({ erp: { sid: SID, csrfToken: CSRF, expiresAt: Date.now() - 1 } })
    assert.equal((await run("/driver?x=1", expired)).location, "/portal?error=SessionExpired&callbackUrl=%2Fdriver%3Fx%3D1")
    const flagged = await tokenCookie({ error: "ErpSessionExpired" })
    assert.equal((await run("/driver", flagged)).location, "/portal?error=SessionExpired&callbackUrl=%2Fdriver")
    const noRole = await tokenCookie({ roles: [] })
    assert.equal(
      (await run("/portal/dashboard", noRole)).location,
      "/portal?error=SessionExpired&callbackUrl=%2Fportal%2Fdashboard"
    )
  })

  it("garage user on /driver → own dashboard (no competitor data)", async () => {
    const garage = await tokenCookie(asRoles(GARAGE_PORTAL_USER))
    assert.deepEqual(await run("/driver", garage), { status: 307, location: "/portal/dashboard" })
    assert.deepEqual(await run("/driver/anything", garage), { status: 307, location: "/portal/dashboard" })
  })

  it("driver on /portal/dashboard → /driver", async () => {
    const driver = await tokenCookie(asRoles(EURON_DRIVER))
    assert.deepEqual(await run("/portal/dashboard", driver), { status: 307, location: "/driver" })
  })

  it("allowed roles pass through", async () => {
    const driver = await tokenCookie(asRoles(EURON_DRIVER))
    const garage = await tokenCookie(asRoles(GARAGE_PORTAL_USER))
    const admin = await tokenCookie(asRoles(EURON_ADMIN))
    assert.equal((await run("/driver", driver)).location, null)
    assert.equal((await run("/portal/dashboard", garage)).location, null)
    assert.equal((await run("/driver", admin)).location, null)
    assert.equal((await run("/portal/dashboard", admin)).location, null)
  })

  it("unknown role strings in a token do not count as app roles", async () => {
    const weird = await tokenCookie({ roles: ["euron driver", "System Manager"] })
    const r = await run("/driver", weird)
    assert.equal(r.status, 307)
    assert.match(r.location ?? "", /^\/portal\?error=SessionExpired/)
  })
})
