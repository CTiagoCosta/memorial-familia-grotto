"use server"

import { getSql } from "@/lib/db"
import {
  createUploadSignature,
  destroyAsset,
  GALLERY_FOLDER,
  imageUrl,
  verifyAssetExists,
  type UploadSignature,
} from "@/lib/cloudinary"
import { getFamilySession } from "@/lib/auth/get-family-session"
import { isGalleryScope, type GalleryImage, type GalleryScope } from "@/types/database"

interface ActionResult {
  error: string | null
}

interface GalleryImageRow {
  id: string
  scope: GalleryScope
  title: string
  description: string | null
  public_id: string
  created_at: string
}

const GALLERY_IMAGE_WIDTH = 1200

function mapRow(row: GalleryImageRow): GalleryImage {
  return {
    id: row.id,
    scope: row.scope,
    title: row.title,
    description: row.description,
    publicId: row.public_id,
    url: imageUrl(row.public_id, GALLERY_IMAGE_WIDTH),
    createdAt: row.created_at,
  }
}

export async function listGalleryImages(scope: GalleryScope): Promise<GalleryImage[]> {
  const sql = getSql()
  const rows = (await sql`
    select * from gallery_images where scope = ${scope} order by created_at desc
  `) as unknown as GalleryImageRow[]

  return rows.map(mapRow)
}

export async function getGalleryUploadSignature(scope: GalleryScope): Promise<UploadSignature | ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }
  if (!isGalleryScope(scope)) {
    return { error: "Escopo inválido." }
  }

  const assetFolder = `${GALLERY_FOLDER}/${scope}`
  const publicId = `${assetFolder}/${crypto.randomUUID()}`
  return createUploadSignature(publicId, assetFolder)
}

export async function registerGalleryImage(
  scope: GalleryScope,
  publicId: string,
  title: string,
  description: string,
): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }
  if (!isGalleryScope(scope)) {
    return { error: "Escopo inválido." }
  }

  const trimmedTitle = title.trim()
  if (!trimmedTitle) {
    return { error: "Título é obrigatório." }
  }

  const expectedPrefix = `${GALLERY_FOLDER}/${scope}/`
  if (!publicId.startsWith(expectedPrefix)) {
    return { error: "Imagem inválida." }
  }

  const exists = await verifyAssetExists(publicId)
  if (!exists) {
    return { error: "Imagem não encontrada no Cloudinary." }
  }

  try {
    const sql = getSql()
    await sql`
      insert into gallery_images (scope, title, description, public_id)
      values (${scope}, ${trimmedTitle}, ${description.trim() || null}, ${publicId})
    `
    return { error: null }
  } catch (error) {
    console.error(error)
    return { error: "Não foi possível salvar a foto. Tente novamente." }
  }
}

export async function deleteGalleryImage(scope: GalleryScope, imageId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  try {
    const sql = getSql()
    const rows = (await sql`
      select public_id from gallery_images where id = ${imageId}
    `) as unknown as { public_id: string }[]

    if (rows.length === 0) {
      return { error: "Foto não encontrada." }
    }

    await destroyAsset(rows[0].public_id)
    await sql`delete from gallery_images where id = ${imageId}`

    return { error: null }
  } catch (error) {
    console.error(error)
    return { error: "Não foi possível excluir a foto. Tente novamente." }
  }
}
