/**
 * Live check against a running ERP (the devcontainer). Skipped unless all three env vars are set:
 *
 *   ERP_LIVE_URL=http://localhost:8000  ERP_LIVE_USER=Administrator  ERP_LIVE_PASSWORD=…  npm run test:live
 *
 * Uses a real login, one GET, one POST (CSRF), logout, and proves the sid is dead afterwards.
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { ErpError } from "../src/lib/erp/errors"
import { callErp, type ErpSession } from "../src/lib/erp/http"
import { erpLogin, erpLogout } from "../src/lib/erp/login"

const url = process.env.ERP_LIVE_URL
const user = process.env.ERP_LIVE_USER
const password = process.env.ERP_LIVE_PASSWORD
const enabled = Boolean(url && user && password)

describe("live ERP handshake", { skip: enabled ? false : "set ERP_LIVE_URL, ERP_LIVE_USER, ERP_LIVE_PASSWORD" }, () => {
  it("login → GET → POST with CSRF → logout → session dead", async () => {
    process.env.ERPNEXT_BASE_URL = url

    assert.equal(await erpLogin(user, `${password}-definitely-wrong`), null, "wrong password must be rejected")

    const login = await erpLogin(user, password)
    assert.ok(login, "login failed — check user/password")
    assert.ok(login.roles.length > 0, "user needs a Euron role (Administrator counts as Euron Admin)")
    const session: ErpSession = { sid: login.sid, csrfToken: login.csrfToken, expiresAt: Date.now() + 10 * 60_000 }

    const route = await callErp<unknown[]>(session, "euron_export_erp.api.driver.get_route_list", { params: { max_rank: 5, limit: 5 } })
    assert.ok(Array.isArray(route), "route list must be an array")

    const who = await callErp<string>(session, "frappe.auth.get_logged_user", { httpMethod: "POST", body: {} })
    assert.equal(who, login.user, "POST with CSRF must be accepted")

    await assert.rejects(
      callErp({ ...session, csrfToken: "wrongtoken123" }, "frappe.auth.get_logged_user", { httpMethod: "POST", body: {} }),
      (e: unknown) => e instanceof ErpError && e.kind === "unauthenticated",
      "POST with a wrong CSRF token must be refused"
    )

    await erpLogout(session)
    await assert.rejects(
      callErp(session, "euron_export_erp.api.driver.get_route_list"),
      (e: unknown) => e instanceof ErpError && e.kind === "unauthenticated",
      "sid must be dead after logout"
    )
  })
})
