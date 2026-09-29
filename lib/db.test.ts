import { afterEach, describe, expect, it, vi } from "vitest"

describe("getSql", () => {
  const ORIGINAL_ENV = process.env

  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.resetModules()
  })

  it("throws a clear error when DATABASE_URL is missing", async () => {
    process.env = { ...ORIGINAL_ENV, DATABASE_URL: "" }
    const { getSql } = await import("./db")
    expect(() => getSql()).toThrow("DATABASE_URL")
  })

  it("returns a callable sql tag when DATABASE_URL is set", async () => {
    process.env = { ...ORIGINAL_ENV, DATABASE_URL: "postgres://user:pass@host/db" }
    const { getSql } = await import("./db")
    expect(typeof getSql()).toBe("function")
  })

  it("reuses the same instance across calls", async () => {
    process.env = { ...ORIGINAL_ENV, DATABASE_URL: "postgres://user:pass@host/db" }
    const { getSql } = await import("./db")
    expect(getSql()).toBe(getSql())
  })
})
