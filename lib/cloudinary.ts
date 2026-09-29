import { v2 as cloudinary } from "cloudinary"

export const GALLERY_FOLDER = "memorial-grotto"

interface CloudinaryEnv {
  cloudName: string
  apiKey: string
  apiSecret: string
}

function readEnv(): CloudinaryEnv {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName) {
    throw new Error("Missing environment variable: CLOUDINARY_CLOUD_NAME")
  }

  const apiKey = process.env.CLOUDINARY_API_KEY
  if (!apiKey) {
    throw new Error("Missing environment variable: CLOUDINARY_API_KEY")
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret) {
    throw new Error("Missing environment variable: CLOUDINARY_API_SECRET")
  }

  return { cloudName, apiKey, apiSecret }
}

function configure(): CloudinaryEnv {
  const env = readEnv()
  cloudinary.config({ cloud_name: env.cloudName, api_key: env.apiKey, api_secret: env.apiSecret })
  return env
}

export function imageUrl(publicId: string, width: number): string {
  const { cloudName } = readEnv()
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${publicId}`
}

export interface UploadSignature {
  cloudName: string
  apiKey: string
  timestamp: number
  publicId: string
  signature: string
}

// Signs the exact public_id (not just its folder), so the upload lands at
// that id regardless of whether the Cloudinary account uses classic or
// dynamic folder mode, and so the client cannot redirect the upload to a
// different id without invalidating the signature.
export function createUploadSignature(publicId: string): UploadSignature {
  const { cloudName, apiKey, apiSecret } = configure()
  const timestamp = Math.round(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request({ public_id: publicId, timestamp }, apiSecret)

  return { cloudName, apiKey, timestamp, publicId, signature }
}

export async function verifyAssetExists(publicId: string): Promise<boolean> {
  configure()
  try {
    await cloudinary.api.resource(publicId)
    return true
  } catch {
    return false
  }
}

export async function destroyAsset(publicId: string): Promise<void> {
  configure()
  await cloudinary.uploader.destroy(publicId)
}
