import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"

import { ErpError } from "../src/lib/erp/errors"
import type { ErpCallOptions } from "../src/lib/erp/http"
import { rolesAllow } from "../src/lib/access"
import { EURON_ADMIN, EURON_DRIVER, GARAGE_PORTAL_USER } from "../src/lib/erp/roles"
import { PICKUP_MESSAGES, PICKUP_ROLES, requestPickup } from "../src/lib/pickup"
import {
  formatSwissDate,
  fromMyGarages,
  fromPickupResponse,
  MY_GARAGES_METHOD,
  parseGarageId,
  REQUEST_PICKUP_METHOD,
} from "../src/lib/portal-data"
import { loadMyGarages } from "../src/lib/portal-garages"
import { captureLogs } from "./helpers"

function caller(result: unknown | Error) {
  const calls: Array<{ method: string; options?: ErpCallOptions }> = []
  const call = async <T,>(method: string, options?: ErpCallOptions): Promise<T> => {
    calls.push({ method, options })
    if (result instanceof Error) throw result
    return result as T
  }
  return { call, calls }
}

const GARAGE_ROW = {
  name: "GAR-0001",
  garage_name: "Garage Muster",
  city: "Zürich",
  postal_code: "8000",
  pickup_request: null,
}

describe("portal data mapping (FE-01)", () => {
  it("maps get_my_garages rows incl. an active pickup", () => {
    const rows = [
      GARAGE_ROW,
      { ...GARAGE_ROW, name: "GAR-0002", garage_name: "Zweitwerk", pickup_request: { name: "PR-9", valid_until: "2026-10-15" } },
    ]
    assert.deepEqual(fromMyGarages(rows), [
      { id: "GAR-0001", name: "Garage Muster", city: "Zürich", postalCode: "8000", pickup: null },
      { id: "GAR-0002", name: "Zweitwerk", city: "Zürich", postalCode: "8000", pickup: { validUntil: "2026-10-15" } },
    ])
  })

  it("treats a non-list payload as an error, an empty list as 'no garages'", () => {
    for (const payload of [undefined, null, {}, "x"]) assert.equal(fromMyGarages(payload), null)
    assert.deepEqual(fromMyGarages([]), [])
  })

  it("drops rows without an id and ignores malformed pickup objects / dates", () => {
    const rows = [null, {}, { name: "" }, { ...GARAGE_ROW, pickup_request: { valid_until: "2026-10-15" } }, { ...GARAGE_ROW, name: "G2", pickup_request: { name: "PR-1", valid_until: "next week" } }]
    const garages = fromMyGarages(rows)
    assert.equal(garages?.length, 2)
    assert.equal(garages?.[0].pickup, null)
    assert.deepEqual(garages?.[1].pickup, { validUntil: null })
  })

  it("only accepts sane garage ids from the browser", () => {
    assert.equal(parseGarageId(" GAR-0001 "), "GAR-0001")
    for (const bad of [undefined, null, 42, {}, "", "   ", "x".repeat(141), "GAR\n1", "GAR\u0000"]) {
      assert.equal(parseGarageId(bad), null, JSON.stringify(bad))
    }
  })

  it("validates the request_my_pickup response", () => {
    const ok = { pickup_request: "PR-1", garage: "GAR-0001", created: true, valid_until: "2026-10-15", boost_applied: true, urgency_rank: 1 }
    assert.deepEqual(fromPickupResponse(ok), { requestId: "PR-1", garageId: "GAR-0001", created: true, validUntil: "2026-10-15" })
    assert.equal(fromPickupResponse({ ...ok, created: "yes" }), null)
    assert.equal(fromPickupResponse({ ...ok, pickup_request: "" }), null)
    assert.equal(fromPickupResponse(null), null)
  })

  it("formats ERP dates the Swiss way without timezone shifts", () => {
    assert.equal(formatSwissDate("2026-10-15"), "15.10.2026")
    assert.equal(formatSwissDate(null), null)
    assert.equal(formatSwissDate("15.10.2026"), null)
  })
})

describe("loadMyGarages", () => {
  let logs: ReturnType<typeof captureLogs>
  beforeEach(() => (logs = captureLogs()))
  afterEach(() => logs.restore())

  it("reads the user's garages with a plain GET (no garage id from the browser)", async () => {
    const { call, calls } = caller([GARAGE_ROW])
    const result = await loadMyGarages(call)
    assert.equal(result.status, "ok")
    assert.deepEqual(calls, [{ method: MY_GARAGES_METHOD, options: undefined }])
  })

  it("re-login on an expired ERP session, fallback on anything else", async () => {
    assert.deepEqual(await loadMyGarages(caller(new ErpError("unauthenticated", "x")).call), { status: "reauth" })
    for (const failure of [new ErpError("network", "x"), new ErpError("forbidden", "x"), new Error("boom")]) {
      assert.deepEqual(await loadMyGarages(caller(failure).call), { status: "error" })
    }
    assert.deepEqual(await loadMyGarages(caller({ not: "a list" }).call), { status: "error" })
  })
})

describe("requestPickup (FE-01)", () => {
  let logs: ReturnType<typeof captureLogs>
  beforeEach(() => (logs = captureLogs()))
  afterEach(() => logs.restore())

  const OK = { pickup_request: "PR-1", garage: "GAR-0001", created: true, valid_until: "2026-10-15" }

  it("POSTs the garage id to request_my_pickup as the logged-in user", async () => {
    const { call, calls } = caller(OK)
    const result = await requestPickup("GAR-0001", call)
    assert.deepEqual(calls, [{ method: REQUEST_PICKUP_METHOD, options: { httpMethod: "POST", body: { garage_id: "GAR-0001" } } }])
    assert.equal(result.success, true)
    assert.match(result.message, /Pickup requested \(valid until 15\.10\.2026\)/)
  })

  it("reports an idempotent replay as 'already requested', not as a new request", async () => {
    const result = await requestPickup("GAR-0001", caller({ ...OK, created: false }).call)
    assert.equal(result.success, true)
    assert.equal(result.success && result.created, false)
    assert.match(result.message, /already requested/)
  })

  it("rejects malformed garage ids before calling the ERP", async () => {
    const { call, calls } = caller(OK)
    const result = await requestPickup({ garage: "x" }, call)
    assert.deepEqual(result, { success: false, message: PICKUP_MESSAGES.invalidGarage })
    assert.equal(calls.length, 0)
  })

  it("maps ERP failures to safe messages", async () => {
    const cases: Array<[Error, Partial<{ message: string; reauth: true }>]> = [
      [new ErpError("unauthenticated", "x"), { message: PICKUP_MESSAGES.reauth, reauth: true }],
      [new ErpError("rate_limited", "x", { status: 429 }), { message: PICKUP_MESSAGES.rateLimited }],
      [new ErpError("forbidden", "x", { status: 403, userMessage: "You are not permitted to act for this garage." }), { message: PICKUP_MESSAGES.notYourGarage }],
      [new ErpError("validation", "x", { status: 417, userMessage: "Pickup Request PR-7 for GAR-0009: Mandatory field" }), { message: PICKUP_MESSAGES.rejected }],
      [new ErpError("not_found", "x", { status: 404 }), { message: PICKUP_MESSAGES.rejected }],
      [new ErpError("server", "Traceback secret", { status: 500 }), { message: PICKUP_MESSAGES.unavailable }],
      [new ErpError("timeout", "x"), { message: PICKUP_MESSAGES.unavailable }],
      [new Error("boom"), { message: PICKUP_MESSAGES.unavailable }],
    ]
    for (const [error, expected] of cases) {
      const result = await requestPickup("GAR-0001", caller(error).call)
      assert.equal(result.success, false)
      assert.deepEqual(result, { success: false, ...expected })
    }
    assert.ok(logs.lines.every((line) => !/Traceback|sid=|csrf/i.test(line)))
  })

  it("treats an unexpected success payload as unavailable", async () => {
    const result = await requestPickup("GAR-0001", caller({ message: "ok" }).call)
    assert.deepEqual(result, { success: false, message: PICKUP_MESSAGES.unavailable })
  })

  it("rejects a confirmation for a different garage than requested", async () => {
    const result = await requestPickup("GAR-0001", caller({ ...OK, garage: "GAR-0002" }).call)
    assert.deepEqual(result, { success: false, message: PICKUP_MESSAGES.unavailable })
  })
})

describe("pickup authorization policy (A9)", () => {
  it("only Garage Portal Users may file pickups — admins and drivers may not", () => {
    assert.deepEqual([...PICKUP_ROLES], [GARAGE_PORTAL_USER])
    assert.equal(rolesAllow([GARAGE_PORTAL_USER], PICKUP_ROLES), true)
    assert.equal(rolesAllow([EURON_ADMIN], PICKUP_ROLES), false)
    assert.equal(rolesAllow([EURON_DRIVER], PICKUP_ROLES), false)
    assert.equal(rolesAllow([EURON_ADMIN, EURON_DRIVER], PICKUP_ROLES), false)
    assert.equal(rolesAllow([EURON_ADMIN, GARAGE_PORTAL_USER], PICKUP_ROLES), true)
  })

  it("unknown or malformed roles never authorize", () => {
    for (const roles of [[], undefined, null, "Garage Portal User", ["garage portal user"], ["System Manager"]]) {
      assert.equal(rolesAllow(roles, PICKUP_ROLES), false, JSON.stringify(roles))
    }
  })
})
