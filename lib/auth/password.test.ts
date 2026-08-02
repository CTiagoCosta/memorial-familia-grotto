import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "./password"

describe("password hashing", () => {
  it("verifies the correct password against its hash", async () => {
    const hash = await hashPassword("familia-grotto-2026")
    await expect(verifyPassword("familia-grotto-2026", hash)).resolves.toBe(true)
  })

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("familia-grotto-2026")
    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false)
  })
})
