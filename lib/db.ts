import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let cachedSql: NeonQueryFunction<false, false> | null = null

export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Missing environment variable: DATABASE_URL")
  }

  if (!cachedSql) {
    cachedSql = neon(url)
  }

  return cachedSql
}
