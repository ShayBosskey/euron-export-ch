import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getErpBaseUrl, methodUrl } from "../src/lib/erp/config"
import { extractSessionCookie, parseSetCookie } from "../src/lib/erp/cookies"
import { ErpError, extractFrappeMessage } from "../src/lib/erp/errors"
import { SID } from "./helpers"

const NOW = Date.parse("2026-10-07T10:00:00Z")

function headersWith(...cookies: string[]) {
  const h = new Headers()
  for (const c of cookies) h.append("Set-Cookie", c)
  return h
}

describe("extractSessionCookie", () => {
  it("reads sid among Frappe's login cookies, Max-Age wins over Expires", () => {
    const h = headersWith(
      `sid=${SID}; Expires=Sat, 10 Oct 2026 10:00:00 GMT; Max-Age=3600; HttpOnly; Path=/; SameSite=Lax`,
      "system_user=no; Path=/",
      "full_name=Hans%20Muster; Path=/",
      "user_id=hans%40garage.ch; Path=/"
    )
    assert.deepEqual(extractSessionCookie(h, NOW), { sid: SID, expiresAt: NOW + 3600_000 })
  })

  it("uses Expires when there is no Max-Age (dates contain commas)", () => {
    const h = headersWith(`sid=${SID}; Expires=Sat, 10 Oct 2026 10:00:00 GMT; Path=/`)
    assert.equal(extractSessionCookie(h, NOW)?.expiresAt, Date.parse("Sat, 10 Oct 2026 10:00:00 GMT"))
  })

  it("ignores Guest, expired and malformed sids", () => {
    assert.equal(extractSessionCookie(headersWith("sid=Guest; Path=/"), NOW), null)
    assert.equal(extractSessionCookie(headersWith(`sid=${SID}; Max-Age=0`), NOW), null)
    assert.equal(extractSessionCookie(headersWith("sid=abc$def%0d%0aX-Evil; Path=/"), NOW), null)
    assert.equal(extractSessionCookie(headersWith("sid=short"), NOW), null)
    assert.equal(extractSessionCookie(new Headers(), NOW), null)
  })

  it("a later sid=Guest overrides an earlier sid", () => {
    assert.equal(extractSessionCookie(headersWith(`sid=${SID}`, "sid=Guest"), NOW), null)
  })

  it("parseSetCookie handles quoted values and missing attributes", () => {
    assert.deepEqual(parseSetCookie(`sid="${SID}"`, NOW), { name: "sid", value: SID, expiresAt: null })
    assert.equal(parseSetCookie("=novalue", NOW), null)
  })
})

describe("getErpBaseUrl / methodUrl", () => {
  it("accepts https and localhost http in development, strips trailing slash", () => {
    assert.equal(getErpBaseUrl({ ERPNEXT_BASE_URL: "https://erp.euron-export.ch/" }), "https://erp.euron-export.ch")
    assert.equal(getErpBaseUrl({ ERPNEXT_BASE_URL: "http://localhost:8000", NODE_ENV: "development" }), "http://localhost:8000")
    assert.equal(getErpBaseUrl({ ERPNEXT_BASE_URL: "http://euron.localhost:8000" }), "http://euron.localhost:8000")
  })

  it("rejects missing, non-https, credentialed or query URLs as config errors", () => {
    for (const env of [
      {},
      { ERPNEXT_BASE_URL: "not a url" },
      { ERPNEXT_BASE_URL: "http://erp.euron-export.ch" },
      { ERPNEXT_BASE_URL: "http://localhost:8000", NODE_ENV: "production" },
      { ERPNEXT_BASE_URL: "https://user:pw@erp.euron-export.ch" },
      { ERPNEXT_BASE_URL: "https://erp.euron-export.ch/?x=1" },
    ]) {
      assert.throws(() => getErpBaseUrl(env), (e: unknown) => e instanceof ErpError && e.kind === "config", JSON.stringify(env))
    }
  })

  it("only allows dotted Python method paths", () => {
    assert.equal(methodUrl("https://x", "euron_export_erp.api.driver.get_route_list"), "https://x/api/method/euron_export_erp.api.driver.get_route_list")
    for (const bad of ["login", "../resource/User", "a.b/../c", "A.b", "a.b?x=1", "a..b", ""]) {
      assert.throws(() => methodUrl("https://x", bad), (e: unknown) => e instanceof ErpError && e.kind === "config", bad)
    }
  })
})

describe("extractFrappeMessage", () => {
  it("unwraps _server_messages and strips HTML", () => {
    const body = { _server_messages: JSON.stringify([JSON.stringify({ message: "Amount must be <strong>positive</strong>" })]) }
    assert.equal(extractFrappeMessage(body), "Amount must be positive")
  })
  it("falls back to message, ignores garbage", () => {
    assert.equal(extractFrappeMessage({ message: "Plain" }), "Plain")
    assert.equal(extractFrappeMessage({ _server_messages: "{not json" }), undefined)
    assert.equal(extractFrappeMessage(null), undefined)
  })
})
