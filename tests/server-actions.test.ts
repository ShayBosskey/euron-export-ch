import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"

/**
 * Next.js: a "use server" module may only export async functions. Anything else — including
 * `export type { X }` — is turned into a runtime reference by the server-action transform and the
 * module crashes on first use ("X is not defined"), which a type check and `next build` do not catch.
 */
const ACTIONS_DIR = join(process.cwd(), "src", "actions")

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

describe("server action modules", () => {
  const files = readdirSync(ACTIONS_DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))

  it("exist", () => assert.ok(files.length > 0))

  for (const file of files) {
    it(`${file} starts with "use server" and exports only async functions`, () => {
      const source = stripComments(readFileSync(join(ACTIONS_DIR, file), "utf8"))
      assert.match(source.trimStart(), /^["']use server["']/, "directive must be the first statement")
      const exportLines = source.split("\n").filter((line) => /^\s*export\b/.test(line))
      assert.ok(exportLines.length > 0, "no exports")
      for (const line of exportLines) {
        assert.match(line, /^\s*export async function \w+\s*\(/, `not allowed in a "use server" module: ${line.trim()}`)
      }
    })
  }
})
