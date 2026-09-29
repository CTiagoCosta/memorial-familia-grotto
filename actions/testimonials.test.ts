import { beforeEach, describe, expect, it, vi } from "vitest"

const sqlMock = vi.fn()

vi.mock("../lib/db", () => ({
  getSql: () => sqlMock,
}))

vi.mock("../lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn(),
}))

import { getFamilySession } from "../lib/auth/get-family-session"
import { addTestimonial, deleteTestimonial, likeTestimonial, listTestimonials } from "./testimonials"

describe("listTestimonials", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows for the given person", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: "1",
        person: "israel",
        name: "Alguém",
        message: "Saudade",
        likes: 2,
        liked_by: ["session-a"],
        created_at: "2026-01-01T00:00:00Z",
      },
    ])

    const result = await listTestimonials("israel")

    expect(sqlMock).toHaveBeenCalledTimes(1)
    expect(sqlMock.mock.calls[0].slice(1)).toContain("israel")
    expect(result).toEqual([
      {
        id: "1",
        person: "israel",
        name: "Alguém",
        message: "Saudade",
        likes: 2,
        likedBy: ["session-a"],
        createdAt: "2026-01-01T00:00:00Z",
      },
    ])
  })
})

describe("addTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects an empty name or message without touching the database", async () => {
    const result = await addTestimonial("israel", "  ", "mensagem")
    expect(result.error).toBe("Nome e mensagem são obrigatórios.")
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("inserts a trimmed testimonial when valid", async () => {
    sqlMock.mockResolvedValueOnce(undefined)

    const result = await addTestimonial("israel", "  Maria  ", "  Com carinho  ")

    expect(sqlMock.mock.calls[0].slice(1)).toEqual(["israel", "Maria", "Com carinho"])
    expect(result.error).toBeNull()
  })
})

describe("likeTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sends a single atomic update and reports success when a row is updated", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "1" }])

    const result = await likeTestimonial("israel", "1", "session-a")

    expect(sqlMock).toHaveBeenCalledTimes(1)
    const values = sqlMock.mock.calls[0].slice(1)
    expect(values).toContain("session-a")
    expect(values).toContain("1")
    expect(result.error).toBeNull()
  })

  it("returns an error when no testimonial matches the id", async () => {
    sqlMock.mockResolvedValueOnce([])

    const result = await likeTestimonial("israel", "missing", "session-a")

    expect(result.error).toBe("Depoimento não encontrado.")
  })
})

describe("deleteTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteTestimonial("israel", "1")

    expect(result.error).toBe("Não autorizado.")
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("deletes when the family session is valid", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    sqlMock.mockResolvedValueOnce(undefined)

    const result = await deleteTestimonial("israel", "1")

    expect(sqlMock.mock.calls[0].slice(1)).toEqual(["1"])
    expect(result.error).toBeNull()
  })
})
