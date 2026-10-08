import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { rolesAllow } from "../src/lib/access"
import { COLLECTION_MESSAGES, LOG_ROLES, logCollection } from "../src/lib/collection"
import {
  fromLogResponse,
  LOG_COLLECTION_METHOD,
  MAX_NOTES_LENGTH,
  newClientUuid,
  parseAmountChf,
  parseClientUuid,
  parseTireCount,
  toErpBody,
  validateCollection,
} from "../src/lib/collection-data"
import { ErpError } from "../src/lib/erp/errors"
import type { ErpCallOptions } from "../src/lib/erp/http"
import { EURON_ADMIN, EURON_DRIVER, GARAGE_PORTAL_USER } from "../src/lib/erp/roles"
import { captureLogs } from "./helpers"

const UUID = "3f2b8c1e-9a4d-4e6f-8b2a-1c0d9e8f7a6b"

const VALID = {
  garageId: "GAR-0001",
  high: "4",
  mid: "10",
  trash: "",
  amount: "120,50",
  paymentMethod: "TWINT",
  notes: "  Back entrance  ",
  clientUuid: UUID.toUpperCase(),
}

function erpLog(overrides: Record<string, unknown> = {}) {
  return {
    log: "TCL-0042",
    garage: "GAR-0001",
    collection_date: "2026-10-08",
    high_profile_count: 4,
    mid_profile_count: 10,
    trash_count: 0,
    tire_count: 14,
    amount_charged: 120.5,
    payment_method: "TWINT",
    week_number: 41,
    year: 2026,
    client_uuid: UUID,
    duplicate: false,
    ...overrides,
  }
}

function caller(result: unknown | Error) {
  const calls: Array<{ method: string; options?: ErpCallOptions }> = []
  const call = async <T,>(method: string, options?: ErpCallOptions): Promise<T> => {
    calls.push({ method, options })
    if (result instanceof Error) throw result
    return result as T
  }
  return { call, calls }
}

describe("collection input parsing (FE-04)", () => {
  it("parses tire counts strictly", () => {
    assert.equal(parseTireCount(""), 0)
    assert.equal(parseTireCount(" 7 "), 7)
    assert.equal(parseTireCount("10000"), 10_000)
    assert.equal(parseTireCount(12), 12)
    for (const bad of ["10001", "-1", "1.5", "1e3", "12a", "0x1f", "١٢", 1.5, -1, NaN, Infinity, true, null, undefined, {}]) {
      assert.equal(parseTireCount(bad), null, JSON.stringify(bad))
    }
  })

  it("parses CHF the way Swiss drivers type it", () => {
    const ok: Array<[unknown, number]> = [
      ["", 0],
      ["120", 120],
      ["120.5", 120.5],
      ["120,50", 120.5],
      ["1'250.50", 1250.5],
      ["1’250", 1250],
      ["1 250", 1250],
      ["0.05", 0.05],
      ["99999.99", 99_999.99],
      [120.5, 120.5],
    ]
    for (const [raw, expected] of ok) assert.equal(parseAmountChf(raw), expected, JSON.stringify(raw))
    for (const bad of ["-1", "12.505", "1.250,50", "1,250.50", "12,", "abc", "1e3", "100000", "Infinity", NaN, Infinity, -5, null, {}, true]) {
      assert.equal(parseAmountChf(bad), null, JSON.stringify(bad))
    }
  })

  it("accepts only UUIDs the ERP accepts, lower-cased", () => {
    assert.equal(parseClientUuid(UUID.toUpperCase()), UUID)
    for (const bad of ["", "not-a-uuid", "3f2b8c1e-9a4d-0e6f-8b2a-1c0d9e8f7a6b", "3f2b8c1e-9a4d-4e6f-cb2a-1c0d9e8f7a6b", 42, null]) {
      assert.equal(parseClientUuid(bad), null, JSON.stringify(bad))
    }
  })

  it("generates v4 keys from getRandomValues (works outside secure contexts)", () => {
    const keys = new Set(Array.from({ length: 200 }, () => newClientUuid()))
    assert.equal(keys.size, 200)
    for (const key of keys) assert.equal(parseClientUuid(key), key)
    const zeros = { getRandomValues: <T extends ArrayBufferView | null>(a: T) => a } as Pick<Crypto, "getRandomValues">
    assert.equal(newClientUuid(zeros), "00000000-0000-4000-8000-000000000000")
  })
})

describe("validateCollection (FE-04)", () => {
  it("normalises a valid entry", () => {
    const result = validateCollection(VALID)
    assert.deepEqual(result, {
      ok: true,
      value: {
        garageId: "GAR-0001",
        high: 4,
        mid: 10,
        trash: 0,
        amount: 120.5,
        paymentMethod: "TWINT",
        notes: "Back entrance",
        clientUuid: UUID,
      },
    })
  })

  it("requires at least one tire", () => {
    const result = validateCollection({ ...VALID, high: "0", mid: "", trash: "0" })
    assert.equal(result.ok, false)
    assert.ok(!result.ok && result.errors.counts)
  })

  it("requires a payment method only when an amount is charged, and drops it otherwise", () => {
    const missing = validateCollection({ ...VALID, paymentMethod: null })
    assert.ok(!missing.ok && missing.errors.paymentMethod)
    const wrong = validateCollection({ ...VALID, paymentMethod: "twint" })
    assert.ok(!wrong.ok && wrong.errors.paymentMethod, "case-sensitive like the ERP")
    const free = validateCollection({ ...VALID, amount: "", paymentMethod: "Cash" })
    assert.ok(free.ok && free.value.paymentMethod === null && free.value.amount === 0)
  })

  it("rejects bad notes, garages and keys and reports every field at once", () => {
    const result = validateCollection({
      garageId: "GAR\n1",
      high: "x",
      mid: "-2",
      trash: "1.5",
      amount: "12.345",
      paymentMethod: "Bitcoin",
      notes: "a\u0000b",
      clientUuid: "nope",
    })
    assert.ok(!result.ok)
    assert.deepEqual(Object.keys(result.errors).sort(), ["amount", "clientUuid", "garageId", "high", "mid", "notes", "trash"])
    const long = validateCollection({ ...VALID, notes: "x".repeat(MAX_NOTES_LENGTH + 1) })
    assert.ok(!long.ok && long.errors.notes)
    const multiline = validateCollection({ ...VALID, notes: "line 1\nline 2\ttab" })
    assert.ok(multiline.ok)
  })

  it("treats non-objects as fully invalid", () => {
    for (const raw of [undefined, null, "x", 42, []]) assert.equal(validateCollection(raw).ok, false)
  })

  it("builds the ERP body without optional empties and without collection_date", () => {
    const result = validateCollection({ ...VALID, amount: "0", notes: "" })
    assert.ok(result.ok)
    assert.deepEqual(toErpBody(result.value), {
      garage_id: "GAR-0001",
      high_profile_count: 4,
      mid_profile_count: 10,
      trash_count: 0,
      amount_charged: 0,
      client_uuid: UUID,
    })
  })
})

describe("fromLogResponse (FE-04)", () => {
  it("maps the ERP response", () => {
    assert.deepEqual(fromLogResponse(erpLog()), {
      logId: "TCL-0042",
      garageId: "GAR-0001",
      clientUuid: UUID,
      high: 4,
      mid: 10,
      trash: 0,
      tireCount: 14,
      duplicate: false,
    })
  })

  it("rejects anything that is not a stored log", () => {
    for (const payload of [undefined, null, "x", [], {}]) assert.equal(fromLogResponse(payload), null)
    for (const field of ["log", "garage", "client_uuid", "duplicate", "tire_count", "high_profile_count"]) {
      assert.equal(fromLogResponse(erpLog({ [field]: undefined })), null, field)
    }
    assert.equal(fromLogResponse(erpLog({ tire_count: "14" })), null)
    assert.equal(fromLogResponse(erpLog({ duplicate: 0 })), null)
  })
})

describe("logCollection (FE-04)", () => {
  it("posts the validated body as the logged-in user", async () => {
    const { call, calls } = caller(erpLog())
    const result = await logCollection(VALID, call)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].method, LOG_COLLECTION_METHOD)
    assert.equal(calls[0].options?.httpMethod, "POST")
    assert.deepEqual(calls[0].options?.body, {
      garage_id: "GAR-0001",
      high_profile_count: 4,
      mid_profile_count: 10,
      trash_count: 0,
      amount_charged: 120.5,
      payment_method: "TWINT",
      notes: "Back entrance",
      client_uuid: UUID,
    })
    assert.deepEqual(result, {
      success: true,
      message: "Collection saved: 14 tires (log TCL-0042).",
      logId: "TCL-0042",
      tireCount: 14,
      duplicate: false,
      mismatch: false,
    })
  })

  it("never calls the ERP with invalid input", async () => {
    const { call, calls } = caller(erpLog())
    const result = await logCollection({ ...VALID, high: "", mid: "", trash: "" }, call)
    assert.equal(calls.length, 0)
    assert.ok(!result.success && result.fieldErrors?.counts && result.message === COLLECTION_MESSAGES.invalid)
  })

  it("reports an idempotent replay, and flags one whose stored counts differ", async () => {
    const same = await logCollection(VALID, caller(erpLog({ duplicate: true })).call)
    assert.ok(same.success && same.duplicate && !same.mismatch)
    assert.equal(same.success && same.message, "Already saved: 14 tires (log TCL-0042).")

    const stored = erpLog({ duplicate: true, high_profile_count: 5, tire_count: 15 })
    const differ = await logCollection(VALID, caller(stored).call)
    assert.ok(differ.success && differ.duplicate && differ.mismatch)
    assert.match(differ.success ? differ.message : "", /different numbers \(15 tires\).*TCL-0042/)
  })

  it("maps ERP failures to fixed texts and marks unknown outcomes as safe to resend", async () => {
    const logs = captureLogs()
    try {
      const cases: Array<[ErpError | Error, Record<string, unknown>]> = [
        [new ErpError("unauthenticated", "x"), { message: COLLECTION_MESSAGES.reauth, reauth: true }],
        [new ErpError("forbidden", "x", { userMessage: "Garage GAR-0001 internal" }), { message: COLLECTION_MESSAGES.forbidden }],
        [new ErpError("validation", "x", { userMessage: "Garage GAR-0001 is not active." }), { message: COLLECTION_MESSAGES.rejected }],
        [new ErpError("not_found", "x"), { message: COLLECTION_MESSAGES.garageGone }],
        [new ErpError("timeout", "x"), { message: COLLECTION_MESSAGES.unconfirmed, retrySafe: true }],
        [new ErpError("network", "x"), { message: COLLECTION_MESSAGES.unconfirmed, retrySafe: true }],
        [new ErpError("server", "x"), { message: COLLECTION_MESSAGES.unconfirmed, retrySafe: true }],
        [new Error("boom"), { message: COLLECTION_MESSAGES.unconfirmed, retrySafe: true }],
      ]
      for (const [error, expected] of cases) {
        const result = await logCollection(VALID, caller(error).call)
        assert.deepEqual(result, { success: false, ...expected }, String(error))
      }
      assert.ok(logs.lines.every((line) => !line.includes("GAR-0001") && !line.includes(UUID)), "no input data in logs")
    } finally {
      logs.restore()
    }
  })

  it("does not trust a 2xx that belongs to another garage or key", async () => {
    const logs = captureLogs()
    try {
      for (const payload of [erpLog({ garage: "GAR-9999" }), erpLog({ client_uuid: newClientUuid() }), { ok: true }]) {
        const result = await logCollection(VALID, caller(payload).call)
        assert.deepEqual(result, { success: false, message: COLLECTION_MESSAGES.unconfirmed, retrySafe: true })
      }
    } finally {
      logs.restore()
    }
  })
})

describe("LOG_ROLES (A9)", () => {
  it("lets drivers log and keeps admins and garage users out", () => {
    assert.deepEqual(LOG_ROLES, [EURON_DRIVER])
    assert.equal(rolesAllow([EURON_DRIVER], LOG_ROLES), true)
    assert.equal(rolesAllow([EURON_ADMIN, EURON_DRIVER], LOG_ROLES), true)
    assert.equal(rolesAllow([EURON_ADMIN], LOG_ROLES), false)
    assert.equal(rolesAllow([GARAGE_PORTAL_USER], LOG_ROLES), false)
    assert.equal(rolesAllow(["euron driver"], LOG_ROLES), false)
  })
})
