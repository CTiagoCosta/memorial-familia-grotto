import { beforeEach, describe, expect, it, vi } from "vitest"

const { getGalleryUploadSignatureMock, registerGalleryImageMock } = vi.hoisted(() => ({
  getGalleryUploadSignatureMock: vi.fn(),
  registerGalleryImageMock: vi.fn(),
}))

vi.mock("@/actions/gallery", () => ({
  getGalleryUploadSignature: getGalleryUploadSignatureMock,
  registerGalleryImage: registerGalleryImageMock,
}))

import { uploadGalleryPhoto } from "./gallery-upload-client"

function makeFile(sizeBytes: number, type = "image/jpeg") {
  return new File([new Uint8Array(sizeBytes)], "foto.jpg", { type })
}

describe("uploadGalleryPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", vi.fn())
  })

  it("rejects when there is no file or the title is blank", async () => {
    const result = await uploadGalleryPhoto("family", null, "  ", "")
    expect(result.error).toBe("Título e arquivo são obrigatórios.")
    expect(getGalleryUploadSignatureMock).not.toHaveBeenCalled()
  })

  it("rejects a non-image file", async () => {
    const result = await uploadGalleryPhoto("family", makeFile(10, "text/plain"), "Foto", "")
    expect(result.error).toBe("Apenas arquivos de imagem são permitidos.")
    expect(getGalleryUploadSignatureMock).not.toHaveBeenCalled()
  })

  it("rejects a file over 5MB", async () => {
    const result = await uploadGalleryPhoto("family", makeFile(6 * 1024 * 1024), "Foto", "")
    expect(result.error).toBe("Arquivo muito grande. Máximo 5MB.")
    expect(getGalleryUploadSignatureMock).not.toHaveBeenCalled()
  })

  it("propagates the error when the signature action is not authorized", async () => {
    getGalleryUploadSignatureMock.mockResolvedValue({ error: "Não autorizado." })

    const result = await uploadGalleryPhoto("family", makeFile(10), "Foto", "")

    expect(result.error).toBe("Não autorizado.")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("uploads directly to Cloudinary with the signed public_id and then registers the image", async () => {
    getGalleryUploadSignatureMock.mockResolvedValue({
      cloudName: "demo",
      apiKey: "key-123",
      timestamp: 111,
      publicId: "memorial-grotto/family/abc",
      signature: "sig-abc",
    })
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ public_id: "memorial-grotto/family/abc" }), { status: 200 }),
    )
    registerGalleryImageMock.mockResolvedValue({ error: null })

    const result = await uploadGalleryPhoto("family", makeFile(10), " Piquenique ", " Um dia legal ")

    expect(fetch).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/demo/image/upload",
      expect.objectContaining({ method: "POST" }),
    )
    const [, options] = vi.mocked(fetch).mock.calls[0]
    const body = options?.body as FormData
    expect(body.get("api_key")).toBe("key-123")
    expect(body.get("timestamp")).toBe("111")
    expect(body.get("signature")).toBe("sig-abc")
    expect(body.get("public_id")).toBe("memorial-grotto/family/abc")

    // Uses the server-generated publicId directly, not whatever Cloudinary's
    // response happens to echo back.
    expect(registerGalleryImageMock).toHaveBeenCalledWith(
      "family",
      "memorial-grotto/family/abc",
      "Piquenique",
      " Um dia legal ",
    )
    expect(result.error).toBeNull()
  })

  it("returns an error when the Cloudinary upload response is not ok", async () => {
    getGalleryUploadSignatureMock.mockResolvedValue({
      cloudName: "demo",
      apiKey: "key-123",
      timestamp: 111,
      publicId: "memorial-grotto/family/abc",
      signature: "sig-abc",
    })
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 400 }))

    const result = await uploadGalleryPhoto("family", makeFile(10), "Foto", "")

    expect(result.error).toBe("Falha ao enviar a foto.")
    expect(registerGalleryImageMock).not.toHaveBeenCalled()
  })

  it("returns a generic error instead of throwing when the Cloudinary request itself fails", async () => {
    getGalleryUploadSignatureMock.mockResolvedValue({
      cloudName: "demo",
      apiKey: "key-123",
      timestamp: 111,
      publicId: "memorial-grotto/family/abc",
      signature: "sig-abc",
    })
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"))

    const result = await uploadGalleryPhoto("family", makeFile(10), "Foto", "")

    expect(result.error).toBe("Falha ao enviar a foto.")
    expect(registerGalleryImageMock).not.toHaveBeenCalled()
  })
})
