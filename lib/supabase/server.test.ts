import { afterEach, describe, expect, it, vi } from "vitest"

describe("getServiceRoleClient", () => {
  const ORIGINAL_ENV = process.env

  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.resetModules()
  })

  it("throws a clear error when SUPABASE_URL is missing", async () => {
    process.env = { ...ORIGINAL_ENV, SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "key" }
    const { getServiceRoleClient } = await import("./server")
    expect(() => getServiceRoleClient()).toThrow("SUPABASE_URL")
  })

  it("throws a clear error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env = { ...ORIGINAL_ENV, SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "" }
    const { getServiceRoleClient } = await import("./server")
    expect(() => getServiceRoleClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY")
  })

  it("returns a client when both env vars are set", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "key",
    }
    const { getServiceRoleClient } = await import("./server")
    expect(getServiceRoleClient()).toBeDefined()
  })
})
