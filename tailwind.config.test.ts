import { describe, expect, it } from "vitest"
import config from "./tailwind.config"

describe("tailwind config", () => {
  it("defines the sage color scale used by the Sereno Natureza palette", () => {
    const colors = (config.theme?.extend?.colors ?? {}) as Record<string, unknown>
    expect(colors.sage).toMatchObject({
      50: expect.any(String),
      500: expect.any(String),
      700: expect.any(String),
    })
  })
})
