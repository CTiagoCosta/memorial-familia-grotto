"use server"

import { GALLERY_BUCKET, getServiceRoleClient } from "@/lib/supabase/server"
import { getFamilySession } from "@/lib/auth/get-family-session"
import type { GalleryImage, GalleryScope } from "@/types/database"

interface ActionResult {
  error: string | null
}

interface GalleryImageRow {
  id: string
  scope: GalleryScope
  title: string
  description: string | null
  storage_path: string
  created_at: string
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

function mapRow(row: GalleryImageRow, url: string): GalleryImage {
  return {
    id: row.id,
    scope: row.scope,
    title: row.title,
    description: row.description,
    storagePath: row.storage_path,
    url,
    createdAt: row.created_at,
  }
}

export async function listGalleryImages(scope: GalleryScope): Promise<GalleryImage[]> {
  const supabase = getServiceRoleClient()
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("scope", scope)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as GalleryImageRow[]).map((row) => {
    const { data: publicUrlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(row.storage_path)
    return mapRow(row, publicUrlData.publicUrl)
  })
}

export async function uploadGalleryImage(scope: GalleryScope, formData: FormData): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const file = formData.get("file")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!(file instanceof File) || !title) {
    return { error: "Título e arquivo são obrigatórios." }
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Apenas arquivos de imagem são permitidos." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Arquivo muito grande. Máximo 5MB." }
  }

  const supabase = getServiceRoleClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-")
  const storagePath = `${scope}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(storagePath, file)
  if (uploadError) {
    return { error: uploadError.message }
  }

  const { error: insertError } = await supabase.from("gallery_images").insert({
    scope,
    title,
    description: description || null,
    storage_path: storagePath,
  })

  return { error: insertError ? insertError.message : null }
}

export async function deleteGalleryImage(scope: GalleryScope, imageId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const supabase = getServiceRoleClient()
  const { data, error: fetchError } = await supabase
    .from("gallery_images")
    .select("storage_path")
    .eq("id", imageId)
    .single()

  if (fetchError || !data) {
    return { error: fetchError?.message ?? "Foto não encontrada." }
  }

  const { error: removeError } = await supabase.storage.from(GALLERY_BUCKET).remove([data.storage_path])
  if (removeError) {
    return { error: removeError.message }
  }

  const { error: deleteError } = await supabase.from("gallery_images").delete().eq("id", imageId)

  return { error: deleteError ? deleteError.message : null }
}
