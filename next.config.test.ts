import { describe, expect, it } from "vitest"
import config from "./next.config.mjs"

describe("next config", () => {
  it("allows next/image to load Cloudinary-hosted images", () => {
    const patterns = config.images?.remotePatterns ?? []
    expect(patterns).toContainEqual(expect.objectContaining({ hostname: "res.cloudinary.com" }))
  })
})
