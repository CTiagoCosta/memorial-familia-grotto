import { describe, expect, it } from "vitest"
import { isGalleryScope } from "./database"

describe("isGalleryScope", () => {
  it.each(["family", "israel", "sonia"])("accepts %s", (value) => {
    expect(isGalleryScope(value)).toBe(true)
  })

  it.each(["", "israel/../../etc", "admin", "Family"])("rejects %s", (value) => {
    expect(isGalleryScope(value)).toBe(false)
  })
})
