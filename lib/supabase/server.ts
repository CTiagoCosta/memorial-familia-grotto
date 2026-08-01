import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cachedClient: SupabaseClient | null = null

export function getServiceRoleClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  if (!url) {
    throw new Error("Missing environment variable: SUPABASE_URL")
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY")
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }

  return cachedClient
}

export const GALLERY_BUCKET = "memorial-photos"
