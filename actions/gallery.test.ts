import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { sqlMock, createUploadSignatureMock, verifyAssetExistsMock, destroyAssetMock, imageUrlMock } = vi.hoisted(
  () => ({
    sqlMock: vi.fn(),
    createUploadSignatureMock: vi.fn(),
    verifyAssetExistsMock: vi.fn(),
    destroyAssetMock: vi.fn(),
    imageUrlMock: vi.fn((publicId: string, width: number) => `https://cdn.test/${publicId}?w=${width}`),
  }),
)

vi.mock("../lib/db", () => ({
  getSql: () => sqlMock,
}))

vi.mock("../lib/cloudinary", () => ({
  GALLERY_FOLDER: "memorial-grotto",
  imageUrl: imageUrlMock,
  createUploadSignature: createUploadSignatureMock,
  verifyAssetExists: verifyAssetExistsMock,
  destroyAsset: destroyAssetMock,
}))

vi.mock("../lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn(),
}))

import { getFamilySession } from "../lib/auth/get-family-session"
import { deleteGalleryImage, getGalleryUploadSignature, listGalleryImages, registerGalleryImage } from "./gallery"

describe("listGalleryImages", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows to Cloudinary URLs for the given scope", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: "1",
        scope: "family",
        title: "Piquenique",
        description: null,
        public_id: "memorial-grotto/family/1-piquenique",
        created_at: "2026-01-01T00:00:00Z",
      },
    ])

    const result = await listGalleryImages("family")

    expect(sqlMock.mock.calls[0].slice(1)).toContain("family")
    expect(result[0].url).toBe("https://cdn.test/memorial-grotto/family/1-piquenique?w=1200")
    expect(result[0].publicId).toBe("memorial-grotto/family/1-piquenique")
  })
})

describe("getGalleryUploadSignature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-1111-1111-1111-111111111111")
  })

  afterEach(() => vi.restoreAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await getGalleryUploadSignature("family")

    expect(result).toEqual({ error: "Não autorizado." })
    expect(createUploadSignatureMock).not.toHaveBeenCalled()
  })

  it("rejects a scope outside family/israel/sonia", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)

    const result = await getGalleryUploadSignature("admin" as never)

    expect(result).toEqual({ error: "Escopo inválido." })
    expect(createUploadSignatureMock).not.toHaveBeenCalled()
  })

  it("generates and signs a publicId scoped to memorial-grotto/<scope>/ when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    createUploadSignatureMock.mockReturnValue({
      cloudName: "demo",
      apiKey: "key",
      timestamp: 123,
      publicId: "memorial-grotto/family/11111111-1111-1111-1111-111111111111",
      signature: "sig",
    })

    const result = await getGalleryUploadSignature("family")

    expect(createUploadSignatureMock).toHaveBeenCalledWith(
      "memorial-grotto/family/11111111-1111-1111-1111-111111111111",
    )
    expect(result).toEqual({
      cloudName: "demo",
      apiKey: "key",
      timestamp: 123,
      publicId: "memorial-grotto/family/11111111-1111-1111-1111-111111111111",
      signature: "sig",
    })
  })
})

describe("registerGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await registerGalleryImage("family", "memorial-grotto/family/abc", "Foto", "")

    expect(result.error).toBe("Não autorizado.")
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("rejects a scope outside family/israel/sonia", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)

    const result = await registerGalleryImage("admin" as never, "memorial-grotto/admin/abc", "Foto", "")

    expect(result.error).toBe("Escopo inválido.")
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("rejects an empty title", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)

    const result = await registerGalleryImage("family", "memorial-grotto/family/abc", "  ", "")

    expect(result.error).toBe("Título é obrigatório.")
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("rejects a publicId outside the expected scope folder", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)

    const result = await registerGalleryImage("family", "memorial-grotto/israel/abc", "Foto", "")

    expect(result.error).toBe("Imagem inválida.")
    expect(verifyAssetExistsMock).not.toHaveBeenCalled()
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("rejects when the asset does not exist on Cloudinary", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    verifyAssetExistsMock.mockResolvedValue(false)

    const result = await registerGalleryImage("family", "memorial-grotto/family/abc", "Foto", "")

    expect(result.error).toBe("Imagem não encontrada no Cloudinary.")
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("inserts the row when valid, authorized and the asset exists", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    verifyAssetExistsMock.mockResolvedValue(true)
    sqlMock.mockResolvedValueOnce(undefined)

    const result = await registerGalleryImage("family", "memorial-grotto/family/abc", " Piquenique ", "")

    expect(sqlMock.mock.calls[0].slice(1)).toEqual(["family", "Piquenique", null, "memorial-grotto/family/abc"])
    expect(result.error).toBeNull()
  })

  it("returns a generic error instead of throwing when the insert fails", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    verifyAssetExistsMock.mockResolvedValue(true)
    sqlMock.mockRejectedValueOnce(new Error("connection reset"))

    const result = await registerGalleryImage("family", "memorial-grotto/family/abc", "Foto", "")

    expect(result.error).toBe("Não foi possível salvar a foto. Tente novamente.")
  })
})

describe("deleteGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteGalleryImage("family", "1")

    expect(result.error).toBe("Não autorizado.")
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it("returns an error when the image is not found", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    sqlMock.mockResolvedValueOnce([])

    const result = await deleteGalleryImage("family", "1")

    expect(result.error).toBe("Foto não encontrada.")
    expect(destroyAssetMock).not.toHaveBeenCalled()
  })

  it("destroys the Cloudinary asset and deletes the row when found", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    sqlMock.mockResolvedValueOnce([{ public_id: "memorial-grotto/family/abc" }])
    sqlMock.mockResolvedValueOnce(undefined)
    destroyAssetMock.mockResolvedValue(undefined)

    const result = await deleteGalleryImage("family", "1")

    expect(destroyAssetMock).toHaveBeenCalledWith("memorial-grotto/family/abc")
    expect(sqlMock.mock.calls[1].slice(1)).toEqual(["1"])
    expect(result.error).toBeNull()
  })

  it("returns a generic error instead of throwing when the lookup query fails", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    sqlMock.mockRejectedValueOnce(new Error("connection reset"))

    const result = await deleteGalleryImage("family", "1")

    expect(result.error).toBe("Não foi possível excluir a foto. Tente novamente.")
  })

  it("returns a generic error instead of throwing when destroying the Cloudinary asset fails", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    sqlMock.mockResolvedValueOnce([{ public_id: "memorial-grotto/family/abc" }])
    destroyAssetMock.mockRejectedValueOnce(new Error("cloudinary is down"))

    const result = await deleteGalleryImage("family", "1")

    expect(result.error).toBe("Não foi possível excluir a foto. Tente novamente.")
  })
})
