import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"

import { ErpError, isReauthRequired } from "../src/lib/erp/errors"
import { callErp, type ErpSession } from "../src/lib/erp/http"
import { BASE, CSRF, SID, captureLogs, frappeError, json, scriptFetch, setEnv } from "./helpers"

const NOW = Date.parse("2026-10-07T10:00:00Z")
const session: ErpSession = { sid: SID, csrfToken: CSRF, expiresAt: NOW + 3600_000 }
const ROUTE = "euron_export_erp.api.driver.get_route_list"
const LOG = "euron_export_erp.api.driver.log_collection"

function rejectsWith(kind: ErpError["kind"], extra: (e: ErpError) => void = () => {}) {
  return (e: unknown) => {
    assert.ok(e instanceof ErpError, `expected ErpError, got ${String(e)}`)
    assert.equal(e.kind, kind)
    extra(e)
    return true
  }
}

describe("callErp (FE-03c fetch wrapper)", () => {
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

  it("GET: sid cookie, no CSRF, query params, returns message, no caching / redirects", async () => {
    const f = scriptFetch(json({ message: [{ name: "G-1" }] }))
    restoreFetch = f.restore
    const out = await callErp<{ name: string }[]>(session, ROUTE, { params: { max_rank: 3, limit: undefined, active: true } }, NOW)
    assert.deepEqual(out, [{ name: "G-1" }])
    const [call] = f.calls
    assert.equal(call.url, `${BASE}/api/method/${ROUTE}?max_rank=3&active=1`)
    assert.equal(call.init.method, "GET")
    assert.equal(call.init.headers.Cookie, `sid=${SID}`)
    assert.equal(call.init.headers["X-Frappe-CSRF-Token"], undefined)
    assert.equal(call.init.body, undefined)
    assert.equal(call.init.cache, "no-store")
    assert.equal(call.init.redirect, "manual")
  })

  it("POST: CSRF header + JSON body", async () => {
    const f = scriptFetch(json({ message: { log: "LOG-1", duplicate: false } }))
    restoreFetch = f.restore
    const out = await callErp(session, LOG, { httpMethod: "POST", body: { client_uuid: "u-1", high_profile: 4 } }, NOW)
    assert.deepEqual(out, { log: "LOG-1", duplicate: false })
    const [call] = f.calls
    assert.equal(call.url, `${BASE}/api/method/${LOG}`)
    assert.equal(call.init.headers["X-Frappe-CSRF-Token"], CSRF)
    assert.equal(call.init.headers["Content-Type"], "application/json")
    assert.deepEqual(JSON.parse(String(call.init.body)), { client_uuid: "u-1", high_profile: 4 })
  })

  it("no / expired / malformed session → unauthenticated without any fetch", async () => {
    const f = scriptFetch()
    restoreFetch = f.restore
    for (const s of [null, { ...session, expiresAt: NOW - 1 }, { ...session, sid: "x\r\nEvil: 1" }, { ...session, csrfToken: "" }]) {
      await assert.rejects(callErp(s, ROUTE, {}, NOW), rejectsWith("unauthenticated"))
    }
    assert.equal(f.calls.length, 0)
  })

  it("invalid method name / GET with body → config error without fetch", async () => {
    const f = scriptFetch()
    restoreFetch = f.restore
    await assert.rejects(callErp(session, "../api/resource/User", {}, NOW), rejectsWith("config"))
    await assert.rejects(callErp(session, ROUTE, { body: { a: 1 } }, NOW), rejectsWith("config"))
    assert.equal(f.calls.length, 0)
  })

  it("401 → unauthenticated (isReauthRequired)", async () => {
    restoreFetch = scriptFetch(frappeError(401, "AuthenticationError", "Login required.")).restore
    await assert.rejects(callErp(session, ROUTE, {}, NOW), (e: unknown) => isReauthRequired(e))
  })

  it("CSRF mismatch (400 CSRFTokenError) → unauthenticated", async () => {
    restoreFetch = scriptFetch(frappeError(400, "CSRFTokenError", "Invalid Request")).restore
    await assert.rejects(callErp(session, LOG, { httpMethod: "POST", body: {} }, NOW), rejectsWith("unauthenticated"))
  })

  it("403 while the session is dead (probe also 403) → unauthenticated", async () => {
    const f = scriptFetch(frappeError(403, "PermissionError", "Not permitted"), frappeError(403, "PermissionError"))
    restoreFetch = f.restore
    await assert.rejects(callErp(session, ROUTE, {}, NOW), rejectsWith("unauthenticated"))
    assert.equal(f.calls[1].url, `${BASE}/api/method/euron_export_erp.api.session.get_session_context`)
    assert.equal(f.calls[1].init.headers.Cookie, `sid=${SID}`)
  })

  it("403 from the session endpoint itself → unauthenticated, no extra probe", async () => {
    const f = scriptFetch(frappeError(403, "PermissionError"))
    restoreFetch = f.restore
    await assert.rejects(callErp(session, "euron_export_erp.api.session.get_session_context", {}, NOW), rejectsWith("unauthenticated"))
    assert.equal(f.calls.length, 1)
  })

  it("403 with a live session (probe 200) → forbidden with safe message", async () => {
    restoreFetch = scriptFetch(
      frappeError(403, "PermissionError", "You are not permitted to act for this garage."),
      json({ message: { user: "x" } })
    ).restore
    await assert.rejects(
      callErp(session, LOG, { httpMethod: "POST", body: {} }, NOW),
      rejectsWith("forbidden", (e) => assert.equal(e.userMessage, "You are not permitted to act for this garage."))
    )
  })

  it("403 + probe network failure → stays forbidden (never logs out on a blip)", async () => {
    restoreFetch = scriptFetch(frappeError(403, "PermissionError"), new TypeError("fetch failed")).restore
    await assert.rejects(callErp(session, ROUTE, {}, NOW), rejectsWith("forbidden"))
  })

  it("417 ValidationError → validation with user message (HTML stripped)", async () => {
    restoreFetch = scriptFetch(frappeError(417, "ValidationError", "Amount must be <b>positive</b>")).restore
    await assert.rejects(
      callErp(session, LOG, { httpMethod: "POST", body: {} }, NOW),
      rejectsWith("validation", (e) => {
        assert.equal(e.userMessage, "Amount must be positive")
        assert.equal(e.status, 417)
        assert.equal(e.excType, "ValidationError")
      })
    )
  })

  it("404 / 429 / 500 / redirect map to not_found / rate_limited / server (no detail) / bad_response", async () => {
    const cases: Array<[Response, ErpError["kind"]]> = [
      [frappeError(404, "DoesNotExistError"), "not_found"],
      [frappeError(429, "RateLimitExceededError", "Too many requests"), "rate_limited"],
      [frappeError(500, "OperationalError", "Traceback: secret internals"), "server"],
      [new Response(null, { status: 302, headers: { Location: "/login" } }), "bad_response"],
    ]
    for (const [res, kind] of cases) {
      const f = scriptFetch(res)
      await assert.rejects(
        callErp(session, ROUTE, {}, NOW),
        rejectsWith(kind, (e) => {
          if (kind === "server") assert.equal(e.userMessage, undefined)
        })
      )
      f.restore()
    }
  })

  it("200 with non-JSON body → bad_response", async () => {
    restoreFetch = scriptFetch(new Response("<html>proxy error</html>", { status: 200 })).restore
    await assert.rejects(callErp(session, ROUTE, {}, NOW), rejectsWith("bad_response"))
  })

  it("network failure → network; slow ERP → timeout", async () => {
    let f = scriptFetch(new TypeError("fetch failed"))
    await assert.rejects(callErp(session, ROUTE, {}, NOW), rejectsWith("network"))
    f.restore()

    f = scriptFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          // AbortSignal.timeout's timer is unref'd; keep the loop alive like a real pending socket would.
          const keepAlive = setTimeout(() => {}, 5_000)
          init.signal?.addEventListener("abort", () => {
            clearTimeout(keepAlive)
            reject(init.signal?.reason)
          })
        })
    )
    await assert.rejects(callErp(session, ROUTE, { timeoutMs: 30 }, NOW), rejectsWith("timeout"))
    f.restore()
  })

  it("never logs the sid, CSRF token or cookie header", async () => {
    restoreFetch = scriptFetch(frappeError(401, "AuthenticationError")).restore
    await assert.rejects(callErp(session, ROUTE, {}, NOW))
    const all = logs.lines.join("\n")
    assert.ok(all.includes(ROUTE), "logs the method")
    assert.ok(!all.includes(SID), "no sid in logs")
    assert.ok(!all.includes(CSRF), "no csrf in logs")
    assert.ok(!/cookie/i.test(all), "no cookie header in logs")
  })
})
