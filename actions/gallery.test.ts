import { beforeEach, describe, expect, it, vi } from "vitest"

const storageMock = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
}

const supabaseMock = {
  from: vi.fn(),
  storage: { from: vi.fn(() => storageMock) },
}

vi.mock("../lib/supabase/server", () => ({
  getServiceRoleClient: () => supabaseMock,
  GALLERY_BUCKET: "memorial-photos",
}))

vi.mock("../lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn(),
}))

import { getFamilySession } from "../lib/auth/get-family-session"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from "./gallery"

describe("listGalleryImages", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows to public URLs for the given scope", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          scope: "family",
          title: "Piquenique",
          description: null,
          storage_path: "family/1-piquenique.jpg",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    supabaseMock.from.mockReturnValue({ select })
    storageMock.getPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.test/family/1-piquenique.jpg" } })

    const result = await listGalleryImages("family")

    expect(eq).toHaveBeenCalledWith("scope", "family")
    expect(result[0].url).toBe("https://cdn.test/family/1-piquenique.jpg")
  })
})

describe("uploadGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.jpg", { type: "image/jpeg" }))

    const result = await uploadGalleryImage("family", formData)

    expect(result.error).toBe("Não autorizado.")
    expect(storageMock.upload).not.toHaveBeenCalled()
  })

  it("rejects a non-image file even when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.txt", { type: "text/plain" }))

    const result = await uploadGalleryImage("family", formData)

    expect(result.error).toBe("Apenas arquivos de imagem são permitidos.")
    expect(storageMock.upload).not.toHaveBeenCalled()
  })

  it("rejects a file over 5MB", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", bigFile)

    const result = await uploadGalleryImage("family", formData)

    expect(result.error).toBe("Arquivo muito grande. Máximo 5MB.")
    expect(storageMock.upload).not.toHaveBeenCalled()
  })

  it("uploads and inserts metadata when valid and authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    storageMock.upload.mockResolvedValue({ error: null })
    const insert = vi.fn().mockResolvedValue({ error: null })
    supabaseMock.from.mockReturnValue({ insert })

    const formData = new FormData()
    formData.set("title", "Piquenique")
    formData.set("description", "")
    formData.set("file", new File(["a"], "foto.jpg", { type: "image/jpeg" }))

    const result = await uploadGalleryImage("family", formData)

    expect(storageMock.upload).toHaveBeenCalled()
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "family", title: "Piquenique" }),
    )
    expect(result.error).toBeNull()
  })
})

describe("deleteGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteGalleryImage("family", "1")

    expect(result.error).toBe("Não autorizado.")
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("removes the storage object and the row when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const single = vi.fn().mockResolvedValue({ data: { storage_path: "family/1-foto.jpg" }, error: null })
    const eqSelect = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: eqSelect })
    const eqDelete = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq: eqDelete })
    supabaseMock.from.mockReturnValue({ select, delete: del })
    storageMock.remove.mockResolvedValue({ error: null })

    const result = await deleteGalleryImage("family", "1")

    expect(storageMock.remove).toHaveBeenCalledWith(["family/1-foto.jpg"])
    expect(del).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })
})
