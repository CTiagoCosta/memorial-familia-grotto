import { afterEach, describe, expect, it, vi } from "vitest"

const configMock = vi.fn()
const apiSignRequestMock = vi.fn(() => "signed-abc")
const resourceMock = vi.fn()
const destroyMock = vi.fn()

vi.mock("cloudinary", () => ({
  v2: {
    config: configMock,
    utils: { api_sign_request: apiSignRequestMock },
    api: { resource: resourceMock },
    uploader: { destroy: destroyMock },
  },
}))

describe("lib/cloudinary", () => {
  const ORIGINAL_ENV = process.env

  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.clearAllMocks()
    vi.resetModules()
  })

  function setEnv() {
    process.env = {
      ...ORIGINAL_ENV,
      CLOUDINARY_CLOUD_NAME: "demo-cloud",
      CLOUDINARY_API_KEY: "key-123",
      CLOUDINARY_API_SECRET: "secret-xyz",
    }
  }

  it("GALLERY_FOLDER is memorial-grotto", async () => {
    setEnv()
    const { GALLERY_FOLDER } = await import("./cloudinary")
    expect(GALLERY_FOLDER).toBe("memorial-grotto")
  })

  it("imageUrl builds a Cloudinary URL with f_auto,q_auto and the given width", async () => {
    setEnv()
    const { imageUrl } = await import("./cloudinary")
    expect(imageUrl("memorial-grotto/family/abc", 800)).toBe(
      "https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto,w_800/memorial-grotto/family/abc",
    )
  })

  it("imageUrl throws a clear error when CLOUDINARY_CLOUD_NAME is missing", async () => {
    process.env = { ...ORIGINAL_ENV, CLOUDINARY_CLOUD_NAME: "" }
    const { imageUrl } = await import("./cloudinary")
    expect(() => imageUrl("memorial-grotto/family/abc", 800)).toThrow("CLOUDINARY_CLOUD_NAME")
  })

  it("createUploadSignature signs the exact public_id, asset_folder and timestamp and returns upload params", async () => {
    setEnv()
    const { createUploadSignature } = await import("./cloudinary")

    const result = createUploadSignature("memorial-grotto/family/abc-123", "memorial-grotto/family")

    expect(configMock).toHaveBeenCalledWith({
      cloud_name: "demo-cloud",
      api_key: "key-123",
      api_secret: "secret-xyz",
    })
    expect(apiSignRequestMock).toHaveBeenCalledWith(
      {
        asset_folder: "memorial-grotto/family",
        public_id: "memorial-grotto/family/abc-123",
        timestamp: expect.any(Number),
      },
      "secret-xyz",
    )
    expect(result).toEqual({
      cloudName: "demo-cloud",
      apiKey: "key-123",
      timestamp: expect.any(Number),
      publicId: "memorial-grotto/family/abc-123",
      assetFolder: "memorial-grotto/family",
      signature: "signed-abc",
    })
  })

  it("createUploadSignature throws a clear error when CLOUDINARY_API_SECRET is missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      CLOUDINARY_CLOUD_NAME: "demo-cloud",
      CLOUDINARY_API_KEY: "key-123",
      CLOUDINARY_API_SECRET: "",
    }
    const { createUploadSignature } = await import("./cloudinary")
    expect(() => createUploadSignature("memorial-grotto/family/abc-123", "memorial-grotto/family")).toThrow(
      "CLOUDINARY_API_SECRET",
    )
  })

  it("verifyAssetExists returns true when the resource lookup succeeds", async () => {
    setEnv()
    resourceMock.mockResolvedValue({ public_id: "memorial-grotto/family/abc" })
    const { verifyAssetExists } = await import("./cloudinary")

    await expect(verifyAssetExists("memorial-grotto/family/abc")).resolves.toBe(true)
    expect(resourceMock).toHaveBeenCalledWith("memorial-grotto/family/abc")
  })

  it("verifyAssetExists returns false when the resource lookup fails", async () => {
    setEnv()
    resourceMock.mockRejectedValue(new Error("not found"))
    const { verifyAssetExists } = await import("./cloudinary")

    await expect(verifyAssetExists("memorial-grotto/family/missing")).resolves.toBe(false)
  })

  it("destroyAsset calls the Cloudinary destroy API with the public id", async () => {
    setEnv()
    destroyMock.mockResolvedValue({ result: "ok" })
    const { destroyAsset } = await import("./cloudinary")

    await destroyAsset("memorial-grotto/family/abc")

    expect(destroyMock).toHaveBeenCalledWith("memorial-grotto/family/abc")
  })
})
