import { beforeEach, describe, expect, it, vi } from "vitest"

const supabaseMock = {
  from: vi.fn(),
}

vi.mock("../lib/supabase/server", () => ({
  getServiceRoleClient: () => supabaseMock,
}))

vi.mock("../lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn(),
}))

import { getFamilySession } from "../lib/auth/get-family-session"
import { addTestimonial, deleteTestimonial, likeTestimonial, listTestimonials } from "./testimonials"

function mockSelectChain(rows: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  supabaseMock.from.mockReturnValue({ select })
  return { select, eq, order }
}

describe("listTestimonials", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows for the given person", async () => {
    mockSelectChain([
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

    expect(supabaseMock.from).toHaveBeenCalledWith("testimonials")
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

  it("rejects an empty name or message without touching supabase", async () => {
    const result = await addTestimonial("israel", "  ", "mensagem")
    expect(result.error).toBe("Nome e mensagem são obrigatórios.")
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("inserts a trimmed testimonial when valid", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    supabaseMock.from.mockReturnValue({ insert })

    const result = await addTestimonial("israel", "  Maria  ", "  Com carinho  ")

    expect(insert).toHaveBeenCalledWith({ person: "israel", name: "Maria", message: "Com carinho" })
    expect(result.error).toBeNull()
  })
})

describe("likeTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("adds the session and increments likes when not already liked", async () => {
    const single = vi.fn().mockResolvedValue({ data: { likes: 1, liked_by: [] }, error: null })
    const eqSelect = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: eqSelect })
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    supabaseMock.from.mockReturnValue({ select, update })

    const result = await likeTestimonial("israel", "1", "session-a")

    expect(update).toHaveBeenCalledWith({ likes: 2, liked_by: ["session-a"] })
    expect(result.error).toBeNull()
  })

  it("removes the session and decrements likes when already liked", async () => {
    const single = vi.fn().mockResolvedValue({ data: { likes: 1, liked_by: ["session-a"] }, error: null })
    const eqSelect = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: eqSelect })
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    supabaseMock.from.mockReturnValue({ select, update })

    const result = await likeTestimonial("israel", "1", "session-a")

    expect(update).toHaveBeenCalledWith({ likes: 0, liked_by: [] })
    expect(result.error).toBeNull()
  })
})

describe("deleteTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteTestimonial("israel", "1")

    expect(result.error).toBe("Não autorizado.")
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("deletes when the family session is valid", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    supabaseMock.from.mockReturnValue({ delete: del })

    const result = await deleteTestimonial("israel", "1")

    expect(del).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })
})
