import { getGalleryUploadSignature, registerGalleryImage } from "@/actions/gallery"
import type { GalleryScope } from "@/types/database"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

interface UploadResult {
  error: string | null
}

export async function uploadGalleryPhoto(
  scope: GalleryScope,
  file: File | null,
  title: string,
  description: string,
): Promise<UploadResult> {
  const trimmedTitle = title.trim()

  if (!file || !trimmedTitle) {
    return { error: "Título e arquivo são obrigatórios." }
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Apenas arquivos de imagem são permitidos." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Arquivo muito grande. Máximo 5MB." }
  }

  const signatureResult = await getGalleryUploadSignature(scope)
  if ("error" in signatureResult) {
    return { error: signatureResult.error }
  }

  const { cloudName, apiKey, timestamp, publicId, signature } = signatureResult

  const uploadForm = new FormData()
  uploadForm.set("file", file)
  uploadForm.set("api_key", apiKey)
  uploadForm.set("timestamp", String(timestamp))
  uploadForm.set("signature", signature)
  uploadForm.set("public_id", publicId)

  try {
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadForm,
    })

    if (!uploadResponse.ok) {
      return { error: "Falha ao enviar a foto." }
    }
  } catch (error) {
    console.error(error)
    return { error: "Falha ao enviar a foto." }
  }

  // publicId was generated and signed by the server before the upload, so
  // it's the id the asset actually landed at regardless of what Cloudinary's
  // response echoes back.
  return registerGalleryImage(scope, publicId, trimmedTitle, description)
}
