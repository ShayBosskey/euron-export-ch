import { mock } from "node:test"

export const BASE = "http://localhost:8000"
export const SID = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8"
export const CSRF = "f00dbabe1234567890abcdef1234567890abcdef12345678"

export type Recorded = { url: string; init: RequestInit & { headers: Record<string, string> } }

/** Replace global fetch with a scripted sequence of responses; returns the recorded calls. */
export function scriptFetch(...responses: Array<Response | Error | ((url: string, init: RequestInit) => Response | Promise<Response>)>) {
  const calls: Recorded[] = []
  let i = 0
  const fn = mock.method(globalThis, "fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input)
    calls.push({ url, init: init as Recorded["init"] })
    const next = responses[i++]
    if (next === undefined) throw new Error(`Unexpected fetch #${i}: ${url}`)
    if (next instanceof Error) throw next
    return typeof next === "function" ? next(url, init) : next
  })
  return { calls, restore: () => fn.mock.restore() }
}

export function json(body: unknown, status = 200, headers: Record<string, string | string[]> = {}): Response {
  const h = new Headers({ "Content-Type": "application/json" })
  for (const [key, value] of Object.entries(headers)) {
    for (const v of Array.isArray(value) ? value : [value]) h.append(key, v)
  }
  return new Response(JSON.stringify(body), { status, headers: h })
}

export function frappeError(status: number, excType: string, message?: string): Response {
  return json(
    {
      exc_type: excType,
      ...(message ? { _server_messages: JSON.stringify([JSON.stringify({ message, indicator: "red" })]) } : {}),
    },
    status
  )
}

export function setEnv() {
  process.env.ERPNEXT_BASE_URL = BASE
  ;(process.env as Record<string, string>).NODE_ENV = "test"
}

/** Silence and capture console.warn / console.error for the duration of a test. */
export function captureLogs() {
  const lines: string[] = []
  const warn = mock.method(console, "warn", (...args: unknown[]) => void lines.push(args.map(String).join(" ")))
  const error = mock.method(console, "error", (...args: unknown[]) => void lines.push(args.map(String).join(" ")))
  return {
    lines,
    restore: () => {
      warn.mock.restore()
      error.mock.restore()
    },
  }
}
