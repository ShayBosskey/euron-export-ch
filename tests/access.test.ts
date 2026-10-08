import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server"

import {
  canAccess,
  DRIVER_HOME,
  homeFor,
  LOGIN_PATH,
  normalizeRoles,
  PORTAL_HOME,
  postLoginTarget,
  protectedRouteOf,
  ROUTE_ROLES,
  safeCallbackPath,
} from "../src/lib/access"
import { AUTH_ERROR_CODES } from "../src/lib/auth-errors"
import { APP_ROLES, EURON_ADMIN, EURON_DRIVER, GARAGE_PORTAL_USER, type AppRole } from "../src/lib/erp/roles"
import { loginErrorMessage, loginNotice } from "../src/lib/login-messages"
import { config as proxyConfig } from "../src/proxy"

const ADMIN = [EURON_ADMIN] as AppRole[]
const DRIVER = [EURON_DRIVER] as AppRole[]
const GARAGE = [GARAGE_PORTAL_USER] as AppRole[]

/** Every subset of the three app roles (2^3 = 8). */
function allRoleSets(): AppRole[][] {
  const sets: AppRole[][] = []
  for (let mask = 0; mask < 1 << APP_ROLES.length; mask++) {
    sets.push(APP_ROLES.filter((_, i) => mask & (1 << i)))
  }
  return sets
}

describe("route access matrix (FE-02, D12)", () => {
  const cases: Array<[string, AppRole[], string, boolean]> = [
    ["driver → /driver", DRIVER, DRIVER_HOME, true],
    ["driver → /portal/dashboard", DRIVER, PORTAL_HOME, false],
    ["garage → /portal/dashboard", GARAGE, PORTAL_HOME, true],
    ["garage → /driver (competitor data leak)", GARAGE, DRIVER_HOME, false],
    ["admin → /driver", ADMIN, DRIVER_HOME, true],
    ["admin → /portal/dashboard", ADMIN, PORTAL_HOME, true],
    ["no role → /driver", [], DRIVER_HOME, false],
    ["no role → /portal/dashboard", [], PORTAL_HOME, false],
    ["garage → /driver/sub/path", GARAGE, "/driver/stops/42", false],
    ["driver → /portal/dashboard/sub", DRIVER, "/portal/dashboard/history", false],
  ]
  for (const [name, roles, path, expected] of cases) {
    it(name, () => assert.equal(canAccess(roles, path), expected))
  }

  it("public paths are not role-gated", () => {
    for (const path of ["/", "/portal", "/about", "/driver-info", "/portal/dashboardx", "/studio"]) {
      assert.equal(protectedRouteOf(path), undefined, path)
      assert.equal(canAccess([], path), true, path)
    }
  })

  it("rejects non-array / unknown roles instead of trusting them", () => {
    assert.equal(canAccess("Euron Driver", DRIVER_HOME), false)
    assert.equal(canAccess(undefined, DRIVER_HOME), false)
    assert.equal(canAccess(["euron driver", "System Manager", 42, null], DRIVER_HOME), false)
    assert.deepEqual(normalizeRoles(["Euron Driver", "Administrator", 1]), [EURON_DRIVER])
  })

  it("landing priority: Admin → /driver, Driver → /driver, Garage → /portal/dashboard", () => {
    assert.equal(homeFor(ADMIN), DRIVER_HOME)
    assert.equal(homeFor(DRIVER), DRIVER_HOME)
    assert.equal(homeFor(GARAGE), PORTAL_HOME)
    assert.equal(homeFor([GARAGE_PORTAL_USER, EURON_DRIVER]), DRIVER_HOME)
    assert.equal(homeFor([GARAGE_PORTAL_USER, EURON_ADMIN]), DRIVER_HOME)
    assert.equal(homeFor([]), null)
    assert.equal(homeFor(["System Manager"]), null)
  })

  it("for every role set, home is a route the user may open (no redirect loop)", () => {
    for (const roles of allRoleSets()) {
      const home = homeFor(roles)
      if (roles.length === 0) {
        assert.equal(home, null)
        continue
      }
      assert.ok(home, `no home for ${roles.join(",")}`)
      assert.equal(canAccess(roles, home), true, `home ${home} not accessible for ${roles.join(",")}`)
      assert.notEqual(home, LOGIN_PATH)
    }
  })
})

describe("callbackUrl handling (no open redirect)", () => {
  it("accepts relative paths into protected app routes", () => {
    assert.equal(safeCallbackPath("/driver"), "/driver")
    assert.equal(safeCallbackPath("/driver?max=3"), "/driver?max=3")
    assert.equal(safeCallbackPath("/portal/dashboard"), "/portal/dashboard")
  })

  it("rejects anything that could leave the site or is not an app route", () => {
    for (const raw of [
      "https://evil.example/driver",
      "//evil.example/driver",
      "/\\evil.example",
      "\\\\evil.example",
      "javascript:alert(1)",
      "driver",
      "/",
      "/about",
      "/portal",
      "/driver\nSet-Cookie: x",
      "",
      "/" + "a".repeat(600),
      42,
      undefined,
      null,
    ]) {
      assert.equal(safeCallbackPath(raw), null, String(raw))
    }
  })

  it("resolves dot segments before checking (/driver/../about is not an app route)", () => {
    assert.equal(safeCallbackPath("/driver/../about"), null)
    assert.equal(safeCallbackPath("/driver/%2e%2e/about"), null)
    assert.equal(safeCallbackPath("/about/../driver"), "/driver")
  })

  it("post-login target honours an allowed callback, otherwise the role home", () => {
    assert.equal(postLoginTarget(DRIVER, "/driver?x=1"), "/driver?x=1")
    assert.equal(postLoginTarget(GARAGE, "/driver"), PORTAL_HOME)
    assert.equal(postLoginTarget(DRIVER, "/portal/dashboard"), DRIVER_HOME)
    assert.equal(postLoginTarget(ADMIN, "/portal/dashboard"), "/portal/dashboard")
    assert.equal(postLoginTarget(GARAGE, "https://evil.example"), PORTAL_HOME)
    assert.equal(postLoginTarget([], "/driver"), null)
  })
})

describe("proxy matcher stays in sync with ROUTE_ROLES", () => {
  const match = (url: string) => unstable_doesMiddlewareMatch({ config: proxyConfig, url })

  it("matches every protected route and its sub-paths", () => {
    for (const prefix of Object.keys(ROUTE_ROLES)) {
      assert.equal(match(prefix), true, prefix)
      assert.equal(match(`${prefix}/x/y`), true, `${prefix}/x/y`)
    }
  })

  it("does not run on public pages or the login page", () => {
    for (const url of ["/", "/portal", "/about", "/api/auth/session", "/studio"]) {
      assert.equal(match(url), false, url)
    }
  })
})

describe("login messages", () => {
  it("maps known codes to fixed text", () => {
    assert.match(loginErrorMessage("CredentialsSignin"), /Invalid email or password/)
    assert.match(loginErrorMessage(AUTH_ERROR_CODES.noAppRole), /no access/)
    assert.match(loginErrorMessage(AUTH_ERROR_CODES.rateLimited), /Too many/)
    assert.match(loginErrorMessage(AUTH_ERROR_CODES.erpUnavailable), /temporarily unavailable/)
    assert.match(loginNotice("SessionExpired") ?? "", /expired/)
  })

  it("never reflects unknown codes", () => {
    const evil = "<script>alert(1)</script>"
    assert.equal(loginErrorMessage(evil), "Sign-in failed. Please try again.")
    assert.equal(loginErrorMessage("__proto__"), "Sign-in failed. Please try again.")
    assert.equal(loginNotice(evil), null)
    assert.equal(loginNotice("constructor"), null)
    assert.equal(loginNotice(undefined), null)
  })
})
