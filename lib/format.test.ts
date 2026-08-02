import { describe, expect, it, vi, afterEach } from "vitest"
import { formatRelativeDate } from "./format"

describe("formatRelativeDate", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns '1 dia atrás' for yesterday", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-02T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe("1 dia atrás")
  })

  it("returns '3 dias atrás' for 3 days ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-04T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe("3 dias atrás")
  })

  it("returns weeks for 10 days ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-11T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe("2 semanas atrás")
  })

  it("falls back to a localized date past 30 days", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-12-01T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe(
      new Date("2026-08-01T12:00:00Z").toLocaleDateString("pt-BR"),
    )
  })
})
