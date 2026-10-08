import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"

import { loadDriverRoute, ROUTE_LIMIT, ROUTE_LIST_METHOD, ROUTE_MAX_RANK } from "../src/lib/driver-route"
import { ErpError } from "../src/lib/erp/errors"
import type { ErpCallOptions } from "../src/lib/erp/http"
import { fromRouteRows, toWaypoints } from "../src/lib/routing"
import { captureLogs } from "./helpers"

const ROW = {
  name: "GAR-0001",
  garage_name: "Garage Muster",
  urgency_rank: 1,
  pickup_boost_active: 1,
  no_payment_agreement: 0,
  address_line_1: "Hauptstrasse 1",
  address_line_2: "",
  postal_code: "8000",
  city: "Zürich",
  country: "Switzerland",
  latitude: 47.3769,
  longitude: 8.5417,
  contact_person: "Hans",
  contact_phone: "+41 44 000 00 00",
}

describe("fromRouteRows (get_route_list → PendingGarage)", () => {
  it("maps the ERP row to the minimal client shape", () => {
    assert.deepEqual(fromRouteRows([ROW]), [
      {
        id: "GAR-0001",
        garageName: "Garage Muster",
        address: "Hauptstrasse 1, 8000 Zürich",
        lat: 47.3769,
        lng: 8.5417,
        urgency: 1,
        pickupRequested: true,
      },
    ])
  })

  it("does not pass contact data or payment flags to the client", () => {
    const [garage] = fromRouteRows([ROW]) ?? []
    assert.ok(garage)
    for (const key of ["contact_person", "contact_phone", "contactPhone", "no_payment_agreement", "country"]) {
      assert.equal(key in garage, false, key)
    }
  })

  it("returns null for a non-list payload (error, not an empty route)", () => {
    for (const payload of [undefined, null, {}, "x", { data: [] }]) {
      assert.equal(fromRouteRows(payload), null)
    }
    assert.deepEqual(fromRouteRows([]), [])
  })

  it("drops rows without an id and tolerates junk rows", () => {
    assert.deepEqual(fromRouteRows([null, 1, "x", {}, { name: "  " }, { ...ROW, name: 7 }]), [])
  })

  it("treats 0/0, out-of-range and non-numeric coordinates as no GPS", () => {
    const cases = [
      { latitude: 0, longitude: 0 },
      { latitude: 91, longitude: 8 },
      { latitude: 47, longitude: 181 },
      { latitude: "abc", longitude: 8 },
      { latitude: null, longitude: null },
      { latitude: Number.NaN, longitude: 8 },
    ]
    for (const coords of cases) {
      const [garage] = fromRouteRows([{ ...ROW, ...coords }]) ?? []
      assert.equal(garage.lat, undefined, JSON.stringify(coords))
      assert.equal(garage.lng, undefined, JSON.stringify(coords))
      assert.deepEqual(toWaypoints([garage]), [])
    }
    const [numericStrings] = fromRouteRows([{ ...ROW, latitude: "47.5", longitude: "8.7" }]) ?? []
    assert.equal(numericStrings.lat, 47.5)
    assert.equal(numericStrings.lng, 8.7)
  })

  it("never invents urgency: unknown ranks become 5 (least urgent)", () => {
    for (const urgency_rank of [0, 6, 2.5, "x", null, undefined]) {
      const [garage] = fromRouteRows([{ ...ROW, urgency_rank }]) ?? []
      assert.equal(garage.urgency, 5, String(urgency_rank))
    }
    assert.equal(fromRouteRows([{ ...ROW, urgency_rank: "2" }])?.[0].urgency, 2)
  })

  it("falls back to the id for a missing name and omits an empty address", () => {
    const [garage] =
      fromRouteRows([{ name: "GAR-9", address_line_1: " ", postal_code: null, city: undefined }]) ?? []
    assert.equal(garage.garageName, "GAR-9")
    assert.equal(garage.address, undefined)
    assert.equal(garage.pickupRequested, false)
  })
})

describe("loadDriverRoute", () => {
  let logs: ReturnType<typeof captureLogs>
  beforeEach(() => {
    logs = captureLogs()
  })
  afterEach(() => logs.restore())

  function caller(result: unknown | Error) {
    const calls: Array<{ method: string; options?: ErpCallOptions }> = []
    const call = async <T,>(method: string, options?: ErpCallOptions): Promise<T> => {
      calls.push({ method, options })
      if (result instanceof Error) throw result
      return result as T
    }
    return { call, calls }
  }

  it("calls get_route_list with ranks 1–3 as a GET and maps the rows", async () => {
    const { call, calls } = caller([ROW])
    const result = await loadDriverRoute(call)
    assert.equal(result.status, "ok")
    assert.equal(result.status === "ok" && result.garages.length, 1)
    assert.deepEqual(calls, [
      { method: ROUTE_LIST_METHOD, options: { params: { max_rank: ROUTE_MAX_RANK, limit: ROUTE_LIMIT } } },
    ])
    assert.equal(ROUTE_MAX_RANK, 3)
  })

  it("asks for re-login when the ERP session is gone", async () => {
    const { call } = caller(new ErpError("unauthenticated", "expired"))
    assert.deepEqual(await loadDriverRoute(call), { status: "reauth" })
  })

  it("reports a 403 as forbidden (role revoked in the ERP since login)", async () => {
    const { call } = caller(new ErpError("forbidden", "no", { status: 403 }))
    assert.deepEqual(await loadDriverRoute(call), { status: "error", error: "forbidden" })
  })

  it("reports outages and bad payloads as unavailable, never as an empty route", async () => {
    for (const failure of [
      new ErpError("network", "down"),
      new ErpError("timeout", "slow"),
      new ErpError("server", "500", { status: 500 }),
      new Error("boom"),
    ]) {
      const { call } = caller(failure)
      assert.deepEqual(await loadDriverRoute(call), { status: "error", error: "unavailable" })
    }
    const { call } = caller({ not: "a list" })
    assert.deepEqual(await loadDriverRoute(call), { status: "error", error: "unavailable" })
    assert.ok(logs.lines.every((line) => !/sid=|csrf/i.test(line)))
  })
})
